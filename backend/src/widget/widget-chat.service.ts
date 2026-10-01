import { Injectable, Logger } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { PrismaService } from '../common/prisma.service';

export interface WidgetChatPayload {
  type: 'message' | 'error';
  conversationId?: string | null;
  content: string;
  action?: string | null;
  actionSummary?: string;
  executed?: unknown[];
  cited?: boolean;
  code?: string;
}

/**
 * One place where a guest chat turn is executed and shaped, shared by the
 * WebSocket gateway and the stateless REST endpoint. Serverless hosts have no
 * long-lived socket, so the REST path must produce the exact same payload the
 * widget clients already parse.
 */
@Injectable()
export class WidgetChatService {
  private logger = new Logger(WidgetChatService.name);

  constructor(
    private agentService: AgentService,
    private prisma: PrismaService,
  ) {}

  async run(opts: {
    companyId?: string | null;
    conversationId?: string | null;
    message: string;
  }): Promise<WidgetChatPayload> {
    const message = typeof opts.message === 'string' ? opts.message.trim() : '';
    const companyId = typeof opts.companyId === 'string' ? opts.companyId : '';
    if (!message || !companyId) {
      return { type: 'error', content: 'Missing company', code: 'BAD_REQUEST' };
    }

    const conversationId = await this.safeConversationId(companyId, opts.conversationId);

    try {
      const result = await this.agentService.chat(
        companyId,
        conversationId || crypto.randomUUID(),
        message,
      );

      // Cited = response references sourced rules (criterion/page/section markers).
      const cited = /(criteri|§\s*|page\s+\d|section\s+[a-z]|[MBR]-\d)/i.test(
        result.response || '',
      );

      return {
        type: 'message',
        conversationId: result.conversationId,
        content: result.response,
        action: result.action || null,
        actionSummary: result.actionSummary || '',
        executed: Array.isArray(result.executed) ? (result.executed as unknown[]) : [],
        cited,
      };
    } catch (err) {
      const code = (err as Error).message || '';
      this.logger.error(`Widget chat failed: ${code}`);
      // Distinct honest errors (frontend retries on these) instead of one
      // generic message that hides whether it is data or provider failure.
      const content = code.includes('NO_CRITERIA')
        ? 'No criteria documents are loaded for this evaluation yet. Please retry in a minute or book a live run.'
        : 'Sorry, something went wrong. Please try again.';
      return { type: 'error', content, code };
    }
  }

  /**
   * Guest isolation, stateless edition: a client-supplied id is only honoured
   * when that conversation actually belongs to the company the caller claims.
   * Anything else starts a fresh thread instead of appending to a foreign one.
   */
  private async safeConversationId(
    companyId: string,
    conversationId: unknown,
  ): Promise<string | undefined> {
    if (typeof conversationId !== 'string' || !conversationId) return undefined;
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { companyId: true },
    });
    return conversation && conversation.companyId === companyId
      ? conversationId
      : undefined;
  }
}
