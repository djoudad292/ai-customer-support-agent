import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { DiagController } from './diag.controller';

@Module({
  controllers: [HealthController, DiagController],
})
export class HealthModule {}
