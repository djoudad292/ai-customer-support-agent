import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, query?: { status?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const where: any = { companyId };
    if (query?.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          leads: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        leads: true,
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.conversation.update({ where: { id }, data: { status } });
  }
}
