import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.company.findUnique({ where: { id } });
  }

  async update(id: string, data: { name?: string; settings?: any }) {
    return this.prisma.company.update({ where: { id }, data });
  }
}
