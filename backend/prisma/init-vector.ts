/**
 * Idempotent pgvector bootstrap (extension + HNSW cosine index on chunks).
 *
 * Usage (prod DATABASE_URL from the Render/Neon dashboard):
 *   DATABASE_URL="postgresql://..." npx ts-node prisma/init-vector.ts
 *
 * The app also runs this on boot via PrismaService; this script exists for
 * environments where the runtime role cannot run DDL at request time.
 */
import { PrismaClient } from '@prisma/client';
import { ensureVectorSchema } from '../src/common/vector-schema';

async function main() {
  const prisma = new PrismaClient();
  try {
    await ensureVectorSchema(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('db:init failed:', err);
  process.exit(1);
});
