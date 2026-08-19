import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, query?: { status?: string; priority?: string; page?: number }) {
    const page = query?.page || 1;
    const limit = 20;
    const where: any = { companyId };
    if (query?.status) where.status = query.status;
    if (query?.priority) where.priority = query.priority;

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    return this.prisma.ticket.findUnique({ where: { id } });
  }

  async create(data: {
    companyId: string;
    conversationId?: string;
    subject: string;
    description?: string;
    priority?: string;
    customerName?: string;
    customerEmail?: string;
  }) {
    const count = await this.prisma.ticket.count({ where: { companyId: data.companyId } });
    const ticketNumber = `TKT-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.ticket.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
        ticketNumber,
      },
    });
  }

  async update(id: string, data: { status?: string; priority?: string; assignedTo?: string }) {
    return this.prisma.ticket.update({ where: { id }, data });
  }

  async getCounts(companyId: string) {
    const [total, open, inProgress, resolved] = await Promise.all([
      this.prisma.ticket.count({ where: { companyId } }),
      this.prisma.ticket.count({ where: { companyId, status: 'open' } }),
      this.prisma.ticket.count({ where: { companyId, status: 'in_progress' } }),
      this.prisma.ticket.count({ where: { companyId, status: 'resolved' } }),
    ]);
    return { total, open, inProgress, resolved };
  }
}
