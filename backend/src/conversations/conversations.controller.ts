import { Controller, Get, Param, Patch, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'List conversations' })
  async findAll(@Req() req: any, @Query('status') status?: string) {
    return this.conversationsService.findAll(req.user.companyId, { status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  async findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update conversation status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.conversationsService.updateStatus(id, body.status);
  }
}
