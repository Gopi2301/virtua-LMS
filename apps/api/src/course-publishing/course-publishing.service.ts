import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { AuditAction, ProductStatus, SubmissionStatus } from '@prisma/client';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReviewDecisionDto } from './dto/review-decision.dto';
import { ReviewQueueQueryDto } from './dto/review-queue-query.dto';
import { SubmitForReviewDto } from './dto/submit-for-review.dto';

// ─── Allowed status transitions ───────────────────────────────────────────────
const ALLOWED_TRANSITIONS: Partial<Record<ProductStatus, ProductStatus[]>> = {
    [ProductStatus.DRAFT]: [ProductStatus.IN_REVIEW],
    [ProductStatus.CHANGES_REQUESTED]: [ProductStatus.IN_REVIEW],
    [ProductStatus.IN_REVIEW]: [
        ProductStatus.APPROVED,
        ProductStatus.CHANGES_REQUESTED,
    ],
    [ProductStatus.APPROVED]: [ProductStatus.ON_AIR],
    [ProductStatus.ON_AIR]: [ProductStatus.DRAFT, ProductStatus.ARCHIVED],
};

function assertTransition(from: ProductStatus, to: ProductStatus): void {
    const allowed = ALLOWED_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
        throw new BadRequestException(
            `Cannot transition from ${from} to ${to}`,
        );
    }
}

@Injectable()
export class CoursePublishingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditLog: AuditLogService,
    ) {}

    // ─── Submit for Review ────────────────────────────────────────────────────
    async submitForReview(
        productId: string,
        actorId: string,
        dto: SubmitForReviewDto,
    ) {
        const product = await this.findProductOrThrow(productId);

        // Only the course author can submit
        if (!product.course) {
            throw new BadRequestException('Only courses can be submitted for review');
        }
        if (product.course.authorId !== actorId) {
            throw new ForbiddenException('You can only submit your own courses');
        }

        assertTransition(product.status, ProductStatus.IN_REVIEW);

        // Close any previously PENDING submissions (edge-case safety)
        await this.prisma.courseSubmission.updateMany({
            where: { productId, status: SubmissionStatus.PENDING },
            data: { status: SubmissionStatus.CHANGES_REQUESTED },
        });

        const [updatedProduct, submission] = await this.prisma.$transaction([
            this.prisma.product.update({
                where: { id: productId },
                data: { status: ProductStatus.IN_REVIEW, updatedById: actorId },
            }),
            this.prisma.courseSubmission.create({
                data: {
                    productId,
                    submittedById: actorId,
                    status: SubmissionStatus.PENDING,
                    reviewComment: dto.note,
                },
            }),
        ]);

        await this.auditLog.log({
            actorId,
            action: AuditAction.COURSE_SUBMITTED,
            entityType: 'Product',
            entityId: productId,
            metadata: { submissionId: submission.id, note: dto.note },
        });

        return { product: updatedProduct, submission };
    }

    // ─── Get Review Queue (manager) ───────────────────────────────────────────
    async getReviewQueue(query: ReviewQueueQueryDto) {
        const { status = SubmissionStatus.PENDING, page = 1, limit = 20 } = query;

        const [submissions, total] = await Promise.all([
            this.prisma.courseSubmission.findMany({
                where: { status },
                include: {
                    product: {
                        include: {
                            course: {
                                include: {
                                    author: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                            avatarUrl: true,
                                        },
                                    },
                                    category: true,
                                },
                            },
                        },
                    },
                    submittedBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                },
                orderBy: { submittedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.courseSubmission.count({ where: { status } }),
        ]);

        return {
            submissions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ─── Get Submission History for a course ─────────────────────────────────
    async getSubmissionHistory(productId: string) {
        await this.findProductOrThrow(productId);

        return this.prisma.courseSubmission.findMany({
            where: { productId },
            include: {
                submittedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                reviewedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { submittedAt: 'desc' },
        });
    }

    // ─── Approve ──────────────────────────────────────────────────────────────
    async approve(productId: string, actorId: string, dto: ReviewDecisionDto) {
        const product = await this.findProductOrThrow(productId);
        assertTransition(product.status, ProductStatus.APPROVED);

        const pendingSubmission = await this.findPendingSubmissionOrThrow(productId);

        const [updatedProduct] = await this.prisma.$transaction([
            this.prisma.product.update({
                where: { id: productId },
                data: { status: ProductStatus.APPROVED, updatedById: actorId },
            }),
            this.prisma.courseSubmission.update({
                where: { id: pendingSubmission.id },
                data: {
                    status: SubmissionStatus.APPROVED,
                    reviewedById: actorId,
                    reviewedAt: new Date(),
                    reviewComment: dto.comment,
                },
            }),
        ]);

        await this.auditLog.log({
            actorId,
            action: AuditAction.COURSE_APPROVED,
            entityType: 'Product',
            entityId: productId,
            metadata: { submissionId: pendingSubmission.id, comment: dto.comment },
        });

        return updatedProduct;
    }

    // ─── Request Changes ──────────────────────────────────────────────────────
    async requestChanges(
        productId: string,
        actorId: string,
        dto: ReviewDecisionDto,
    ) {
        if (!dto.comment?.trim()) {
            throw new BadRequestException(
                'A review comment is required when requesting changes',
            );
        }

        const product = await this.findProductOrThrow(productId);
        assertTransition(product.status, ProductStatus.CHANGES_REQUESTED);

        const pendingSubmission = await this.findPendingSubmissionOrThrow(productId);

        const [updatedProduct] = await this.prisma.$transaction([
            this.prisma.product.update({
                where: { id: productId },
                data: {
                    status: ProductStatus.CHANGES_REQUESTED,
                    updatedById: actorId,
                },
            }),
            this.prisma.courseSubmission.update({
                where: { id: pendingSubmission.id },
                data: {
                    status: SubmissionStatus.CHANGES_REQUESTED,
                    reviewedById: actorId,
                    reviewedAt: new Date(),
                    reviewComment: dto.comment,
                },
            }),
        ]);

        await this.auditLog.log({
            actorId,
            action: AuditAction.COURSE_CHANGES_REQUESTED,
            entityType: 'Product',
            entityId: productId,
            metadata: { submissionId: pendingSubmission.id, comment: dto.comment },
        });

        return updatedProduct;
    }

    // ─── Publish ──────────────────────────────────────────────────────────────
    async publish(productId: string, actorId: string) {
        const product = await this.findProductOrThrow(productId);
        assertTransition(product.status, ProductStatus.ON_AIR);

        const updatedProduct = await this.prisma.product.update({
            where: { id: productId },
            data: { status: ProductStatus.ON_AIR, updatedById: actorId },
        });

        await this.auditLog.log({
            actorId,
            action: AuditAction.COURSE_PUBLISHED,
            entityType: 'Product',
            entityId: productId,
        });

        return updatedProduct;
    }

    // ─── Unpublish ────────────────────────────────────────────────────────────
    async unpublish(productId: string, actorId: string) {
        const product = await this.findProductOrThrow(productId);

        if (product.status !== ProductStatus.ON_AIR) {
            throw new BadRequestException('Only ON_AIR courses can be unpublished');
        }

        const updatedProduct = await this.prisma.product.update({
            where: { id: productId },
            data: { status: ProductStatus.DRAFT, updatedById: actorId },
        });

        await this.auditLog.log({
            actorId,
            action: AuditAction.COURSE_UNPUBLISHED,
            entityType: 'Product',
            entityId: productId,
        });

        return updatedProduct;
    }

    // ─── Archive ──────────────────────────────────────────────────────────────
    async archive(productId: string, actorId: string) {
        const product = await this.findProductOrThrow(productId);

        const archivableStatuses: ProductStatus[] = [
            ProductStatus.ON_AIR,
            ProductStatus.APPROVED,
            ProductStatus.DRAFT,
            ProductStatus.CHANGES_REQUESTED,
        ];

        if (!archivableStatuses.includes(product.status)) {
            throw new BadRequestException(
                `Cannot archive a course with status ${product.status}`,
            );
        }

        const updatedProduct = await this.prisma.product.update({
            where: { id: productId },
            data: { status: ProductStatus.ARCHIVED, updatedById: actorId },
        });

        await this.auditLog.log({
            actorId,
            action: AuditAction.COURSE_ARCHIVED,
            entityType: 'Product',
            entityId: productId,
        });

        return updatedProduct;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────
    private async findProductOrThrow(productId: string) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId, type: 'COURSE' },
            include: { course: true },
        });

        if (!product) {
            throw new NotFoundException('Course not found');
        }

        return product;
    }

    private async findPendingSubmissionOrThrow(productId: string) {
        const submission = await this.prisma.courseSubmission.findFirst({
            where: { productId, status: SubmissionStatus.PENDING },
            orderBy: { submittedAt: 'desc' },
        });

        if (!submission) {
            throw new BadRequestException(
                'No pending submission found for this course',
            );
        }

        return submission;
    }
}
