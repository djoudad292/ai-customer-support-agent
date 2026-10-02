import { Prisma } from '@prisma/client';

import { EMBEDDING_DIM } from './embedding.service';

/**
 * Cosine-similarity floor for a chunk to count as relevant. Mirrors the
 * proven value used by the sibling receptionist backend; a chunk below it is
 * not "knowledge", it is noise fed to the model.
 */
export const DEFAULT_SIMILARITY_THRESHOLD = 0.25;

/** pgvector text input format. */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

export interface VectorSearchParams {
  companyId: string;
  embedding: number[];
  limit: number;
  threshold?: number;
}

/**
 * Cosine search executed entirely in Postgres: the HNSW index on
 * `chunks.embedding` does the ranking, so tenant data no longer scales into
 * Node memory. Never call this with a placeholder vector — rows are guarded by
 * `embedding IS NOT NULL` and a hash vector would rank by noise.
 */
export function buildVectorSearchQuery(params: VectorSearchParams): Prisma.Sql {
  if (!Array.isArray(params.embedding) || params.embedding.length !== EMBEDDING_DIM) {
    throw new Error(
      `refusing to build a vector query for a ${params.embedding?.length ?? 0}-dim vector (expected ${EMBEDDING_DIM})`,
    );
  }
  const threshold = params.threshold ?? DEFAULT_SIMILARITY_THRESHOLD;
  const vector = Prisma.sql`${toVectorLiteral(params.embedding)}::vector`;

  return Prisma.sql`
    SELECT c.chunk_text AS "text",
           c.document_id AS "source",
           ROUND((1 - (c.embedding <=> ${vector}))::numeric, 4)::float8 AS similarity
    FROM chunks c
    WHERE c.company_id = ${params.companyId}
      AND c.embedding IS NOT NULL
      AND (1 - (c.embedding <=> ${vector})) >= ${threshold}::float8
    ORDER BY c.embedding <=> ${vector}
    LIMIT ${params.limit}::int
  `;
}

export interface ChunkInsertRow {
  id: string;
  documentId: string;
  companyId: string;
  chunkIndex: number;
  chunkText: string;
  /** pgvector literal, or null to store the row keyword-only. */
  vector: string | null;
}

/** One multi-row INSERT so re-chunking a document is a single round trip. */
export function buildChunkInsertQuery(rows: ChunkInsertRow[]): Prisma.Sql {
  if (!rows.length) {
    throw new Error('buildChunkInsertQuery called with no rows');
  }
  const values = rows.map((row) =>
    Prisma.sql`(${row.id}, ${row.documentId}, ${row.companyId}, ${row.chunkIndex}, ${row.chunkText}, ${
      row.vector ? Prisma.sql`${row.vector}::vector` : Prisma.sql`NULL::vector`
    })`,
  );
  return Prisma.sql`
    INSERT INTO chunks (id, document_id, company_id, chunk_index, chunk_text, embedding)
    VALUES ${Prisma.join(values, ',')}
  `;
}
