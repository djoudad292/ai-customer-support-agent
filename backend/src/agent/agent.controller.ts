import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  constructor(private agentService: AgentService) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message to AI agent' })
  async chat(@Req() req: any, @Body() body: { conversationId: string; message: string }) {
    return this.agentService.chat(req.user.companyId, body.conversationId, body.message);
  }
}
