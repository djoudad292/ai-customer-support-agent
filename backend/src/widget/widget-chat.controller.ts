import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WidgetChatService } from './widget-chat.service';

@ApiTags('Widget')
@Controller('widget')
export class WidgetChatController {
  constructor(private widgetChat: WidgetChatService) {}

  /**
   * Stateless guest chat used by the embeddable widget iframe and the
   * prior-auth demo when no long-lived socket is available (serverless).
   * Payload shape is identical to the WebSocket `message` / `error` frames.
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Guest chat turn over REST' })
  async chat(
    @Body()
    body: { companyId?: string; conversationId?: string | null; message?: string },
  ) {
    return this.widgetChat.run({
      companyId: body?.companyId,
      conversationId: body?.conversationId ?? null,
      message: typeof body?.message === 'string' ? body.message : '',
    });
  }
}
