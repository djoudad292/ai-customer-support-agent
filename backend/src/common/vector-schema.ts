import { Logger } from '@nestjs/common';

/**
 * Minimal shape of the Prisma client these statements need. Declared here so
 * the helper stays free of an import cycle with PrismaService and can be driven
 * from a plain `new PrismaClient()` in scripts/tests.
 */
export interface RawExecutor {
  $executeRawUnsafe(sql: string): Promise<number>;
}

/**
 * Idempotent, non-fatal pgvector bootstrap. There is no `prisma/migrations/`
 * directory in this repo, so the extension and the HNSW index are created from
 * raw SQL. Both statements are `IF NOT EXISTS`, and neither may ever block
 * boot: on managed Postgres `CREATE EXTENSION` can be denied, and HNSW build
 * can fail on a tiny table or an older pgvector. Retrieval still works without
 * the index (a sequential scan), it is just slower.
 */
export const VECTOR_BOOTSTRAP_STATEMENTS: string[] = [
  'CREATE EXTENSION IF NOT EXISTS vector',
  'CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw ON chunks USING hnsw (embedding vector_cosine_ops)',
];

const logger = new Logger('VectorSchema');

export async function ensureVectorSchema(db: RawExecutor): Promise<void> {
  for (const sql of VECTOR_BOOTSTRAP_STATEMENTS) {
    try {
      await db.$executeRawUnsafe(sql);
      logger.log(`Applied: ${sql}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`Non-fatal vector schema step failed — ${sql} → ${message.slice(0, 200)}`);
    }
  }
}
