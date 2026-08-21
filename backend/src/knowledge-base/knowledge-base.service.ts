import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class KnowledgeBaseService {
  constructor(private prisma: PrismaService) {}

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
   * Store content as retrievable chunk rows. Embeddings stay NULL — retrieval
   * is keyword-scored (see searchChunks), which needs no external API and is
   * deterministic. Vector search can replace this later without schema change.
   */
  private async chunkAndStore(documentId: string, companyId: string, content: string) {
    const chunks = this.chunkText(content);
    for (let i = 0; i < chunks.length; i++) {
      await this.prisma.$executeRaw`
        INSERT INTO chunks (id, document_id, company_id, chunk_index, chunk_text, embedding)
        VALUES (${crypto.randomUUID()}, ${documentId}, ${companyId}, ${i}, ${chunks[i]}, NULL::vector)
      `;
    }
  }

  /**
   * Self-healing migration: tenants created before chunks were persisted get
   * backfilled from their documents on first retrieval.
   */
  private async ensureChunks(companyId: string) {
    const rows = await this.prisma.$queryRaw<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM chunks WHERE company_id = ${companyId}
    `;
    if ((rows[0]?.n ?? 0) > 0) return;
    const docs = await this.prisma.document.findMany({
      where: { companyId, published: true },
    });
    for (const d of docs) {
      await this.chunkAndStore(d.id, companyId, d.content);
    }
  }

  /** Keyword-scored retrieval over stored chunks. */
  async searchChunks(companyId: string, query: string): Promise<string[]> {
    await this.ensureChunks(companyId);
    const rows = await this.prisma.$queryRaw<{ chunk_text: string }[]>`
      SELECT chunk_text FROM chunks WHERE company_id = ${companyId}
    `;
    if (!rows.length) return [];
    const scored = rows
      .map((r) => ({ text: r.chunk_text, score: this.similarityScore(query, r.chunk_text) }))
      .filter((r) => r.score >= 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((r) => r.text);
    return scored;
  }

  async search(companyId: string, query: string) {
    const docs = await this.prisma.document.findMany({
      where: { companyId, published: true, status: 'ready' },
    });

    const results = docs
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content.slice(0, 500),
        score: this.similarityScore(query, doc.content),
      }))
      .filter((r) => r.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return results;
  }

  private chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private similarityScore(query: string, content: string): number {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const words = queryLower.split(/\s+/).filter((w) => w.length > 2);
    if (words.length === 0) return 0;
    const matches = words.filter((w) => contentLower.includes(w)).length;
    return matches / words.length;
  }
}
