import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KnowledgeBaseService } from './knowledge-base.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Knowledge Base')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private kbService: KnowledgeBaseService) {}

  @Get()
  @ApiOperation({ summary: 'List documents' })
  async findAll(@Req() req: any) {
    return this.kbService.findAll(req.user.companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create document' })
  async create(@Req() req: any, @Body() body: { title: string; content: string; filename?: string }) {
    return this.kbService.create({ ...body, companyId: req.user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update document' })
  async update(@Param('id') id: string, @Body() body: { title?: string; content?: string }) {
    return this.kbService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  async delete(@Param('id') id: string) {
    return this.kbService.delete(id);
  }

  @Post('search')
  @ApiOperation({ summary: 'Search knowledge base' })
  async search(@Req() req: any, @Body() body: { query: string }) {
    return this.kbService.search(req.user.companyId, body.query);
  }
}
