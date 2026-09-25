import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { IncomingMessage } from 'http';
import { Server, WebSocket } from 'ws';
import { AgentService } from '../agent/agent.service';

interface WidgetSocket extends WebSocket {
  companyId?: string;
  conversationId?: string;
}

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  path: '/ws',
})
export class WidgetGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger(WidgetGateway.name);

  constructor(private agentService: AgentService) {}

  handleConnection(client: WidgetSocket, request?: IncomingMessage) {
    const rawUrl = client.url || request?.url || '/';
    const url = new URL(rawUrl, 'ws://localhost');
    const companyId = url.searchParams.get('company') || 'demo';
    client.companyId = companyId;
    client.conversationId = undefined;

    client.send(
      JSON.stringify({
        type: 'connected',
        companyId,
        conversationId: null,
      }),
    );
  }

  handleDisconnect(client: WidgetSocket) {
    client.companyId = undefined;
    client.conversationId = undefined;
  }

  @SubscribeMessage('chat')
  async handleChat(
    @ConnectedSocket() client: WidgetSocket,
    @MessageBody() data: { message: string; conversationId?: string | null },
  ) {
    const message = typeof data?.message === 'string' ? data.message.trim() : '';
    if (!message) return;

    const companyId = client.companyId;
    if (!companyId) {
      client.send(JSON.stringify({ type: 'error', content: 'Missing company' }));
      return;
    }

    // Guest isolation: a socket may only continue the conversation it created.
    // A client-supplied id is never trusted on its own — otherwise a leaked
    // conversationId would let a visitor append to (or read back) someone
    // else's thread inside the same company workspace.
    const conversationId =
      data.conversationId && data.conversationId === client.conversationId
        ? data.conversationId
        : undefined;

    try {
      const result = await this.agentService.chat(
        companyId,
        conversationId || crypto.randomUUID(),
        message,
      );
      client.conversationId = result.conversationId;

      // Cited = response references sourced rules (criterion/page/section markers).
      // The prior-auth demo only logs "cited evaluation" when this is true.
      const cited = /(criteri|§\s*|page\s+\d|section\s+[a-z]|[MBR]-\d)/i.test(result.response || '');

      client.send(
        JSON.stringify({
          type: 'message',
          conversationId: result.conversationId,
          content: result.response,
          action: result.action || null,
          cited,
        }),
      );
    } catch (err) {
      const code = (err as Error).message || '';
      this.logger.error(`Widget chat failed: ${code}`);
      // Distinct honest errors (frontend retries on these) instead of one
      // generic message that hides whether it is data or provider failure.
      const content = code.includes('NO_CRITERIA')
        ? 'No criteria documents are loaded for this evaluation yet. Please retry in a minute or book a live run.'
        : 'Sorry, something went wrong. Please try again.';
      client.send(JSON.stringify({ type: 'error', content, code }));
    }
  }
}