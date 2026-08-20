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
import { PrismaService } from '../common/prisma.service';

interface WidgetSocket extends WebSocket {
  companyId?: string;
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

  constructor(
    private agentService: AgentService,
    private prisma: PrismaService,
  ) {}

  handleConnection(client: WidgetSocket, request?: IncomingMessage) {
    const rawUrl = client.url || request?.url || '/';
    const url = new URL(rawUrl, 'ws://localhost');
    const companyId = url.searchParams.get('company') || 'demo';
    client.companyId = companyId;

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

    let conversationId = data.conversationId || null;
    try {
      if (conversationId) {
        const conv = await this.prisma.conversation.findUnique({
          where: { id: conversationId },
        });
        if (!conv || conv.companyId !== companyId) conversationId = null;
      }

      const result = await this.agentService.chat(
        companyId,
        conversationId || crypto.randomUUID(),
        message,
      );

      client.send(
        JSON.stringify({
          type: 'message',
          conversationId: result.conversationId,
          content: result.response,
          action: result.action || null,
        }),
      );
    } catch (err) {
      this.logger.error(`Widget chat failed: ${(err as Error).message}`);
      client.send(
        JSON.stringify({
          type: 'error',
          content: 'Sorry, something went wrong. Please try again.',
        }),
      );
    }
  }
}