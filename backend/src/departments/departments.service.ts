import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.department.findMany({ where: { companyId } });
  }

  async create(data: { companyId: string; name: string; description?: string; email?: string }) {
    return this.prisma.department.create({
      data: {
        id: crypto.randomUUID(),
        companyId: data.companyId,
        name: data.name,
        description: data.description,
        email: data.email,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }
}
