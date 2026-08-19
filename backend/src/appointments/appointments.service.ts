import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, query?: { status?: string }) {
    const where: any = { companyId };
    if (query?.status) where.status = query.status;

    return this.prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'desc' },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.appointment.update({ where: { id }, data: { status } });
  }
}
