import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { AuditAction, EnrollmentStatus, ProductStatus, ProductType } from '@prisma/client';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EnrollDto } from './dto/enroll.dto';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';

@Injectable()
export class EnrollmentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditLog: AuditLogService,
    ) { }

    // ─── Enroll ───────────────────────────────────────────────────────────────
    async enroll(actorId: string, dto: EnrollDto) {
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        if (product.status !== ProductStatus.ON_AIR) {
            throw new BadRequestException('You can only enroll in published products');
        }

        const allowedTypes: ProductType[] = [ProductType.COURSE, ProductType.BUNDLE];
        if (!allowedTypes.includes(product.type)) {
            throw new BadRequestException('Only courses and bundles support enrollment');
        }

        const existing = await this.prisma.enrollment.findUnique({
            where: { userId_productId: { userId: actorId, productId: dto.productId } },
        });

        if (existing) {
            if (existing.status === EnrollmentStatus.ACTIVE) {
                throw new ConflictException('You are already enrolled in this product');
            }
            // Re-activate a revoked/expired enrollment
            const updated = await this.prisma.enrollment.update({
                where: { id: existing.id },
                data: {
                    status: EnrollmentStatus.ACTIVE,
                    revokedAt: null,
                    revokedById: null,
                    expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                },
            });

            await this.auditLog.log({
                actorId,
                action: AuditAction.ENROLLMENT_CREATED,
                entityType: 'Enrollment',
                entityId: updated.id,
                metadata: { productId: dto.productId, reactivated: true },
            });

            return updated;
        }

        const enrollment = await this.prisma.enrollment.create({
            data: {
                userId: actorId,
                productId: dto.productId,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            },
        });

        await this.auditLog.log({
            actorId,
            action: AuditAction.ENROLLMENT_CREATED,
            entityType: 'Enrollment',
            entityId: enrollment.id,
            metadata: { productId: dto.productId },
        });

        return enrollment;
    }

    // ─── Revoke (manager/admin) ────────────────────────────────────────────────
    async revoke(enrollmentId: string, actorId: string) {
        const enrollment = await this.findEnrollmentOrThrow(enrollmentId);

        if (enrollment.status !== EnrollmentStatus.ACTIVE) {
            throw new BadRequestException('Only active enrollments can be revoked');
        }

        const updated = await this.prisma.enrollment.update({
            where: { id: enrollmentId },
            data: {
                status: EnrollmentStatus.REVOKED,
                revokedAt: new Date(),
                revokedById: actorId,
            },
        });

        await this.auditLog.log({
            actorId,
            action: AuditAction.ENROLLMENT_REVOKED,
            entityType: 'Enrollment',
            entityId: enrollmentId,
            metadata: { userId: enrollment.userId, productId: enrollment.productId },
        });

        return updated;
    }

    // ─── My enrollments (student) ─────────────────────────────────────────────
    async findMyEnrollments(userId: string, query: EnrollmentQueryDto) {
        const { status, page = 1, limit = 20 } = query;

        const where = { userId, ...(status ? { status } : {}) };

        const [enrollments, total] = await Promise.all([
            this.prisma.enrollment.findMany({
                where,
                include: {
                    product: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnail: true,
                            type: true,
                            status: true,
                        },
                    },
                    certificate: { select: { id: true, code: true, issuedAt: true } },
                },
                orderBy: { enrolledAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.enrollment.count({ where }),
        ]);

        return { enrollments, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── All enrollments for a product (manager/admin) ────────────────────────
    async findByProduct(productId: string, query: EnrollmentQueryDto) {
        const { status, page = 1, limit = 20 } = query;
        const where = { productId, ...(status ? { status } : {}) };

        const [enrollments, total] = await Promise.all([
            this.prisma.enrollment.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                },
                orderBy: { enrolledAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.enrollment.count({ where }),
        ]);

        return { enrollments, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── Single enrollment ────────────────────────────────────────────────────
    async findOne(enrollmentId: string, requesterId: string, requesterRoles: string[]) {
        const enrollment = await this.findEnrollmentOrThrow(enrollmentId);

        const isOwner = enrollment.userId === requesterId;
        const isPrivileged = requesterRoles.some((r) => ['MANAGER', 'SUPER_ADMIN'].includes(r));

        if (!isOwner && !isPrivileged) {
            throw new ForbiddenException('Access denied');
        }

        return enrollment;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────
    private async findEnrollmentOrThrow(enrollmentId: string) {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id: enrollmentId },
        });

        if (!enrollment) {
            throw new NotFoundException('Enrollment not found');
        }

        return enrollment;
    }
}
