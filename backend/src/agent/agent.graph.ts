import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
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
  action: Annotation<{ type: string; data?: any } | null>({
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

  private buildGraph() {
    const finalGraph = new StateGraph(AgentState)
      .addNode('understand', this.understandNode.bind(this))
      .addNode('retrieveKnowledge', this.retrieveKnowledgeNode.bind(this))
      .addNode('decideAction', this.decideActionNode.bind(this))
      .addNode('captureLead', this.captureLeadNode.bind(this))
      .addNode('bookAppointment', this.bookAppointmentNode.bind(this))
      .addNode('respond', this.respondNode.bind(this))
      .addEdge(START, 'understand')
      .addEdge('understand', 'retrieveKnowledge')
      .addEdge('retrieveKnowledge', 'decideAction')
      .addConditionalEdges('decideAction', (state) => {
        if (state.action?.type === 'capture_lead') return 'captureLead';
        if (state.action?.type === 'book_appointment') return 'bookAppointment';
        return 'respond';
      })
      .addEdge('captureLead', 'respond')
      .addEdge('bookAppointment', 'respond')
      .addEdge('respond', END);

    this.graph = finalGraph.compile();
    this.logger.log('LangGraph agent compiled');
  }

  private async understandNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    const llm = new ChatGoogleGenerativeAI({
      apiKey: this.config.get<string>('GOOGLE_API_KEY'),
      model: this.config.get<string>('LLM_MODEL', 'gemini-2.0-flash'),
    });

    const systemPrompt = `You are an AI customer support agent. You analyze the conversation and:
1. Extract customer information (name, email, phone) if mentioned
2. Determine intent: question, lead capture, appointment booking, or handoff

Return JSON with keys: intent, name, email, phone.
Only include name/email/phone if explicitly mentioned by the customer.`;

    try {
      const result = await llm.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'human', content: lastMessage.content },
      ]);

      const text = result.content.toString().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { intent: 'question' };

      return {
        customerInfo: {
          name: parsed.name || state.customerInfo.name,
          email: parsed.email || state.customerInfo.email,
          phone: parsed.phone || state.customerInfo.phone,
        },
      };
    } catch (error) {
      this.logger.error(`Understand node failed: ${error}`);
      return { customerInfo: state.customerInfo };
    }
  }

  private async retrieveKnowledgeNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    const company = await this.prisma.company.findUnique({
      where: { id: state.companyId },
      include: { documents: { where: { published: true } } },
    });

    if (!company || company.documents.length === 0) {
      return { response: '' };
    }

    const llm = new ChatGoogleGenerativeAI({
      apiKey: this.config.get<string>('GOOGLE_API_KEY'),
      model: this.config.get<string>('LLM_MODEL', 'gemini-2.0-flash'),
    });

    const docs = company.documents.slice(0, 5);
    const context = docs
      .map((d) => `--- ${d.title} ---\n${d.content.slice(0, 2000)}`)
      .join('\n\n');

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are a helpful customer support agent for ${company.name}. Use ONLY the provided knowledge base to answer. If the answer is not in the knowledge base, say you don't know and offer to connect with a human agent.\n\nKnowledge Base:\n${context}`,
      },
      { role: 'human', content: lastMessage.content },
    ]);

    return { response: result.content.toString() };
  }

  private async decideActionNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    const hasContactInfo = !!(state.customerInfo.name || state.customerInfo.email || state.customerInfo.phone);

    const wantsAppointment = /book|schedule|appointment|meeting|reserve|calendar/.test(
      lastMessage.content.toLowerCase(),
    );
    const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(
      lastMessage.content.trim(),
    );

    if (hasContactInfo && wantsAppointment) {
      return { action: { type: 'book_appointment', data: state.customerInfo } };
    }
    if (hasContactInfo && !isGreeting) {
      return { action: { type: 'capture_lead', data: state.customerInfo } };
    }
    return { action: null };
  }

  private async captureLeadNode(state: typeof AgentState.State) {
    try {
      const lead = await this.prisma.lead.create({
        data: {
          id: crypto.randomUUID(),
          companyId: state.companyId,
          conversationId: state.conversationId,
          name: state.customerInfo.name || null,
          email: state.customerInfo.email || null,
          phone: state.customerInfo.phone || null,
          message: state.messages.map((m) => m.content).join('\n'),
          source: 'chat',
          status: 'new',
        },
      });
      this.logger.log(`Lead captured: ${lead.id}`);
    } catch (error) {
      this.logger.error(`Lead capture failed: ${error}`);
    }
    return {};
  }

  private async bookAppointmentNode(state: typeof AgentState.State) {
    try {
      const appointment = await this.prisma.appointment.create({
        data: {
          id: crypto.randomUUID(),
          companyId: state.companyId,
          conversationId: state.conversationId,
          customerName: state.customerInfo.name || null,
          customerEmail: state.customerInfo.email || null,
          title: 'Customer Appointment',
          notes: state.messages.map((m) => m.content).join('\n'),
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
          status: 'requested',
        },
      });
      this.logger.log(`Appointment booked: ${appointment.id}`);
    } catch (error) {
      this.logger.error(`Appointment booking failed: ${error}`);
    }
    return {};
  }

  private async respondNode(state: typeof AgentState.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    const llm = new ChatGoogleGenerativeAI({
      apiKey: this.config.get<string>('GOOGLE_API_KEY'),
      model: this.config.get<string>('LLM_MODEL', 'gemini-2.0-flash'),
    });

    let actionNote = '';
    if (state.action?.type === 'capture_lead') {
      actionNote = "\n\nGreat news! I've captured your information and a team member will reach out to you shortly. Is there anything else I can help you with?";
    } else if (state.action?.type === 'book_appointment') {
      actionNote = "\n\nWonderful! I've scheduled an appointment for you. A team member will confirm the details via email. Is there anything else I can help you with?";
    }

    const systemPrompt = `You are a friendly and professional AI customer support agent. Answer the customer's question. Keep responses concise and helpful.${actionNote}`;

    try {
      const result = await llm.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'human', content: lastMessage.content },
      ]);
      return { response: result.content.toString() };
    } catch (error) {
      this.logger.error(`Respond node failed: ${error}`);
      return { response: 'I apologize, but I am experiencing technical difficulties. Please try again or contact our support team directly.' };
    }
  }

  async invoke(input: {
    messages: { role: string; content: string }[];
    companyId: string;
    conversationId: string;
  }) {
    const result = await this.graph.invoke({
      messages: input.messages,
      companyId: input.companyId,
      conversationId: input.conversationId,
      customerInfo: {},
      action: null,
      response: '',
    });
    return result;
  }
}
