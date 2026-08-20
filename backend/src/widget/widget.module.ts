import { Module } from '@nestjs/common';
import { WidgetController } from './widget.controller';
import { WidgetGateway } from '../gateway/widget.gateway';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [AgentModule],
  controllers: [WidgetController],
  providers: [WidgetGateway],
})
export class WidgetModule {}