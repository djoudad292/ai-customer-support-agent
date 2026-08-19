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
    const chunks = this.chunkText(data.content);

    return this.prisma.document.create({
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
  }

  async update(id: string, data: { title?: string; content?: string }) {
    const updateData: any = { ...data };
    if (data.content) {
      updateData.status = 'processing';
    }
    return this.prisma.document.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    await this.prisma.chunk.deleteMany({ where: { documentId: id } });
    return this.prisma.document.delete({ where: { id } });
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
