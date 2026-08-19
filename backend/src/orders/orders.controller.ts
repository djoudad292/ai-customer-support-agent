import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List orders' })
  async findAll(@Req() req: any, @Query('status') status?: string) {
    return this.ordersService.findAll(req.user.companyId, { status });
  }

  @Get('counts')
  @ApiOperation({ summary: 'Get order counts' })
  async getCounts(@Req() req: any) {
    return this.ordersService.getCounts(req.user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by order number' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.findByNumber(req.user.companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create order' })
  async create(@Req() req: any, @Body() body: any) {
    return this.ordersService.create({ ...body, companyId: req.user.companyId });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.ordersService.update(id, body);
  }
}
