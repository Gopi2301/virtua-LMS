import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { VirtuaPaymentsDummyService } from 'src/integrations/virtuapayments/virtuapayments.dummy.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentsService } from './payments.service';

const USER_ID = 'student-uuid';
const ORDER_ID = 'order-uuid';

const prismaMock = {
  order: {
    findUnique: jest.fn() as any,
    update: jest.fn() as any,
  },
  payment: {
    upsert: jest.fn() as any,
  },
  enrollment: {
    upsert: jest.fn() as any,
  },
  $transaction: jest.fn((callback: any) => callback(prismaMock)) as any,
};

const virtuaPaymentsMock = {
  createCheckoutSession: (jest.fn() as any).mockResolvedValue({
    provider: 'VIRTUAPAYMENTS',
    sessionId: 'vp_sess_123',
    checkoutUrl: 'https://mock.virtuapayments.internal/checkout/vp_sess_123',
    expiresAt: new Date().toISOString(),
  }),
  verifyWebhookSignature: (jest.fn() as any).mockReturnValue(true),
  buildSimulatedWebhook: jest.fn() as any,
};

const auditLogMock = { log: jest.fn() as any };

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: VirtuaPaymentsDummyService, useValue: virtuaPaymentsMock },
        { provide: AuditLogService, useValue: auditLogMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createCheckoutSession', () => {
    it('throws NotFoundException if order does not exist', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);
      await expect(service.createCheckoutSession(USER_ID, ORDER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates checkout session and updates payment record', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: ORDER_ID,
        userId: USER_ID,
        orderNumber: 'ORD-123456',
        totalAmount: 99.0,
        currency: 'USD',
        status: OrderStatus.PENDING,
        user: { email: 'student@example.com' },
        items: [],
      });
      prismaMock.payment.upsert.mockResolvedValue({
        id: 'payment-1',
        status: PaymentStatus.PENDING,
      });

      const res = await service.createCheckoutSession(USER_ID, ORDER_ID);
      expect(res.sessionId).toBe('vp_sess_123');
      expect(res.checkoutUrl).toContain('mock.virtuapayments.internal');
      expect(virtuaPaymentsMock.createCheckoutSession).toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('processes payment.succeeded and grants lifetime enrollment', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: ORDER_ID,
        userId: USER_ID,
        orderNumber: 'ORD-123456',
        totalAmount: 99.0,
        currency: 'USD',
        status: OrderStatus.PENDING,
        items: [{ productId: 'course-p1' }, { productId: 'course-p2' }],
        user: { id: USER_ID },
      });

      const payload = {
        event: 'payment.succeeded',
        data: {
          orderId: ORDER_ID,
          paymentId: 'vp_pay_1',
          amount: 99.0,
          status: 'SUCCEEDED',
        },
      };

      const result = await service.handleWebhook(payload, 'test-sig');
      expect(result.status).toBe(OrderStatus.COMPLETED);
      expect(prismaMock.enrollment.upsert).toHaveBeenCalledTimes(2);
      expect(auditLogMock.log).toHaveBeenCalled();
    });
  });
});
