import { Controller, Get, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private apptService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List appointments' })
  async findAll(@Req() req: any, @Query('status') status?: string) {
    return this.apptService.findAll(req.user.companyId, { status });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.apptService.updateStatus(id, body.status);
  }
}
