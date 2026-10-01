import { Injectable, Logger } from '@nestjs/common';

export interface CreateCheckoutSessionParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, any>;
}

export interface CheckoutSessionResult {
  provider: 'VIRTUAPAYMENTS';
  sessionId: string;
  checkoutUrl: string;
  expiresAt: string;
}

export interface VirtuaPaymentsWebhookPayload {
  event: 'payment.succeeded' | 'payment.failed';
  provider: 'VIRTUAPAYMENTS';
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    status: 'SUCCEEDED' | 'FAILED';
    failureReason?: string;
    paidAt?: string;
    metadata?: Record<string, any>;
  };
}

@Injectable()
export class VirtuaPaymentsDummyService {
  private readonly logger = new Logger(VirtuaPaymentsDummyService.name);

  /**
   * Generates a dummy checkout session URL and identifier.
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    const sessionId = `vp_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    this.logger.log(
      `[Dummy VirtuaPayments] Created checkout session ${sessionId} for Order ${params.orderNumber} ($${params.amount} ${params.currency})`,
    );

    // Dummy checkout URL for frontend redirection or simulation
    const checkoutUrl = `https://mock.virtuapayments.internal/checkout/${sessionId}?orderId=${encodeURIComponent(params.orderId)}`;

    return {
      provider: 'VIRTUAPAYMENTS',
      sessionId,
      checkoutUrl,
      expiresAt,
    };
  }

  /**
   * Dummy webhook signature verification.
   * In dummy mode, accepts any non-empty signature or test signature.
   */
  verifyWebhookSignature(_payload: any, _signature?: string): boolean {
    this.logger.debug('[Dummy VirtuaPayments] Verified webhook signature (mock passthrough)');
    return true;
  }

  /**
   * Helper to construct a simulated webhook payload.
   */
  buildSimulatedWebhook(
    orderId: string,
    event: 'payment.succeeded' | 'payment.failed',
    amount: number,
    currency = 'USD',
  ): VirtuaPaymentsWebhookPayload {
    const isSuccess = event === 'payment.succeeded';
    return {
      event,
      provider: 'VIRTUAPAYMENTS',
      data: {
        paymentId: `vp_pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        orderId,
        amount,
        currency,
        status: isSuccess ? 'SUCCEEDED' : 'FAILED',
        failureReason: isSuccess ? undefined : 'Customer payment was declined by test issuer',
        paidAt: isSuccess ? new Date().toISOString() : undefined,
      },
    };
  }
}
