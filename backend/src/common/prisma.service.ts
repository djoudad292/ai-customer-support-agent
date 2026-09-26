import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    // Render free tier sleeps the instance AND the Postgres cluster; waking the
    // app a few seconds before the DB is ready used to hard-crash boot into a
    // restart loop. Retry briefly instead — bad credentials still fail fast.
    const maxAttempts = 10;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        return;
      } catch (err) {
        if (attempt === maxAttempts) throw err;
        console.warn(
          `[Prisma] database not ready (attempt ${attempt}/${maxAttempts}), retrying in 4s`,
        );
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
