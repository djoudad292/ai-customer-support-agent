import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentGraph } from './agent.graph';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';

@Module({
  imports: [KnowledgeBaseModule],
  controllers: [AgentController],
  providers: [AgentService, AgentGraph],
  exports: [AgentService, AgentGraph],
})
export class AgentModule {}
