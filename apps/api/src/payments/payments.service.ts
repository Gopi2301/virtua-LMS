import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuditAction,
  EnrollmentStatus,
  OrderStatus,
  PaymentStatus,
} from '@prisma/client';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { VirtuaPaymentsDummyService } from 'src/integrations/virtuapayments/virtuapayments.dummy.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly virtuaPayments: VirtuaPaymentsDummyService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Initiates payment checkout session for a pending order.
   */
  async createCheckoutSession(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You are not authorized to pay for this order');
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('This order is already completed');
    }

    if (order.status === OrderStatus.FAILED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(`Cannot checkout an order in ${order.status} status`);
    }

    // Call dummy VirtuaPayments provider
    const session = await this.virtuaPayments.createCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.totalAmount),
      currency: order.currency,
      customerEmail: order.user.email,
      customerName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || undefined,
    });

    // Create or update payment record
    const payment = await this.prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        provider: 'VIRTUAPAYMENTS',
        providerPaymentId: session.sessionId,
        status: PaymentStatus.PENDING,
        amount: order.totalAmount,
        currency: order.currency,
      },
      update: {
        providerPaymentId: session.sessionId,
        status: PaymentStatus.PENDING,
        amount: order.totalAmount,
        currency: order.currency,
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      checkoutUrl: session.checkoutUrl,
      sessionId: session.sessionId,
      amount: order.totalAmount,
      currency: order.currency,
    };
  }

  /**
   * Processes verified VirtuaPayments webhooks and completes enrollment.
   * Canonical flow: Verified Webhook -> Order Status -> Enrollment.
   */
  async handleWebhook(payload: any, signature?: string) {
    const isValid = this.virtuaPayments.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      throw new UnauthorizedException('Invalid VirtuaPayments webhook signature');
    }

    const { event, data } = payload;
    if (!data?.orderId) {
      throw new BadRequestException('Missing orderId in webhook data');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${data.orderId} not found`);
    }

    const isSuccess = event === 'payment.succeeded' || data.status === 'SUCCEEDED';

    this.logger.log(
      `[Payments Webhook] Processing ${event} for order ${order.orderNumber} (Result: ${isSuccess ? 'SUCCEEDED' : 'FAILED'})`,
    );

    await this.prisma.$transaction(async (tx) => {
      // 1. Update Payment status
      await tx.payment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          provider: 'VIRTUAPAYMENTS',
          providerPaymentId: data.paymentId,
          status: isSuccess ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
          amount: data.amount ? data.amount : order.totalAmount,
          currency: data.currency || order.currency,
          rawPayload: payload,
        },
        update: {
          providerPaymentId: data.paymentId || undefined,
          status: isSuccess ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
          rawPayload: payload,
        },
      });

      // 2. Update Order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: isSuccess ? OrderStatus.COMPLETED : OrderStatus.FAILED,
        },
      });

      // 3. If succeeded, grant lifetime enrollment for all items
      if (isSuccess) {
        for (const item of order.items) {
          await tx.enrollment.upsert({
            where: {
              userId_productId: {
                userId: order.userId,
                productId: item.productId,
              },
            },
            create: {
              userId: order.userId,
              productId: item.productId,
              status: EnrollmentStatus.ACTIVE,
            },
            update: {
              status: EnrollmentStatus.ACTIVE,
              revokedAt: null,
              revokedById: null,
            },
          });
        }
      }
    });

    // 4. Record Audit Log
    await this.auditLog.log({
      actorId: order.userId,
      action: AuditAction.PAYMENT_UPDATED,
      entityType: 'Order',
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        event,
        status: isSuccess ? 'SUCCEEDED' : 'FAILED',
        amount: Number(order.totalAmount),
      },
    });

    return {
      received: true,
      orderId: order.id,
      status: isSuccess ? OrderStatus.COMPLETED : OrderStatus.FAILED,
    };
  }

  /**
   * Dev/Simulated webhook execution for UI testing.
   */
  async simulateWebhook(orderId: string, status: 'SUCCEEDED' | 'FAILED') {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const event = status === 'SUCCEEDED' ? 'payment.succeeded' : 'payment.failed';
    const mockPayload = this.virtuaPayments.buildSimulatedWebhook(
      order.id,
      event,
      Number(order.totalAmount),
      order.currency,
    );

    return this.handleWebhook(mockPayload, 'dummy-signature-test');
  }
}
