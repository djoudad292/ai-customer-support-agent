import { Module } from '@nestjs/common';
import { WidgetController } from './widget.controller';
import { WidgetChatController } from './widget-chat.controller';
import { WidgetChatService } from './widget-chat.service';
import { WidgetGateway } from '../gateway/widget.gateway';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [AgentModule],
  controllers: [WidgetController, WidgetChatController],
  providers: [WidgetGateway, WidgetChatService],
})
export class WidgetModule {}
