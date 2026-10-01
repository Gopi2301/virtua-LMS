import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, OrderStatus, ProductStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new pending order for a student.
   * If the product is free ($0.00), automatically completes the order and enrolls the user.
   */
  async createOrder(userId: string, dto: CreateOrderDto) {
    const rawIds = dto.productId ? [dto.productId] : dto.productIds || [];
    const productIds = Array.from(new Set(rawIds));

    if (productIds.length === 0) {
      throw new BadRequestException('At least one product must be specified for the order');
    }

    // Verify products exist and are published (ON_AIR)
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more selected products could not be found');
    }

    for (const p of products) {
      if (p.status !== ProductStatus.ON_AIR) {
        throw new BadRequestException(`Product "${p.title}" is not available for purchase`);
      }
    }

    // Check if user is already enrolled
    const existingEnrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        productId: { in: productIds },
        status: EnrollmentStatus.ACTIVE,
      },
    });

    if (existingEnrollments.length > 0) {
      throw new ConflictException('You already have an active enrollment in one or more selected products');
    }

    // Calculate total amount
    const totalAmount = products.reduce((acc, p) => acc + Number(p.price || 0), 0);
    const currency = dto.currency || 'USD';
    const isFree = totalAmount === 0 || products.every((p) => p.isFree);

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Execute creation in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: isFree ? OrderStatus.COMPLETED : OrderStatus.PENDING,
          totalAmount: isFree ? 0 : totalAmount,
          currency,
          items: {
            create: products.map((p) => ({
              productId: p.id,
              price: isFree ? 0 : p.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, title: true, slug: true, thumbnail: true, type: true },
              },
            },
          },
          payment: true,
        },
      });

      // If free, auto-enroll immediately
      if (isFree) {
        for (const p of products) {
          await tx.enrollment.upsert({
            where: { userId_productId: { userId, productId: p.id } },
            create: {
              userId,
              productId: p.id,
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

      return created;
    });

    return order;
  }

  /**
   * Retrieves orders placed by the current user.
   */
  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, title: true, slug: true, thumbnail: true, type: true },
            },
          },
        },
        payment: {
          select: { id: true, status: true, amount: true, currency: true, provider: true },
        },
      },
    });
  }

  /**
   * Fetches an individual order by ID with ownership enforcement.
   */
  async getOrderById(orderId: string, actorId: string, isAdmin = false) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: {
              select: { id: true, title: true, slug: true, thumbnail: true, type: true, price: true },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!isAdmin && order.userId !== actorId) {
      throw new ForbiddenException('You do not have access to view this order');
    }

    return order;
  }

  /**
   * Admin/Manager overview of all orders with revenue and conversion metrics.
   */
  async getAllOrders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [orders, total, completedCount, failedCount, pendingCount, revenueAggregate] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          items: {
            include: {
              product: { select: { id: true, title: true, type: true } },
            },
          },
          payment: { select: { id: true, status: true, provider: true } },
        },
      }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      this.prisma.order.count({ where: { status: OrderStatus.FAILED } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { totalAmount: true },
      }),
    ]);

    const totalRevenue = Number(revenueAggregate._sum.totalAmount || 0);
    const successRate = total > 0 ? Number(((completedCount / total) * 100).toFixed(1)) : 0;
    const failureRate = total > 0 ? Number(((failedCount / total) * 100).toFixed(1)) : 0;

    return {
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalOrders: total,
        completedCount,
        failedCount,
        pendingCount,
        totalRevenue,
        successRate,
        failureRate,
      },
    };
  }
}
