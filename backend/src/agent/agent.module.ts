import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentGraph } from './agent.graph';

@Module({
  controllers: [AgentController],
  providers: [AgentService, AgentGraph],
  exports: [AgentService, AgentGraph],
})
export class AgentModule {}
