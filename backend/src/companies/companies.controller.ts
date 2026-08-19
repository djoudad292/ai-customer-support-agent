import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current company' })
  async getMe(@Req() req: any) {
    return this.companiesService.findOne(req.user.companyId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update company' })
  async updateMe(@Req() req: any, @Body() body: { name?: string; settings?: any }) {
    return this.companiesService.update(req.user.companyId, body);
  }
}
