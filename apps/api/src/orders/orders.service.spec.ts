import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentStatus, OrderStatus, ProductStatus, ProductType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrdersService } from './orders.service';

const USER_ID = 'student-uuid';
const PRODUCT_ID = 'product-uuid';

const prismaMock = {
  product: {
    findMany: jest.fn() as jest.Mock<any>,
  },
  enrollment: {
    findMany: jest.fn() as jest.Mock<any>,
    upsert: jest.fn() as jest.Mock<any>,
  },
  order: {
    findMany: jest.fn() as jest.Mock<any>,
    findUnique: jest.fn() as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
    count: jest.fn() as jest.Mock<any>,
    aggregate: jest.fn() as jest.Mock<any>,
  },
  $transaction: jest.fn((callback: any) => callback(prismaMock)) as jest.Mock<any>,
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('createOrder', () => {
    it('throws BadRequestException if no products are specified', async () => {
      await expect(service.createOrder(USER_ID, {})).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if product is not found', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);
      await expect(service.createOrder(USER_ID, { productId: PRODUCT_ID })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException if product is not published ON_AIR', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        { id: PRODUCT_ID, title: 'Draft Course', status: ProductStatus.DRAFT, price: 49.99, isFree: false },
      ]);
      await expect(service.createOrder(USER_ID, { productId: PRODUCT_ID })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException if user is already enrolled', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        { id: PRODUCT_ID, title: 'Active Course', status: ProductStatus.ON_AIR, price: 49.99, isFree: false },
      ]);
      prismaMock.enrollment.findMany.mockResolvedValue([{ id: 'existing-enr', status: EnrollmentStatus.ACTIVE }]);

      await expect(service.createOrder(USER_ID, { productId: PRODUCT_ID })).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates a pending order for paid products', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        { id: PRODUCT_ID, title: 'Paid Course', status: ProductStatus.ON_AIR, price: 49.99, isFree: false },
      ]);
      prismaMock.enrollment.findMany.mockResolvedValue([]);
      prismaMock.order.create.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-123456-ABCD',
        status: OrderStatus.PENDING,
        totalAmount: 49.99,
      });

      const result = await service.createOrder(USER_ID, { productId: PRODUCT_ID });
      expect(result.status).toBe(OrderStatus.PENDING);
      expect(prismaMock.order.create).toHaveBeenCalled();
    });
  });
});
