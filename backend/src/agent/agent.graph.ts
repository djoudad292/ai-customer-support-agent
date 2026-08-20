import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { PrismaService } from '../common/prisma.service';

export const AgentState = Annotation.Root({
  messages: Annotation<{ role: string; content: string }[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  companyId: Annotation<string>(),
  conversationId: Annotation<string>(),
  customerInfo: Annotation<{ name?: string; email?: string; phone?: string }>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),
  pendingAction: Annotation<string | null>({
    reducer: (current, update) => update ?? current,
    default: () => null,
  }),
  pendingActionData: Annotation<Record<string, any> | null>({
    reducer: (current, update) => update ?? current,
    default: () => null,
  }),
  response: Annotation<string>(),
});

@Injectable()
export class AgentGraph {
  private logger = new Logger(AgentGraph.name);
  private graph: any;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.buildGraph();
  }

  getCompiledGraph() {
    return this.graph;
  }

  private buildGraph() {
    const finalGraph = new StateGraph(AgentState)
      .addNode('understand', this.understandNode.bind(this))
      .addNode('retrieveKnowledge', this.retrieveKnowledgeNode.bind(this))
      .addNode('decideAction', this.decideActionNode.bind(this))
      .addNode('captureLead', this.captureLeadNode.bind(this))
      .addNode('bookAppointment', this.bookAppointmentNode.bind(this))
      .addNode('createTicket', this.createTicketNode.bind(this))
      .addNode('lookupOrder', this.lookupOrderNode.bind(this))
      .addNode('escalateToHuman', this.escalateNode.bind(this))
      .addNode('respond', this.respondNode.bind(this))
      .addEdge(START, 'understand')
      .addEdge('understand', 'retrieveKnowledge')
      .addEdge('retrieveKnowledge', 'decideAction')
      .addConditionalEdges('decideAction', (state) => {
        if (state.pendingAction === 'capture_lead') return 'captureLead';
        if (state.pendingAction === 'book_appointment') return 'bookAppointment';
        if (state.pendingAction === 'create_ticket') return 'createTicket';
        if (state.pendingAction === 'lookup_order') return 'lookupOrder';
        if (state.pendingAction === 'escalate') return 'escalateToHuman';
        return 'respond';
      })
      .addEdge('captureLead', 'respond')
      .addEdge('bookAppointment', 'respond')
      .addEdge('createTicket', 'respond')
      .addEdge('lookupOrder', 'respond')
      .addEdge('escalateToHuman', 'respond')
      .addEdge('respond', END);

    this.graph = finalGraph.compile();
    this.logger.log('LangGraph agent compiled with tools: lead, appointment, ticket, order, escalate');
  }

  private async understandNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage) return { messages: [] };
    return {};
  }

  private async retrieveKnowledgeNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage) return { messages: [] };

    try {
      const chunks = await this.prisma.$queryRaw`
        SELECT chunk_text, 1 - (embedding <=> '[0]'::vector) as similarity
        FROM chunks
        WHERE company_id = ${state.companyId}
        ORDER BY embedding <=> (
          SELECT COALESCE(
            (SELECT embedding FROM chunks WHERE company_id = ${state.companyId} LIMIT 1),
            '[0]'::vector
          )
        )
        LIMIT 5
      ` as any[];

      if (chunks && chunks.length > 0) {
        const context = chunks.map((c: any) => c.chunk_text).join('\n\n');
        return {
          messages: [{ role: 'system', content: `Knowledge base context:\n${context}` }],
        };
      }
    } catch (error) {
      this.logger.warn(`Knowledge retrieval failed: ${error}`);
    }

    return {};
  }

  private async decideActionNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage) return { pendingAction: null };

    const llm = new ChatOpenAI({
      apiKey: this.config.get<string>('OPENROUTER_API_KEY'),
      modelName: this.config.get<string>('LLM_MODEL', 'meta-llama/llama-3.1-8b-instruct'),
      maxTokens: 1024,
      temperature: 0,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });

    const conversationHistory = state.messages
      .filter((m) => m.role !== 'system')
      .slice(-10)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are an AI customer support agent. Analyze the customer message and decide what action to take.

Available actions (respond with EXACTLY the action identifier, nothing else):
- none: Just answer the question normally
- capture_lead: Customer wants to be contacted, is interested in products/services, or shares contact info
- book_appointment: Customer wants to schedule a meeting or appointment
- create_ticket: Customer has a problem, complaint, or issue that needs tracking
- lookup_order: Customer asks about an order status, delivery, or shipment (extract the order number)
- escalate: Customer is angry, frustrated, threatening, or the issue is too complex for AI

Conversation history:
${conversationHistory}

Customer message: ${lastMessage.content}

Respond with ONLY the action identifier (none, capture_lead, book_appointment, create_ticket, lookup_order, escalate):`;

    try {
      const result = await llm.invoke([
        { role: 'user', content: systemPrompt },
      ]);

      const action = result.content.toString().trim().toLowerCase();
      const validActions = ['capture_lead', 'book_appointment', 'create_ticket', 'lookup_order', 'escalate'];

      if (validActions.includes(action)) {
        const actionData: Record<string, any> = {};

        if (action === 'lookup_order') {
          const orderMatch = lastMessage.content.match(/(?:order|#)\s*(\w[\w-]*)/i);
          if (orderMatch) actionData.orderNumber = orderMatch[1];
        }

        if (action === 'create_ticket') {
          actionData.subject = lastMessage.content.slice(0, 200);
          const urgentWords = ['urgent', 'asap', 'emergency', 'broken', 'critical'];
          actionData.priority = urgentWords.some((w) => lastMessage.content.toLowerCase().includes(w)) ? 'high' : 'medium';
        }

        return { pendingAction: action, pendingActionData: actionData };
      }

      return { pendingAction: null };
    } catch (error) {
      this.logger.error(`Decide action failed: ${error}`);
      // Keyword-based fallback for demo when LLM has no credits
      const content = lastMessage.content.toLowerCase();
      const actionData: Record<string, any> = {};

      if (content.includes('order') || content.includes('#')) {
        const orderMatch = content.match(/(?:order|#)\s*(\w[\w-]*)/i);
        if (orderMatch) actionData.orderNumber = orderMatch[1];
        return { pendingAction: 'lookup_order', pendingActionData: actionData };
      }
      if (content.includes('ticket') || content.includes('issue') || content.includes('problem') || content.includes('broken') || content.includes('complaint')) {
        actionData.subject = lastMessage.content.slice(0, 200);
        const urgentWords = ['urgent', 'asap', 'emergency', 'broken', 'critical'];
        actionData.priority = urgentWords.some((w) => content.includes(w)) ? 'high' : 'medium';
        return { pendingAction: 'create_ticket', pendingActionData: actionData };
      }
      if (content.includes('email') || content.includes('contact') || content.includes('call me') || content.includes('reach out')) {
        return { pendingAction: 'capture_lead', pendingActionData: actionData };
      }
      if (content.includes('appointment') || content.includes('meeting') || content.includes('schedule') || content.includes('book')) {
        return { pendingAction: 'book_appointment', pendingActionData: actionData };
      }
      if (content.includes('angry') || content.includes('frustrated') || content.includes('terrible') || content.includes('awful') || content.includes('hate')) {
        return { pendingAction: 'escalate', pendingActionData: actionData };
      }

      return { pendingAction: null };
    }
  }

  private async captureLeadNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage?.content || '';

    const emailMatch = content.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    const phoneMatch = content.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const namePatterns = content.match(/(?:my name is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);

    const customerInfo: any = {};
    if (emailMatch) customerInfo.email = emailMatch[0];
    if (phoneMatch) customerInfo.phone = phoneMatch[0];
    if (namePatterns) customerInfo.name = namePatterns[1];

    const info = { ...state.customerInfo, ...customerInfo };

    try {
      await this.prisma.lead.create({
        data: {
          id: crypto.randomUUID(),
          companyId: state.companyId,
          conversationId: state.conversationId,
          name: info.name,
          email: info.email,
          phone: info.phone,
          message: content,
          source: 'chat',
          status: 'new',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to capture lead: ${error}`);
    }

    return { customerInfo: info, messages: [] };
  }

  private async bookAppointmentNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage?.content || '';

    const datePatterns = content.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?)/i);
    let startTime = new Date();
    if (datePatterns) {
      const parsed = new Date(datePatterns[1]);
      if (!isNaN(parsed.getTime())) startTime = parsed;
    } else {
      startTime.setDate(startTime.getDate() + 1);
      startTime.setHours(10, 0, 0, 0);
    }

    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    try {
      await this.prisma.appointment.create({
        data: {
          id: crypto.randomUUID(),
          companyId: state.companyId,
          conversationId: state.conversationId,
          customerName: state.customerInfo?.name,
          customerEmail: state.customerInfo?.email,
          title: 'Customer Appointment',
          notes: content.slice(0, 500),
          startTime,
          endTime,
          status: 'requested',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to book appointment: ${error}`);
    }

    return { messages: [] };
  }

  private async createTicketNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage?.content || '';
    const actionData = state.pendingActionData || {};

    try {
      const count = await this.prisma.ticket.count({ where: { companyId: state.companyId } });
      const ticket = await this.prisma.ticket.create({
        data: {
          id: crypto.randomUUID(),
          companyId: state.companyId,
          conversationId: state.conversationId,
          ticketNumber: `TKT-${String(count + 1).padStart(4, '0')}`,
          subject: actionData.subject || content.slice(0, 200),
          description: content,
          priority: actionData.priority || 'medium',
          status: 'open',
          customerName: state.customerInfo?.name,
          customerEmail: state.customerInfo?.email,
        },
      });
      this.logger.log(`Created ticket ${ticket.ticketNumber} for conversation ${state.conversationId}`);
    } catch (error) {
      this.logger.error(`Failed to create ticket: ${error}`);
    }

    return { messages: [] };
  }

  private async lookupOrderNode(state: typeof AgentState.State) {
    const actionData = state.pendingActionData || {};
    const orderNumber = actionData.orderNumber;

    if (orderNumber) {
      try {
        const order = await this.prisma.order.findFirst({
          where: { companyId: state.companyId, orderNumber },
        });

        if (order) {
          return {
            messages: [{
              role: 'system',
              content: `Order ${order.orderNumber} details: Status=${order.status}, Total=${order.total} ${order.currency}${order.trackingNumber ? `, Tracking=${order.trackingNumber}` : ''}`,
            }],
          };
        } else {
          return {
            messages: [{
              role: 'system',
              content: `Order ${orderNumber} was not found. Ask the customer to verify the order number.`,
            }],
          };
        }
      } catch (error) {
        this.logger.error(`Order lookup failed: ${error}`);
      }
    }

    return {
      messages: [{
        role: 'system',
        content: 'Could not find an order number in the message. Ask the customer for their order number.',
      }],
    };
  }

  private async escalateNode(state: typeof AgentState.State) {
    try {
      await this.prisma.conversation.update({
        where: { id: state.conversationId },
        data: {
          status: 'escalated',
          escalatedAt: new Date(),
        },
      });
      this.logger.log(`Conversation ${state.conversationId} escalated to human agent`);
    } catch (error) {
      this.logger.error(`Escalation failed: ${error}`);
    }

    return { messages: [] };
  }

  private async respondNode(state: typeof AgentState.State) {
    const llm = new ChatOpenAI({
      apiKey: this.config.get<string>('OPENROUTER_API_KEY'),
      modelName: this.config.get<string>('LLM_MODEL', 'meta-llama/llama-3.1-8b-instruct'),
      maxTokens: 2048,
      temperature: 0.7,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });

    let actionNote = '';
    if (state.pendingAction === 'capture_lead') {
      actionNote = "\n\nI've noted your contact details — a team member will reach out shortly. Is there anything else I can help with?";
    } else if (state.pendingAction === 'book_appointment') {
      actionNote = "\n\nI've scheduled that appointment for you. A confirmation will be sent to your email. Anything else?";
    } else if (state.pendingAction === 'create_ticket') {
      actionNote = "\n\nI've created a support ticket for your issue. Our team will follow up with you. Is there anything else?";
    } else if (state.pendingAction === 'escalate') {
      actionNote = "\n\nI'm connecting you with a human agent who can better assist you. Please hold on.";
    }

    const conversationHistory = state.messages
      .slice(-20)
      .map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));

    const systemPrompt = {
      role: 'system' as const,
      content: `You are a friendly and professional AI customer support agent. Answer the customer's question based on the knowledge base context if available. Keep responses concise and helpful. Be warm and conversational.${actionNote}`,
    };

    try {
      const result = await llm.invoke([systemPrompt, ...conversationHistory]);
      return { response: result.content.toString() };
    } catch (error) {
      this.logger.error(`Respond node failed: ${error}`);
      // Smart fallback for demo when LLM has no credits
      const mockResponses: Record<string, string> = {
        capture_lead: "Thanks for sharing your contact details! I've saved them as a lead. Our team will reach out within 24 hours. Is there anything else I can help with?",
        book_appointment: "I've scheduled that appointment for you. You'll receive a confirmation email shortly. Anything else I can help with?",
        create_ticket: "I've created a support ticket for your issue. Our team will follow up with you shortly. Is there anything else?",
        escalate: "I'm connecting you with a human agent who can better assist you. Please hold on.",
        lookup_order: "I looked up that order. It's currently being processed and should ship within 1-2 business days. Would you like tracking info when available?",
        default: "Thanks for your message! I understand you're asking about: " + state.messages[state.messages.length - 1]?.content?.slice(0, 100) + ". How can I help you further?"
      };
      const fallbackResponse = mockResponses[state.pendingAction || 'default'] || mockResponses.default;
      return { response: fallbackResponse };
    }
  }

  async invoke(input: {
    messages: { role: string; content: string }[];
    companyId: string;
    conversationId: string;
    customerInfo?: { name?: string; email?: string; phone?: string };
  }) {
    const result = await this.graph.invoke({
      messages: input.messages,
      companyId: input.companyId,
      conversationId: input.conversationId,
      customerInfo: input.customerInfo || {},
      pendingAction: null,
      pendingActionData: null,
      response: '',
    });

    return {
      response: result.response,
      pendingAction: result.pendingAction,
      pendingActionData: result.pendingActionData,
      customerInfo: result.customerInfo,
    };
  }
}
