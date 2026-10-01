import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { CheckoutDto } from './dto/checkout.dto';
import { SimulateWebhookDto } from './dto/simulate-webhook.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Initiate VirtuaPayments checkout session for an order' })
  @ApiResponse({ status: 201, description: 'Checkout session created' })
  createCheckout(@Body() dto: CheckoutDto, @Req() req: any) {
    return this.paymentsService.createCheckoutSession(req.user.id, dto.orderId);
  }

  @Post('webhook/virtuapayments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public webhook callback receiver for VirtuaPayments' })
  @ApiHeader({ name: 'x-virtuapayments-signature', required: false })
  @ApiResponse({ status: 200, description: 'Webhook acknowledged and processed' })
  handleWebhook(
    @Body() payload: any,
    @Headers('x-virtuapayments-signature') signature?: string,
  ) {
    return this.paymentsService.handleWebhook(payload, signature);
  }

  @Post('simulate-webhook')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Developer/Test helper: simulate webhook payment event to complete order and enrollment' })
  simulateWebhook(@Body() dto: SimulateWebhookDto) {
    return this.paymentsService.simulateWebhook(dto.orderId, dto.status);
  }
}
