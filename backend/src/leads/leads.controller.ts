import { Controller, Get, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Leads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List leads' })
  async findAll(@Req() req: any, @Query('status') status?: string) {
    return this.leadsService.findAll(req.user.companyId, { status });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update lead status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.leadsService.updateStatus(id, body.status);
  }
}
