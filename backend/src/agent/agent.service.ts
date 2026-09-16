import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AgentGraph } from './agent.graph';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';

@Injectable()
export class AgentService {
  private logger = new Logger(AgentService.name);

  private trace: any[] = [];

  constructor(
    private prisma: PrismaService,
    private agentGraph: AgentGraph,
    private knowledgeBase: KnowledgeBaseService,
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

    // Fast path: prior-auth style evaluation prompts go straight to a single
    // cited RAG call (temp 0) instead of the generic support graph. This skips
    // a full LLM router round-trip (~20-30s) and guarantees citation-shaped
    // output instead of conversational chatter.
    if (/evaluate\b.*\bcriteria/i.test(message)) {
      const response = await this.evaluateWithCitations(companyId, message);
      await this.prisma.message.create({
        data: {
          id: crypto.randomUUID(),
          conversationId,
          senderType: 'agent',
          senderId: 'ai-agent',
          content: response,
        },
      });
      return { conversationId, response, action: null, trace: this.trace, metadata: null };
    }

    const history = conversation?.messages.map((m) => ({
      role: m.senderType === 'customer' ? 'human' : 'ai',
      content: m.content,
    })) || [];

    // Use stream to get intermediate steps
    let finalResult;
    try {
      const stream = await this.agentGraph.getCompiledGraph().stream({
        messages: [...history, { role: 'human', content: message }],
        companyId,
        conversationId,
        pendingAction: null,
        pendingActionData: null,
        response: '',
      });

      for await (const update of stream) {
        this.trace.push(update);
        finalResult = update;
      }
    } catch (streamError) {
      this.logger.error(`Stream error: ${streamError}`);
      // Fallback to invoke
      const result = await this.agentGraph.invoke({
        messages: [...history, { role: 'human', content: message }],
        companyId,
        conversationId,
      });
      return {
        conversationId,
        response: result.response,
        action: result.pendingAction,
        trace: this.trace,
        metadata: result.responseMetadata,
      };
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
      trace: this.trace,
      metadata: result.responseMetadata,
    };
  }

  /** TEMPORARY: server-side LLM probe. Remove after verification. */
  async probeLlm() {
    const out: any = { model: null, openrouter: null, gemini: [] };
    try {
      out.model = (this.agentGraph as any).config?.get?.('LLM_MODEL', 'default?') ?? 'n/a';
    } catch { out.model = 'n/a'; }
    const t0 = Date.now();
    try {
      const r = await (this.agentGraph as any).invokeLlm(
        [{ role: 'user', content: 'Say OK' }],
        { maxTokens: 16, temperature: 0 },
      );
      out.openrouter = { ok: true, ms: Date.now() - t0, reply: String(r).slice(0, 80) };
    } catch (e) {
      out.openrouter = { ok: false, ms: Date.now() - t0, err: String(e).slice(0, 300) };
    }
    return out;
  }

  /**
   * Single-call cited evaluation over the company knowledge base.
   * Throws NO_CRITERIA when nothing relevant is stored (honest failure),
   * or LLM_UNAVAILABLE when all providers fail — never a fake answer.
   */
  private async evaluateWithCitations(companyId: string, request: string): Promise<string> {
    const chunks = await this.knowledgeBase.searchChunks(companyId, request);
    if (!chunks.length) {
      throw new Error('NO_CRITERIA');
    }
    const prompt = `You are a prior-authorization clinical review assistant working with SAMPLE evaluation data (not medical advice).
Use ONLY the criteria below. Cite every rule you apply as [Criterion X-N] with its page/section.
If the request lacks information a criterion needs, state exactly what is missing and route to the exception queue / human review. Never invent criteria.

CRITERIA:
${chunks.join('\n\n')}

REQUEST:
${request}

Respond in exactly this shape:
1) Recommendation: APPROVE / NEEDS MORE INFO / FLAG FOR HUMAN REVIEW (one line)
2) Criteria applied: each with [Criterion X-N] + page/section
3) Missing: list, or "None"`;
    return this.agentGraph.invokeLlm(
      [
        { role: 'system', content: 'You evaluate prior-authorization requests against supplied sample criteria, with citations.' },
        { role: 'user', content: prompt },
      ],
      { maxTokens: 1024, temperature: 0 },
    );
  }
}
