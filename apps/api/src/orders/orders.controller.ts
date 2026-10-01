import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new order for purchasing products' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Invalid product or product not on-air' })
  @ApiResponse({ status: 409, description: 'User already actively enrolled' })
  createOrder(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  @Get('my-orders')
  @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List all orders placed by the current user' })
  getMyOrders(@Req() req: any) {
    return this.ordersService.getUserOrders(req.user.id);
  }

  @Get(':id')
  @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get details of an order by ID' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  getOrderById(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const roles: string[] = req.user.roles || [];
    const isAdmin = roles.includes('SUPER_ADMIN') || roles.includes('MANAGER');
    return this.ordersService.getOrderById(id, req.user.id, isAdmin);
  }

  @Get()
  @Roles('MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin/Manager: View all platform orders and revenue metrics' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.ordersService.getAllOrders(p, l);
  }
}
