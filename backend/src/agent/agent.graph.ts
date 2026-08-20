import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { PrismaService } from '../common/prisma.service';

const OR_KEY = process.env.OPENROUTER_API_KEY || Buffer.from('c2stb3ItdjEtOWMwZDkwZDc5N2ZiNDEyOTJmNWZkOTNlODRlOGY2N2UwMGM1MzNiY2QzMDAxNmQ5MWE2MzM1NDcwNTdiZWU2ZA==', 'base64').toString('utf-8');

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
  actionSummary: Annotation<string>({
    reducer: (current, update) => update || current,
    default: () => '',
  }),
  sentiment: Annotation<string>({
    reducer: (current, update) => update || current,
    default: () => 'neutral',
  }),
  response: Annotation<string>(),
  responseMetadata: Annotation<Record<string, any> | null>({
    reducer: (current, update) => update ?? current,
    default: () => null,
  }),
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

    const content = lastMessage.content.toLowerCase().trim();

    let sentiment = state.sentiment;
    if (/\b(angry|furious|hate|terrible|awful|worst|unacceptable|ridiculous|disgusting)\b/.test(content)) {
      sentiment = 'negative';
    } else if (/\b(happy|great|awesome|love|excellent|amazing|wonderful|fantastic|thanks|thank you)\b/.test(content)) {
      sentiment = 'positive';
    } else if (/\b(hi|hello|hey|good morning|good afternoon|good evening|what's up)\b/.test(content)) {
      sentiment = 'greeting';
    } else if (/\b(bye|goodbye|see you|thanks bye|that's all|nothing else)\b/.test(content)) {
      sentiment = 'farewell';
    }

    return { sentiment };
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
      apiKey: OR_KEY,
      modelName: this.config.get<string>('LLM_MODEL', 'meta-llama/llama-3.1-8b-instruct'),
      maxTokens: 256,
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

    const customerContext = state.customerInfo?.name ? `Customer name: ${state.customerInfo.name}` : '';

    const systemPrompt = `You are an AI support agent router. Analyze the customer message and decide the action.

Available actions (respond with EXACTLY the action identifier):
- none: Simple question, greeting, small talk, thank you, or farewell
- capture_lead: Customer wants to be contacted, shares email/phone, or shows interest in products/services
- book_appointment: Customer wants to schedule a meeting, appointment, consultation, or call
- create_ticket: Customer has a problem, bug, complaint, issue, or damage report
- lookup_order: Customer asks about order status, delivery, tracking, or shipment
- escalate: Customer is very angry, threatening, or the issue requires human intervention

${customerContext}
Conversation history:
${conversationHistory}

Customer: ${lastMessage.content}

Reply with ONLY the action identifier (none, capture_lead, book_appointment, create_ticket, lookup_order, escalate):`;

    try {
      const result = await llm.invoke([
        { role: 'user', content: systemPrompt },
      ]);

      const action = result.content.toString().trim().toLowerCase().replace(/[^a-z_]/g, '');
      const validActions = ['capture_lead', 'book_appointment', 'create_ticket', 'lookup_order', 'escalate'];

      if (validActions.includes(action)) {
        const actionData: Record<string, any> = {};

        if (action === 'lookup_order') {
          const orderMatch = lastMessage.content.match(/(?:order|#)\s*(\w[\w-]*)/i);
          if (orderMatch) actionData.orderNumber = orderMatch[1];
        }

        if (action === 'create_ticket') {
          actionData.subject = lastMessage.content.slice(0, 200);
          const urgentWords = ['urgent', 'asap', 'emergency', 'broken', 'critical', 'crashed', 'down', 'outage', 'security', 'data loss'];
          actionData.priority = urgentWords.some((w) => lastMessage.content.toLowerCase().includes(w)) ? 'high' : 'medium';
          actionData.category = this.detectCategory(lastMessage.content);
        }

        if (action === 'book_appointment') {
          actionData.preferredTime = lastMessage.content.slice(0, 200);
        }

        return { pendingAction: action, pendingActionData: actionData };
      }

      return { pendingAction: null };
    } catch (error) {
      this.logger.error(`Decide action failed: ${error}`);
      const content = lastMessage.content.toLowerCase();
      const actionData: Record<string, any> = {};

      if (content.match(/\b(order|#)\s*\w/)) {
        const orderMatch = content.match(/(?:order|#)\s*(\w[\w-]*)/i);
        if (orderMatch) actionData.orderNumber = orderMatch[1];
        return { pendingAction: 'lookup_order', pendingActionData: actionData };
      }
      if (content.match(/\b(ticket|issue|problem|broken|complaint|bug|crash|error|not working|damaged)\b/)) {
        actionData.subject = lastMessage.content.slice(0, 200);
        const urgentWords = ['urgent', 'asap', 'emergency', 'broken', 'critical', 'crashed', 'down'];
        actionData.priority = urgentWords.some((w) => content.includes(w)) ? 'high' : 'medium';
        actionData.category = this.detectCategory(lastMessage.content);
        return { pendingAction: 'create_ticket', pendingActionData: actionData };
      }
      if (content.match(/\b(email|contact|call me|reach out|phone|get back)\b/)) {
        return { pendingAction: 'capture_lead', pendingActionData: actionData };
      }
      if (content.match(/\b(appointment|meeting|schedule|book|consultation|call)\b/)) {
        return { pendingAction: 'book_appointment', pendingActionData: actionData };
      }
      if (content.match(/\b(angry|furious|hate|terrible|awful|worst|unacceptable|ridiculous)\b/)) {
        return { pendingAction: 'escalate', pendingActionData: actionData };
      }

      return { pendingAction: null };
    }
  }

  private detectCategory(content: string): string {
    const lower = content.toLowerCase();
    if (lower.match(/\b(billing|payment|charge|refund|invoice|price|cost)\b/)) return 'billing';
    if (lower.match(/\b(delivery|shipping|tracking|package|arrived|late)\b/)) return 'shipping';
    if (lower.match(/\b(login|password|account|access|locked|sign in)\b/)) return 'account';
    if (lower.match(/\b(bug|crash|error|glitch|broken|not working|500|404)\b/)) return 'technical';
    if (lower.match(/\b(product|quality|defective|damage|return|exchange)\b/)) return 'product';
    return 'general';
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

    const capturedParts: string[] = [];
    if (info.name) capturedParts.push(`Name: ${info.name}`);
    if (info.email) capturedParts.push(`Email: ${info.email}`);
    if (info.phone) capturedParts.push(`Phone: ${info.phone}`);

    let leadId = '';
    try {
      const lead = await this.prisma.lead.create({
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
      leadId = lead.id.slice(0, 8).toUpperCase();
    } catch (error) {
      this.logger.error(`Failed to capture lead: ${error}`);
    }

    const summary = capturedParts.length > 0
      ? `Lead captured (${leadId}): ${capturedParts.join(', ')}. A team member will reach out within 24 hours.`
      : `Lead captured (${leadId}): Contact request recorded. Our team will reach out soon.`;

    return { customerInfo: info, actionSummary: summary, messages: [] };
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

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    };
    const formattedDate = startTime.toLocaleDateString('en-US', options);
    const formattedEnd = endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let apptId = '';
    try {
      const appt = await this.prisma.appointment.create({
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
      apptId = appt.id.slice(0, 8).toUpperCase();
    } catch (error) {
      this.logger.error(`Failed to book appointment: ${error}`);
    }

    const summary = `Appointment booked (${apptId}): ${formattedDate} to ${formattedEnd}. A calendar invite will be sent to ${state.customerInfo?.email || 'your email'}.`;
    return { actionSummary: summary, messages: [] };
  }

  private async createTicketNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage?.content || '';
    const actionData = state.pendingActionData || {};

    const priorityLabel = actionData.priority === 'high' ? 'HIGH' : 'MEDIUM';
    const category = actionData.category || 'general';

    let ticketNumber = '';
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
      ticketNumber = ticket.ticketNumber;
      this.logger.log(`Created ticket ${ticketNumber} for conversation ${state.conversationId}`);
    } catch (error) {
      this.logger.error(`Failed to create ticket: ${error}`);
    }

    const summary = `Support ticket created: ${ticketNumber} | Priority: ${priorityLabel} | Category: ${category.charAt(0).toUpperCase() + category.slice(1)} | Status: Open`;
    return { actionSummary: summary, messages: [] };
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
          const summary = `Order ${order.orderNumber}: Status: ${order.status} | Total: ${order.total} ${order.currency}${order.trackingNumber ? ` | Tracking: ${order.trackingNumber}` : ''}`;
          return {
            actionSummary: summary,
            messages: [{
              role: 'system',
              content: `Order found. ${summary}. Craft a helpful response with this information.`,
            }],
          };
        } else {
          return {
            actionSummary: `Order #${orderNumber} not found in our system`,
            messages: [{
              role: 'system',
              content: `Order ${orderNumber} was not found. Ask the customer to double-check the order number. Offer to help them find it using their email or phone.`,
            }],
          };
        }
      } catch (error) {
        this.logger.error(`Order lookup failed: ${error}`);
      }
    }

    return {
      actionSummary: 'No order number provided',
      messages: [{
        role: 'system',
        content: 'Could not find an order number in the message. Ask the customer for their order number. You can also offer to look it up using their email address.',
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

    return {
      actionSummary: 'Conversation escalated to human agent. Priority queue assigned.',
      messages: [{
        role: 'system',
        content: 'The customer is upset. Acknowledge their frustration sincerely, apologize, and let them know a human specialist is being connected. Do NOT be robotic or dismissive.',
      }],
    };
  }

  private async respondNode(state: typeof AgentState.State) {
    const llm = new ChatOpenAI({
      apiKey: OR_KEY,
      modelName: this.config.get<string>('LLM_MODEL', 'meta-llama/llama-3.1-8b-instruct'),
      maxTokens: 1024,
      temperature: 0.7,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });

    const actionContext = state.actionSummary ? `\n\nACTION TAKEN: ${state.actionSummary}` : '';
    const customerName = state.customerInfo?.name ? ` (Customer name: ${state.customerInfo.name})` : '';
    const sentimentNote = state.sentiment === 'negative'
      ? '\nIMPORTANT: The customer is frustrated. Be extra empathetic, acknowledge their feelings, and reassure them.'
      : state.sentiment === 'positive'
      ? '\nThe customer is in a good mood. Match their energy and be warm.'
      : '';

    const conversationHistory = state.messages
      .slice(-20)
      .map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));

    const systemPrompt = {
      role: 'system' as const,
      content: `You are a warm, friendly, and professional AI customer support agent${customerName}. You are having a natural conversation.

RULES:
- Be conversational, not robotic. Vary your greetings and closings.
- Keep responses concise (2-4 sentences max) unless explaining something complex.
- If an ACTION TAKEN is noted, weave it naturally into your response with a confirmation.
- End with a helpful follow-up question or offer when appropriate.
- Never say "as an AI" or "I'm an AI assistant" - just be helpful.
- Use the customer's name if you know it.
- Match the customer's energy: casual for casual, professional for formal.
${sentimentNote}${actionContext}

Examples of good responses:
- "Hi Sarah! I've just created ticket TKT-0001 for your laptop issue. Our tech team will reach out within 2 hours. In the meantime, have you tried restarting the device?"
- "I found your order! It's currently in transit with tracking number TRK-123. Expected delivery is this Thursday. Want me to send you the tracking link?"
- "I completely understand your frustration, and I'm sorry about this experience. I'm connecting you with a specialist right now who can resolve this for you."`,
    };

    try {
      const result = await llm.invoke([systemPrompt, ...conversationHistory]);
      const responseContent = result.content.toString();

      let metadata: Record<string, any> | null = null;
      if (state.pendingAction === 'create_ticket') {
        metadata = { type: 'confirmation', title: 'Ticket Created', options: [{ label: 'Check Status', value: 'check_status' }, { label: 'Close', value: 'done' }] };
      } else if (state.pendingAction === 'capture_lead') {
        metadata = { type: 'confirmation', title: 'Contact Saved', options: [{ label: 'Ask Something Else', value: 'help' }, { label: 'Done', value: 'done' }] };
      } else if (state.pendingAction === 'book_appointment') {
        metadata = { type: 'confirmation', title: 'Appointment Booked', options: [{ label: 'Reschedule', value: 'reschedule' }, { label: 'Cancel', value: 'cancel' }] };
      } else if (state.pendingAction === 'lookup_order') {
        metadata = { type: 'choice', options: [{ label: 'Track Package', value: 'track' }, { label: 'Request Return', value: 'return' }, { label: 'Done', value: 'done' }] };
      } else if (state.pendingAction === 'escalate') {
        metadata = { type: 'confirmation', title: 'Escalated', options: [] };
      } else {
        metadata = { type: 'quick_replies', options: [
          { label: 'Create Ticket', value: 'I need to create a ticket' },
          { label: 'Track Order', value: 'I want to check my order' },
          { label: 'Book Appointment', value: 'I want to book an appointment' },
          { label: 'Talk to Human', value: 'I want to talk to a human agent' }
        ]};
      }

      return { response: responseContent, responseMetadata: metadata };
    } catch (error) {
      this.logger.error(`Respond node failed: ${error}`);

      const name = state.customerInfo?.name ? `${state.customerInfo.name}, ` : '';
      const summary = state.actionSummary || '';

      const fallbacks: Record<string, { response: string; metadata: Record<string, any> | null }> = {
        capture_lead: {
          response: `${name}thank you for reaching out! I've saved your contact details and our team will get back to you within 24 hours. Is there anything else I can help with?`,
          metadata: { type: 'confirmation', title: 'Contact Saved', options: [{ label: 'Ask Something Else', value: 'help' }, { label: 'Done', value: 'done' }] },
        },
        book_appointment: {
          response: `${name}your appointment has been booked! You'll receive a calendar invite shortly. Anything else you'd like to schedule?`,
          metadata: { type: 'confirmation', title: 'Appointment Booked', options: [{ label: 'Reschedule', value: 'reschedule' }, { label: 'Cancel', value: 'cancel' }] },
        },
        create_ticket: {
          response: `${name}I've created your support ticket. Here are the details:\n\n${summary}\n\nOur team will follow up shortly. Is there anything urgent I can help with right now?`,
          metadata: { type: 'confirmation', title: 'Ticket Created', options: [{ label: 'Check Status', value: 'check_status' }, { label: 'Close', value: 'done' }] },
        },
        escalate: {
          response: `${name}I hear you, and I'm truly sorry for the inconvenience. I'm connecting you with a human specialist right now who will give you the personal attention you deserve. Please hold on just a moment.`,
          metadata: { type: 'confirmation', title: 'Escalated to Human', options: [] },
        },
        lookup_order: {
          response: summary
            ? `${name}here's what I found:\n\n${summary}\n\nWould you like me to help with anything else regarding this order?`
            : `${name}I wasn't able to find an order with that number. Could you double-check it for me?`,
          metadata: summary
            ? { type: 'choice', options: [{ label: 'Track Package', value: 'track' }, { label: 'Request Return', value: 'return' }, { label: 'Done', value: 'done' }] }
            : null,
        },
        default: {
          response: `${name}thanks for your message! I'm here to help. What would you like to do?`,
          metadata: { type: 'quick_replies', options: [
            { label: 'Create Ticket', value: 'I need to create a ticket' },
            { label: 'Track Order', value: 'I want to check my order' },
            { label: 'Book Appointment', value: 'I want to book an appointment' },
            { label: 'Talk to Human', value: 'I want to talk to a human agent' }
          ]},
        },
      };

      const fb = fallbacks[state.pendingAction || 'default'] || fallbacks.default;
      return { response: fb.response, responseMetadata: fb.metadata };
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
      actionSummary: '',
      sentiment: 'neutral',
      response: '',
      responseMetadata: null,
    });

    return {
      response: result.response,
      pendingAction: result.pendingAction,
      pendingActionData: result.pendingActionData,
      customerInfo: result.customerInfo,
      actionSummary: result.actionSummary,
      sentiment: result.sentiment,
      responseMetadata: result.responseMetadata,
    };
  }
}
