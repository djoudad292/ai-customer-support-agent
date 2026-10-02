import { Prisma } from '@prisma/client';

import {
  buildChunkInsertQuery,
  buildVectorSearchQuery,
  DEFAULT_SIMILARITY_THRESHOLD,
  toVectorLiteral,
} from './vector-search';
import { EMBEDDING_DIM, EmbeddingService } from './embedding.service';
import { KnowledgeBaseService } from './knowledge-base.service';

const VECTOR = Array.from({ length: EMBEDDING_DIM }, (_, i) => (i % 7) / EMBEDDING_DIM);

interface Recorded {
  sql: string;
  values: unknown[];
}

interface Reply {
  /** Matched against the SQL text the service issued. First match wins. */
  match: RegExp;
  result: any;
}

/** Records every raw statement; answers reads from ordered, SQL-matched replies. */
function makePrisma(replies: Reply[] = []) {
  const executed: Recorded[] = [];
  const queried: Recorded[] = [];

  const record = (args: any[]): Recorded => {
    const query = args[0];
    return query && typeof query === 'object' && 'sql' in query
      ? { sql: (query as Prisma.Sql).sql, values: (query as Prisma.Sql).values }
      : { sql: String(query), values: args.slice(1) };
  };

  const prisma: any = {
    $executeRaw: jest.fn(async (...args: any[]) => {
      executed.push(record(args));
      return 0;
    }),
    $queryRaw: jest.fn(async (...args: any[]) => {
      const entry = record(args);
      queried.push(entry);
      const reply = replies.find((r) => r.match.test(entry.sql));
      return reply ? reply.result : [];
    }),
    document: {
      findMany: jest.fn(async () => []),
      create: jest.fn(async ({ data }: any) => data),
    },
    chunk: { deleteMany: jest.fn(async () => ({ count: 0 })) },
  };
  return { prisma, executed, queried };
}

function makeService(prisma: any) {
  return new KnowledgeBaseService(prisma, new EmbeddingService());
}

function stubOpenAi(embedding: number[] = VECTOR) {
  const fetchMock = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ data: [{ embedding }] }),
    text: async () => '',
  }));
  (global as any).fetch = fetchMock;
  return fetchMock;
}

const originalKey = process.env.OPENAI_API_KEY;
const originalFetch = (global as any).fetch;

afterEach(() => {
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
  (global as any).fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('vector-search query builders', () => {
  it('builds a cosine search executed in Postgres with a threshold and LIMIT', () => {
    const q = buildVectorSearchQuery({ companyId: 'c1', embedding: VECTOR, limit: 4 });

    expect(q.sql).toContain('<=>');
    expect(q.sql).toContain('LIMIT');
    expect(q.sql).toContain('embedding IS NOT NULL');
    expect(q.sql).toContain('company_id');
    expect(q.sql).toContain('ORDER BY c.embedding <=>');
    expect(q.values).toContain('c1');
    expect(q.values).toContain(DEFAULT_SIMILARITY_THRESHOLD);
    expect(q.values).toContain(4);
  });

  it('binds the vector as a pgvector literal instead of inlining floats', () => {
    const q = buildVectorSearchQuery({ companyId: 'c1', embedding: VECTOR, limit: 2, threshold: 0.4 });
    expect(q.sql).toContain('::vector');
    expect(q.values).toContain(toVectorLiteral(VECTOR));
    expect(q.values).toContain(0.4);
  });

  it('refuses to build a vector query for a wrong-dimension (e.g. hash) vector', () => {
    expect(() => buildVectorSearchQuery({ companyId: 'c1', embedding: [0.1, 0.2], limit: 4 })).toThrow(
      /expected 1536/,
    );
  });

  it('inserts rows in one statement, casting vectors and allowing NULL', () => {
    const q = buildChunkInsertQuery([
      { id: '1', documentId: 'd', companyId: 'c', chunkIndex: 0, chunkText: 'a', vector: toVectorLiteral(VECTOR) },
      { id: '2', documentId: 'd', companyId: 'c', chunkIndex: 1, chunkText: 'b', vector: null },
    ]);
    expect(q.sql).toContain('INSERT INTO chunks');
    expect(q.values).toContain(toVectorLiteral(VECTOR));
    expect(q.sql).toContain('NULL::vector');
  });
});

describe('keyword-degraded scoring', () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('scores terms by token/stem overlap instead of raw substring matching', () => {
    const { prisma } = makePrisma();
    const service = makeService(prisma);
    const score = (query: string, content: string) =>
      (service as any).similarityScore(query, content);

    expect(score('refund window', 'Our refund window is 30 days from purchase.')).toBe(1);
    expect(score('refund policy', 'Support hours are Monday to Friday, 9 to 5 CET.')).toBe(0);
    // "refund" inside "refundable" is a morphological hit, not a full one.
    const partial = score('refund', 'The fee is non-refundable after delivery.');
    expect(partial).toBeGreaterThan(0);
    expect(partial).toBeLessThan(1);
    // Plural/gerund forms still match the stem.
    expect(score('refunding', 'We are refunding your order today.')).toBe(1);
    // Stopword-only or short queries score 0 instead of dividing by zero.
    expect(score('the of and', 'anything')).toBe(0);
    expect(score('', 'anything')).toBe(0);
  });

  it('returns keyword-degraded results ranked by lexical score when no key is set', async () => {
    const { prisma, executed, queried } = makePrisma([
      { match: /SELECT COUNT\(\*\)::int AS n FROM chunks/, result: [{ n: 2 }] },
      {
        match: /SELECT id, document_id, chunk_text/,
        result: [
          { id: '1', document_id: 'd1', chunk_text: 'Refunds are issued to the original payment method.' },
          { id: '2', document_id: 'd2', chunk_text: 'Our office is located in Lyon.' },
        ],
      },
    ]);
    const out = await makeService(prisma).searchChunks('c1', 'how do refunds work');

    expect(out.mode).toBe('keyword-degraded');
    expect(out.results).toHaveLength(1);
    expect(out.results[0].source).toBe('d1');
    expect(out.results[0].similarity).toBeGreaterThan(0);
    // Degraded retrieval never claims to be semantic, and writes nothing.
    expect(queried.some((q) => q.sql.includes('<=>'))).toBe(false);
    expect(executed).toHaveLength(0);
  });
});

describe('vector retrieval path', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'sk-test';
  });

  it('issues a pgvector cosine query and reports mode "vector"', async () => {
    stubOpenAi();
    const { prisma, queried } = makePrisma([
      { match: /SELECT COUNT\(\*\)::int AS n FROM chunks/, result: [{ n: 5 }] },
      { match: /embedding IS NULL[\s\S]*FROM chunks[\s\S]*LIMIT/, result: [] },
      {
        match: /<=>/,
        result: [
          { text: 'Refunds are issued to the original payment method.', source: 'd1', similarity: 0.8123 },
        ],
      },
    ]);
    const out = await makeService(prisma).searchChunks('c1', 'refund policy');

    expect(out.mode).toBe('vector');
    expect(out.results).toEqual([
      { text: 'Refunds are issued to the original payment method.', similarity: 0.8123, source: 'd1' },
    ]);
    const vectorQuery = queried.find((q) => q.sql.includes('<=>'));
    expect(vectorQuery).toBeDefined();
    expect(vectorQuery!.sql).toContain('LIMIT');
    expect(vectorQuery!.values).toContain(toVectorLiteral(VECTOR));
  });

  it('never sends a hash/placeholder vector: the bound literal has 1536 dimensions', async () => {
    stubOpenAi();
    const { prisma, queried } = makePrisma([
      { match: /SELECT COUNT\(\*\)::int AS n FROM chunks/, result: [{ n: 5 }] },
      { match: /<=>/, result: [{ text: 'chunk', source: 'd1', similarity: 0.5 }] },
    ]);
    await makeService(prisma).searchChunks('c1', 'refund policy');
    const literal = queried.find((q) => q.sql.includes('<=>'))!.values.find(
      (v) => typeof v === 'string' && v.startsWith('['),
    ) as string;
    expect(literal.slice(1, -1).split(',')).toHaveLength(EMBEDDING_DIM);
  });

  it('honestly reports an empty result when no chunk clears the similarity threshold', async () => {
    stubOpenAi();
    const { prisma } = makePrisma([
      // Most specific first: "chunks still missing embeddings" must be 0 for the
      // empty vector result to stand as an honest answer.
      { match: /COUNT\(\*\)::int AS n FROM chunks[\s\S]*embedding IS NULL/, result: [{ n: 0 }] },
      { match: /SELECT COUNT\(\*\)::int AS n FROM chunks/, result: [{ n: 5 }] },
      { match: /embedding IS NULL[\s\S]*FROM chunks[\s\S]*LIMIT/, result: [] },
      { match: /<=>/, result: [] },
    ]);
    const out = await makeService(prisma).searchChunks('c1', 'completely unrelated question');
    expect(out.mode).toBe('vector');
    expect(out.results).toEqual([]);
  });

  it('degrades to keyword mode when the OpenAI embedding call fails', async () => {
    (global as any).fetch = jest.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => 'invalid api key',
      json: async () => ({}),
    }));
    const { prisma, queried } = makePrisma([
      { match: /SELECT COUNT\(\*\)::int AS n FROM chunks/, result: [{ n: 1 }] },
      {
        match: /SELECT id, document_id, chunk_text/,
        result: [
          { id: '1', document_id: 'd1', chunk_text: 'Refunds are issued to the original payment method.' },
        ],
      },
    ]);
    const out = await makeService(prisma).searchChunks('c1', 'refund policy');

    expect(out.mode).toBe('keyword-degraded');
    expect(out.results[0].source).toBe('d1');
    expect(queried.some((q) => q.sql.includes('<=>'))).toBe(false);
  });

  it('degrades when the vector query itself fails at the database', async () => {
    stubOpenAi();
    const prisma: any = {
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn(async (query: any) => {
        if (String(query?.sql || query).includes('<=>')) {
          throw new Error('operator does not exist: vector <=> vector');
        }
        return [{ n: 0 }];
      }),
      document: { findMany: jest.fn(async () => []) },
      chunk: { deleteMany: jest.fn() },
    };
    const out = await makeService(prisma).searchChunks('c1', 'refund policy');
    expect(out.mode).toBe('keyword-degraded');
  });

  it('stores a real embedding on document create instead of NULL::vector', async () => {
    stubOpenAi();
    const { prisma, executed } = makePrisma();
    await makeService(prisma).create({ companyId: 'c1', title: 'Refunds', content: 'Refunds take 5 days.' });

    expect(executed).toHaveLength(1);
    expect(executed[0].sql).toContain('INSERT INTO chunks');
    expect(executed[0].sql).not.toContain('NULL::vector');
    expect(executed[0].values).toContain(toVectorLiteral(VECTOR));
  });
});

describe('ensureChunks backfill', () => {
  it('re-embeds rows whose embedding IS NULL even when the tenant already has chunks', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    stubOpenAi();
    const { prisma, executed } = makePrisma([
      { match: /SELECT COUNT\(\*\)::int AS n FROM chunks/, result: [{ n: 2 }] },
      {
        match: /SELECT id, chunk_text FROM chunks/,
        result: [{ id: 'chunk-1', chunk_text: 'Refunds are issued to the original payment method.' }],
      },
    ]);
    await makeService(prisma).searchChunks('c1', 'refund policy');

    const updates = executed.filter((e) => e.sql.includes('UPDATE chunks SET embedding'));
    expect(updates).toHaveLength(1);
    expect(updates[0].values).toContain('chunk-1');
    expect(updates[0].values).toContain(toVectorLiteral(VECTOR));
  });

  it('skips the backfill entirely when embeddings are not configured', async () => {
    delete process.env.OPENAI_API_KEY;
    const { prisma, executed } = makePrisma([{ match: /SELECT COUNT/, result: [{ n: 4 }] }]);
    await makeService(prisma).searchChunks('c1', 'refund policy');
    expect(executed.filter((e) => e.sql.includes('UPDATE chunks'))).toHaveLength(0);
  });

  it('chunks published documents when the tenant has none at all', async () => {
    delete process.env.OPENAI_API_KEY;
    const { prisma, executed } = makePrisma([{ match: /SELECT COUNT/, result: [{ n: 0 }] }]);
    (prisma.document.findMany as jest.Mock).mockResolvedValue([
      { id: 'doc-1', content: 'Refunds take 5 business days.' },
    ]);
    await makeService(prisma).searchChunks('c1', 'refund policy');
    expect(executed.some((e) => e.sql.includes('INSERT INTO chunks'))).toBe(true);
  });
});

describe('sentence-aware chunking', () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('never splits mid-sentence and respects the target size', () => {
    const { prisma } = makePrisma();
    const chunkText = (text: string, size: number, overlap: number) =>
      (makeService(prisma) as any).chunkText(text, size, overlap);

    const sentence = 'Our refund window is 30 days from the original purchase date. ';
    const chunks = chunkText(sentence.repeat(20), 400, 80);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(400);
      expect(chunk.trim()).not.toBe('');
      // Whole sentences only: starts at the text's opening words and ends on a
      // terminator, so no chunk is a sentence fragment.
      expect(sentence.trim().startsWith(chunk.slice(0, 20))).toBe(true);
      expect(/[.!?]$/.test(chunk.trim())).toBe(true);
    }
  });

  it('keeps short text intact and ignores empty input', () => {
    const { prisma } = makePrisma();
    const chunkText = (t: string) => (makeService(prisma) as any).chunkText(t);

    expect(chunkText('A short FAQ answer.')).toEqual(['A short FAQ answer.']);
    expect(chunkText('   ')).toEqual([]);
    expect(chunkText('One. Two.')).toEqual(['One. Two.']);
  });

  it('carries overlap forward so context is not lost between chunks', () => {
    const { prisma } = makePrisma();
    const sentence = 'Refunds are issued to the original payment method. ';
    const chunks = (makeService(prisma) as any).chunkText(sentence.repeat(12), 300, 100);

    expect(chunks.length).toBeGreaterThan(1);
    const firstSentenceOfNext = chunks[1].split(/(?<=\.)\s/)[0].trim();
    expect(chunks[0]).toContain(firstSentenceOfNext);
  });

  it('hard-splits a single sentence longer than the target on whitespace', () => {
    const { prisma } = makePrisma();
    const long = `${'a'.repeat(600)} ${'b'.repeat(600)}`;
    const chunks = (makeService(prisma) as any).chunkText(long, 500, 100);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(500);
  });
});
