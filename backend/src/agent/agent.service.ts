import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AgentGraph } from './agent.graph';

@Injectable()
export class AgentService {
  private logger = new Logger(AgentService.name);

  private trace: any[] = [];

  constructor(
    private prisma: PrismaService,
    private agentGraph: AgentGraph,
  ) {}

  getTrace() {
    return this.trace;
  }

  async chat(companyId: string, conversationId: string, message: string) {
    this.logger.log(`Processing message for conversation ${conversationId}`);
    this.trace = []; // Reset trace for new request

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

    // Use stream to get intermediate steps
    const stream = await this.agentGraph.getCompiledGraph().stream({
      messages: [...history, { role: 'human', content: message }],
      companyId,
      conversationId,
      pendingAction: null,
      pendingActionData: null,
      response: '',
    });

    let finalResult;
    for await (const update of stream) {
      this.trace.push(update);
      finalResult = update;
    }

    // Get final state
    const result = finalResult[Object.keys(finalResult)[0]];

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
      action: result.pendingAction,
      trace: this.trace, // Return trace for demo transparency
    };
  }
}
