import { Injectable } from '@nestjs/common';
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
import { WidgetChatService } from '../widget/widget-chat.service';

interface WidgetSocket extends WebSocket {
  companyId?: string;
  conversationId?: string;
}

/**
 * Thin transport: framing and connection state only. The guest-isolation rule
 * and the message/error payload shape live in WidgetChatService so the REST
 * endpoint cannot drift from this socket path.
 */
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

  constructor(private widgetChat: WidgetChatService) {}

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
    // A socket may only continue the conversation it created: a client-supplied
    // id is never trusted on its own, otherwise a leaked conversationId would
    // let a visitor append to (or read back) someone else's thread.
    const conversationId =
      data.conversationId && data.conversationId === client.conversationId
        ? data.conversationId
        : undefined;

    const payload = await this.widgetChat.run({
      companyId: client.companyId,
      conversationId,
      message: typeof data?.message === 'string' ? data.message : '',
    });

    if (payload.type === 'message' && payload.conversationId) {
      client.conversationId = payload.conversationId;
    }
    client.send(JSON.stringify(payload));
  }
}
