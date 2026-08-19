import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'List tickets' })
  async findAll(@Req() req: any, @Query('status') status?: string, @Query('priority') priority?: string) {
    return this.ticketsService.findAll(req.user.companyId, { status, priority });
  }

  @Get('counts')
  @ApiOperation({ summary: 'Get ticket counts by status' })
  async getCounts(@Req() req: any) {
    return this.ticketsService.getCounts(req.user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  async findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create ticket' })
  async create(@Req() req: any, @Body() body: any) {
    return this.ticketsService.create({ ...body, companyId: req.user.companyId });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket' })
  async update(@Param('id') id: string, @Body() body: { status?: string; priority?: string; assignedTo?: string }) {
    return this.ticketsService.update(id, body);
  }
}
