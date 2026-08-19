import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  async getDashboard(@Req() req: any) {
    return this.analyticsService.getDashboard(req.user.companyId);
  }
}
