import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: { email: string; password: string; name: string; companyName: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const company = await this.prisma.company.create({
      data: {
        id: crypto.randomUUID(),
        name: data.companyName,
        slug: data.companyName.toLowerCase().replace(/\s+/g, '-'),
        plan: 'free',
        settings: {},
      },
    });

    const user = await this.prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: data.email,
        passwordHash,
        name: data.name,
        role: 'admin',
        companyId: company.id,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email, companyId: company.id });
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: company.id },
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, companyId: user.companyId });
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId };
  }
}
