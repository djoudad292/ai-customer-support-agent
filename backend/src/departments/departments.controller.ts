import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Departments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private deptService: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List departments' })
  async findAll(@Req() req: any) {
    return this.deptService.findAll(req.user.companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create department' })
  async create(@Req() req: any, @Body() body: { name: string; description?: string; email?: string }) {
    return this.deptService.create({ ...body, companyId: req.user.companyId });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete department' })
  async delete(@Param('id') id: string) {
    return this.deptService.delete(id);
  }
}
