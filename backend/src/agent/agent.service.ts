import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AgentGraph } from './agent.graph';

@Injectable()
export class AgentService {
  private logger = new Logger(AgentService.name);

  constructor(
    private prisma: PrismaService,
    private agentGraph: AgentGraph,
  ) {}

  async chat(companyId: string, conversationId: string, message: string) {
    this.logger.log(`Processing message for conversation ${conversationId}`);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      conversationId = crypto.randomUUID();
      await this.prisma.conversation.create({
        data: {
          id: conversationId,
          companyId,
          title: message.slice(0, 100),
          status: 'active',
        },
      });
    }

    await this.prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        conversationId,
        senderType: 'customer',
        content: message,
      },
    });

    const history = conversation?.messages.map((m) => ({
      role: m.senderType === 'customer' ? 'human' : 'ai',
      content: m.content,
    })) || [];

    const result = await this.agentGraph.invoke({
      messages: [...history, { role: 'human', content: message }],
      companyId,
      conversationId,
    });

    await this.prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        conversationId,
        senderType: 'agent',
        senderId: 'ai-agent',
        content: result.response,
      },
    });

    return {
      conversationId,
      response: result.response,
      action: result.action,
    };
  }
}
