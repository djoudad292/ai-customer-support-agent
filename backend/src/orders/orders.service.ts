import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, query?: { status?: string; page?: number }) {
    const page = query?.page || 1;
    const limit = 20;
    const where: any = { companyId };
    if (query?.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findByNumber(companyId: string, orderNumber: string) {
    return this.prisma.order.findFirst({
      where: { companyId, orderNumber },
    });
  }

  async create(data: {
    companyId: string;
    orderNumber: string;
    customerName?: string;
    customerEmail?: string;
    items?: any;
    total?: number;
    status?: string;
    shippingAddress?: string;
  }) {
    return this.prisma.order.create({
      data: { id: crypto.randomUUID(), ...data },
    });
  }

  async update(id: string, data: { status?: string; trackingNumber?: string; notes?: string }) {
    return this.prisma.order.update({ where: { id }, data });
  }

  async getCounts(companyId: string) {
    const [total, processing, shipped, delivered, cancelled] = await Promise.all([
      this.prisma.order.count({ where: { companyId } }),
      this.prisma.order.count({ where: { companyId, status: 'processing' } }),
      this.prisma.order.count({ where: { companyId, status: 'shipped' } }),
      this.prisma.order.count({ where: { companyId, status: 'delivered' } }),
      this.prisma.order.count({ where: { companyId, status: 'cancelled' } }),
    ]);
    return { total, processing, shipped, delivered, cancelled };
  }
}
