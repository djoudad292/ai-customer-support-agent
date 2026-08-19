import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, query?: { status?: string; page?: number }) {
    const page = query?.page || 1;
    const limit = 20;
    const where: any = { companyId };
    if (query?.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.lead.update({ where: { id }, data: { status } });
  }
}
