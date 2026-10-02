import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../common/prisma.service';
import { EmbeddingService } from './embedding.service';
import {
  buildChunkInsertQuery,
  buildVectorSearchQuery,
  DEFAULT_SIMILARITY_THRESHOLD,
  toVectorLiteral,
  ChunkInsertRow,
} from './vector-search';

/** Which retrieval path produced a result set. */
export type RetrievalMode = 'vector' | 'keyword-degraded';

export interface KbChunkHit {
  text: string;
  similarity: number;
  /** Document id the chunk belongs to. */
  source: string;
}

export interface KbSearchResult {
  results: KbChunkHit[];
  mode: RetrievalMode;
}

/** Chunks handed to the model per turn (unchanged from the keyword era). */
const RESULT_LIMIT = 4;
/** Rows re-embedded per request. Bounded so a cold tenant cannot hang a chat turn. */
const BACKFILL_BATCH = 8;
/** Hard ceiling on the degraded keyword scan. */
const KEYWORD_SCAN_LIMIT = 2000;
const KEYWORD_MIN_SCORE = 0.1;
const SEARCH_MIN_SCORE = 0.3;
const SEARCH_RESULT_LIMIT = 5;

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'your', 'our', 'was', 'were', 'has', 'have',
  'had', 'this', 'that', 'these', 'those', 'with', 'from', 'into', 'out', 'how', 'what', 'when',
  'where', 'which', 'who', 'why', 'can', 'could', 'would', 'should', 'will', 'shall', 'does',
  'did', 'about', 'there', 'their', 'them', 'they', 'been', 'being', 'any', 'all', 'some',
  'please', 'thanks', 'thank', 'hello', 'hi', 'hey',
]);

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    private prisma: PrismaService,
    private embedding: EmbeddingService,
  ) {}

  async findAll(companyId: string) {
    return this.prisma.document.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    companyId: string;
    title: string;
    content: string;
    filename?: string;
  }) {
    const doc = await this.prisma.document.create({
      data: {
        id: crypto.randomUUID(),
        companyId: data.companyId,
        title: data.title,
        content: data.content,
        filename: data.filename || null,
        pageCount: 1,
        status: 'ready',
        published: true,
      },
    });
    // Persist retrieval chunks — without these the agent has no knowledge.
    await this.chunkAndStore(doc.id, data.companyId, data.content);
    return doc;
  }

  async update(id: string, data: { title?: string; content?: string }) {
    const updateData: any = { ...data };
    if (data.content) {
      updateData.status = 'processing';
    }
    const doc = await this.prisma.document.update({ where: { id }, data: updateData });
    if (data.content) {
      await this.prisma.$executeRaw`DELETE FROM chunks WHERE document_id = ${id}`;
      await this.chunkAndStore(id, doc.companyId, data.content);
      await this.prisma.document.update({ where: { id }, data: { status: 'ready' } });
    }
    return doc;
  }

  async delete(id: string) {
    await this.prisma.chunk.deleteMany({ where: { documentId: id } });
    return this.prisma.document.delete({ where: { id } });
  }

  /**
   * Store content as retrievable chunk rows with real 1536-dim embeddings.
   * When no embedding is available (no OPENAI_API_KEY, or the API call failed)
   * the row is stored keyword-only with a NULL embedding and retrieval reports
   * `keyword-degraded` instead of pretending to be semantic.
   */
  private async chunkAndStore(documentId: string, companyId: string, content: string) {
    const chunks = this.chunkText(content);
    if (!chunks.length) return;

    const rows: ChunkInsertRow[] = [];
    let embedded = 0;
    for (let i = 0; i < chunks.length; i++) {
      const vector = this.embedding.isConfigured
        ? await this.embedding.tryGenerateEmbedding(chunks[i])
        : null;
      if (vector) embedded++;
      rows.push({
        id: crypto.randomUUID(),
        documentId,
        companyId,
        chunkIndex: i,
        chunkText: chunks[i],
        vector: vector ? toVectorLiteral(vector) : null,
      });
    }

    await this.prisma.$executeRaw(buildChunkInsertQuery(rows));
    this.logger.log(
      `Chunked document ${documentId}: ${rows.length} chunks, ${embedded} with embeddings` +
        (embedded === 0 ? ' (keyword-only)' : ''),
    );
  }

  /**
   * Self-healing migration. Two cases matter:
   * 1. tenant has no chunks at all — chunk its published documents;
   * 2. tenant has chunks but some have `embedding IS NULL` (written before
   *    embeddings existed, or during an OpenAI outage) — re-embed them in
   *    bounded batches so retrieval converges to vector mode.
   */
  private async ensureChunks(companyId: string) {
    const total = await this.countChunks(companyId);
    if (total === 0) {
      const docs = await this.prisma.document.findMany({
        where: { companyId, published: true },
      });
      for (const d of docs) {
        await this.chunkAndStore(d.id, companyId, d.content);
      }
      return;
    }
    if (!this.embedding.isConfigured) return;
    // Cheap COUNT first: the common case is a fully embedded tenant, and this
    // must not cost an OpenAI round trip on every chat message.
    const pending = await this.countChunksMissingEmbedding(companyId);
    if (pending === 0) return;
    this.logger.log(`Re-embedding ${Math.min(pending, BACKFILL_BATCH)} of ${pending} keyword-only chunks`);
    await this.backfillMissingEmbeddings(companyId);
  }

  private async countChunks(companyId: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM chunks WHERE company_id = ${companyId}
    `;
    return rows[0]?.n ?? 0;
  }

  private async countChunksMissingEmbedding(companyId: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM chunks
      WHERE company_id = ${companyId} AND embedding IS NULL
    `;
    return rows[0]?.n ?? 0;
  }

  /** Re-embed up to BACKFILL_BATCH keyword-only chunks; the rest follow next call. */
  private async backfillMissingEmbeddings(companyId: string) {
    const rows = await this.prisma.$queryRaw<{ id: string; chunk_text: string }[]>`
      SELECT id, chunk_text FROM chunks
      WHERE company_id = ${companyId} AND embedding IS NULL
      ORDER BY created_at ASC
      LIMIT ${BACKFILL_BATCH}::int
    `;
    if (!rows.length) return;

    let filled = 0;
    for (const row of rows) {
      const vector = await this.embedding.tryGenerateEmbedding(row.chunk_text);
      if (!vector) continue;
      await this.prisma.$executeRaw`
        UPDATE chunks SET embedding = ${toVectorLiteral(vector)}::vector WHERE id = ${row.id}
      `;
      filled++;
    }
    if (filled > 0) {
      this.logger.log(`Backfilled ${filled} chunk embeddings for company ${companyId}`);
    }
  }

  /**
   * Retrieval. Vector (pgvector cosine) is the real path; the keyword scorer
   * only runs when no embedding is available, and the returned `mode` tells
   * the caller that the answer was built on degraded retrieval.
   */
  async searchChunks(companyId: string, query: string): Promise<KbSearchResult> {
    await this.ensureChunks(companyId);
    const q = typeof query === 'string' ? query.trim() : '';
    if (!q) return { results: [], mode: await this.modeFor(companyId) };

    if (this.embedding.isConfigured) {
      const vector = await this.embedding.tryGenerateEmbedding(q);
      if (vector) {
        const hits = await this.vectorSearch(companyId, vector);
        if (hits) {
          if (hits.length > 0) {
            return { results: hits.slice(0, RESULT_LIMIT), mode: 'vector' };
          }
          // Nothing above threshold. Only override that while chunks are
          // still keyword-only — otherwise an honest "no match" is the answer.
          if ((await this.countChunksMissingEmbedding(companyId)) === 0) {
            return { results: [], mode: 'vector' };
          }
          this.logger.warn(
            'Vector search returned nothing while chunks are still awaiting embeddings — degrading to keyword mode',
          );
        }
      }
    }

    return { results: await this.keywordSearch(companyId, q), mode: 'keyword-degraded' };
  }

  /** @returns null when the vector query itself fails, so the caller can degrade. */
  private async vectorSearch(companyId: string, embedding: number[]): Promise<KbChunkHit[] | null> {
    const query = buildVectorSearchQuery({
      companyId,
      embedding,
      limit: RESULT_LIMIT,
      threshold: DEFAULT_SIMILARITY_THRESHOLD,
    });
    try {
      const rows = await this.prisma.$queryRaw<KbChunkHit[]>(query);
      return rows.map((r) => ({
        text: r.text,
        similarity: Number(r.similarity),
        source: r.source,
      }));
    } catch (err) {
      this.logger.warn(
        `Vector retrieval failed (${(err as Error).message?.slice(0, 200)}) — degrading to keyword mode`,
      );
      return null;
    }
  }

  /**
   * Degraded path: lexical scoring in Node. Bounded by KEYWORD_SCAN_LIMIT so a
   * large tenant cannot exhaust memory — this path is the reason vector search
   * exists, not a replacement for it.
   */
  private async keywordSearch(companyId: string, query: string): Promise<KbChunkHit[]> {
    const rows = await this.prisma.$queryRaw<{ id: string; document_id: string; chunk_text: string }[]>`
      SELECT id, document_id, chunk_text FROM chunks
      WHERE company_id = ${companyId}
      ORDER BY chunk_index ASC
      LIMIT ${KEYWORD_SCAN_LIMIT}::int
    `;

    const candidates = rows.filter((r) => r?.chunk_text);
    if (!candidates.length) return [];

    const documents = candidates.map((r) => {
      const tokens = this.tokenize(r.chunk_text);
      return { row: r, tokens, stems: new Set(tokens.map((t) => this.stem(t))) };
    });
    const total = documents.length;
    const weights = new Map<string, number>();
    for (const term of new Set(this.tokenize(query).map((t) => this.stem(t)))) {
      const df = documents.filter((d) => d.stems.has(term)).length;
      weights.set(term, 1 + Math.log(1 + total / (1 + df)));
    }

    return documents
      .map((d) => ({
        text: d.row.chunk_text,
        similarity: this.similarityScore(query, d.row.chunk_text, {
          tokens: d.tokens,
          weights,
        }),
        source: d.row.document_id,
      }))
      .filter((r) => r.similarity >= KEYWORD_MIN_SCORE)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, RESULT_LIMIT);
  }

  /**
   * Document-level search for the admin API. Routed through the same vector
   * path so the dashboard does not quietly keep scoring keywords, and the
   * retrieval mode rides along on every row.
   */
  async search(companyId: string, query: string) {
    const { results, mode } = await this.searchChunks(companyId, query);
    if (!results.length) return [];

    const best = new Map<string, KbChunkHit>();
    for (const hit of results) {
      const current = best.get(hit.source);
      if (!current || hit.similarity > current.similarity) best.set(hit.source, hit);
    }

    const docs = await this.prisma.document.findMany({
      where: { companyId, id: { in: [...best.keys()] } },
      select: { id: true, title: true },
    });
    const titles = new Map(docs.map((d) => [d.id, d.title]));

    return [...best.values()]
      // 0.3 is a lexical-scale floor; cosine hits already passed the vector
      // threshold, so the floor only applies to the degraded path.
      .filter((hit) => mode !== 'keyword-degraded' || hit.similarity >= SEARCH_MIN_SCORE)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, SEARCH_RESULT_LIMIT)
      .map((hit) => ({
        id: hit.source,
        title: titles.get(hit.source) ?? 'Untitled',
        content: hit.text.slice(0, 500),
        score: Number(hit.similarity.toFixed(4)),
        retrievalMode: mode,
      }));
  }

  /** Best-effort mode label for an empty query (no retrieval was attempted). */
  private async modeFor(companyId: string): Promise<RetrievalMode> {
    if (!this.embedding.isConfigured) return 'keyword-degraded';
    return (await this.countChunksMissingEmbedding(companyId)) === 0 ? 'vector' : 'keyword-degraded';
  }

  /**
   * Paragraph- then sentence-boundary-aware chunking. The old fixed-offset
   * slice cut mid-sentence, which produces chunks that read as fragments to
   * both the embedder and the model.
   */
  private chunkText(text: string, targetChars = 1000, overlapChars = 200): string[] {
    const normalized = (text || '').replace(/\r\n/g, '\n').trim();
    if (!normalized) return [];

    const segments: string[] = [];
    for (const paragraph of normalized.split(/\n{2,}/)) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;
      if (trimmed.length <= targetChars) {
        segments.push(trimmed);
        continue;
      }
      for (const sentence of this.splitSentences(trimmed)) {
        segments.push(sentence);
      }
    }
    if (!segments.length) return [];

    const chunks: string[] = [];
    let current = '';
    for (const segment of segments) {
      if (segment.length > targetChars) {
        // A single sentence longer than the target: flush, then hard-split it
        // on the last whitespace that fits so we never emit a giant chunk.
        if (current) {
          chunks.push(current.trim());
          current = '';
        }
        let rest = segment;
        while (rest.length > targetChars) {
          let cut = rest.lastIndexOf(' ', targetChars);
          if (cut <= 0) cut = targetChars;
          chunks.push(rest.slice(0, cut).trim());
          rest = rest.slice(cut);
        }
        current = rest.trim();
        continue;
      }
      const candidate = current ? `${current} ${segment}` : segment;
      if (candidate.length <= targetChars) {
        current = candidate;
        continue;
      }
      chunks.push(current.trim());
      // Overlap: carry the tail of the emitted chunk forward, on a sentence
      // boundary when one is available in the tail.
      const tail = current.slice(-overlapChars);
      const boundary = tail.search(/[.!?]\s/);
      current = (boundary >= 0 ? tail.slice(boundary + 1) : tail).trim();
      current = current ? `${current} ${segment}` : segment;
    }
    if (current.trim()) chunks.push(current.trim());

    return chunks.filter((c) => c.length > 0);
  }

  /** Sentence boundaries for common terminators; abbreviation-safe enough for support copy. */
  private splitSentences(paragraph: string): string[] {
    const parts = paragraph.match(/[^.!?]+[.!?]*\s*/g);
    if (!parts) return [paragraph];
    return parts.map((p) => p.trim()).filter(Boolean);
  }

  /**
   * Lexical relevance, used only in keyword-degraded mode. Token-based with
   * light stemming and IDF weighting, instead of the old raw
   * `content.includes(word)` substring count that scored "refund" as a full
   * hit inside "refundable" and treated every term as equally informative.
   */
  private similarityScore(
    query: string,
    content: string,
    context?: { tokens: string[]; weights: Map<string, number> },
  ): number {
    const terms = this.tokenize(query);
    if (terms.length === 0) return 0;

    const contentTokens = context?.tokens ?? this.tokenize(content);
    const stemmed = new Set(contentTokens.map((t) => this.stem(t)));

    let matched = 0;
    let totalWeight = 0;
    for (const term of terms) {
      const weight = context?.weights.get(term) ?? 1;
      totalWeight += weight;
      const stem = this.stem(term);
      let credit = stemmed.has(stem) || stemmed.has(term) ? 1 : 0;
      if (!credit && stem.length >= 4) {
        // Partial credit for morphological variants ("refund" ~ "refunds").
        credit = [...stemmed].some((t) => t.startsWith(stem) || stem.startsWith(t)) ? 0.5 : 0;
      }
      matched += credit * weight;
    }
    if (totalWeight === 0) return 0;
    return matched / totalWeight;
  }

  /** Lowercase content words, with stopwords and noise removed. */
  private tokenize(text: string): string[] {
    return (text || '')
      .toLowerCase()
      // Hyphens and apostrophes split: "non-refundable" must yield "refundable",
      // not one opaque token that no term can ever match.
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  }

  /** Conservative suffix stripper — enough to unify plural/gerund forms. */
  private stem(word: string): string {
    if (word.length <= 4) return word;
    const stemmed = word
      .replace(/(ies|ied)$/, 'y')
      .replace(/(ing|ers|ings|ed|es|s)$/, '');
    return stemmed.length >= 3 ? stemmed : word;
  }
}
