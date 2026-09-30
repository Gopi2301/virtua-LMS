import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatus, SubmissionStatus } from '@prisma/client';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CoursePublishingService } from './course-publishing.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const AUTHOR_ID = 'author-uuid';
const MANAGER_ID = 'manager-uuid';
const PRODUCT_ID = 'product-uuid';
const SUBMISSION_ID = 'submission-uuid';

function mockProduct(status: ProductStatus, authorId = AUTHOR_ID) {
    return {
        id: PRODUCT_ID,
        type: 'COURSE',
        status,
        course: { authorId },
    };
}

function mockSubmission(status: SubmissionStatus = SubmissionStatus.PENDING) {
    return { id: SUBMISSION_ID, productId: PRODUCT_ID, status };
}

const prismaMock = {
    product: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    courseSubmission: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
};

const auditLogMock = { log: jest.fn() };

// ─── Test suite ───────────────────────────────────────────────────────────────
describe('CoursePublishingService', () => {
    let service: CoursePublishingService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CoursePublishingService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: AuditLogService, useValue: auditLogMock },
            ],
        }).compile();

        service = module.get<CoursePublishingService>(CoursePublishingService);
    });

    // ── submitForReview ────────────────────────────────────────────────────────
    describe('submitForReview', () => {
        it('moves a DRAFT course to IN_REVIEW', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.DRAFT),
            );
            prismaMock.courseSubmission.updateMany.mockResolvedValue({ count: 0 });
            prismaMock.product.update.mockResolvedValue({
                ...mockProduct(ProductStatus.IN_REVIEW),
            });
            prismaMock.courseSubmission.create.mockResolvedValue(
                mockSubmission(),
            );

            const result = await service.submitForReview(
                PRODUCT_ID,
                AUTHOR_ID,
                {},
            );
            expect(result.product.status).toBe(ProductStatus.IN_REVIEW);
            expect(auditLogMock.log).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'COURSE_SUBMITTED' }),
            );
        });

        it('moves a CHANGES_REQUESTED course to IN_REVIEW', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.CHANGES_REQUESTED),
            );
            prismaMock.courseSubmission.updateMany.mockResolvedValue({ count: 1 });
            prismaMock.product.update.mockResolvedValue(
                mockProduct(ProductStatus.IN_REVIEW),
            );
            prismaMock.courseSubmission.create.mockResolvedValue(mockSubmission());

            const result = await service.submitForReview(
                PRODUCT_ID,
                AUTHOR_ID,
                {},
            );
            expect(result.product.status).toBe(ProductStatus.IN_REVIEW);
        });

        it('throws ForbiddenException if actor is not the author', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.DRAFT, 'other-author'),
            );
            await expect(
                service.submitForReview(PRODUCT_ID, AUTHOR_ID, {}),
            ).rejects.toThrow(ForbiddenException);
        });

        it('throws BadRequestException for invalid transition (ON_AIR → IN_REVIEW)', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.ON_AIR),
            );
            await expect(
                service.submitForReview(PRODUCT_ID, AUTHOR_ID, {}),
            ).rejects.toThrow(BadRequestException);
        });

        it('throws NotFoundException if course does not exist', async () => {
            prismaMock.product.findUnique.mockResolvedValue(null);
            await expect(
                service.submitForReview(PRODUCT_ID, AUTHOR_ID, {}),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ── approve ────────────────────────────────────────────────────────────────
    describe('approve', () => {
        it('moves IN_REVIEW to APPROVED and resolves submission', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.IN_REVIEW),
            );
            prismaMock.courseSubmission.findFirst.mockResolvedValue(
                mockSubmission(SubmissionStatus.PENDING),
            );
            prismaMock.product.update.mockResolvedValue(
                mockProduct(ProductStatus.APPROVED),
            );
            prismaMock.courseSubmission.update.mockResolvedValue({});

            const result = await service.approve(PRODUCT_ID, MANAGER_ID, {});
            expect(result.status).toBe(ProductStatus.APPROVED);
            expect(auditLogMock.log).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'COURSE_APPROVED' }),
            );
        });

        it('throws BadRequestException for invalid transition (DRAFT → APPROVED)', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.DRAFT),
            );
            await expect(
                service.approve(PRODUCT_ID, MANAGER_ID, {}),
            ).rejects.toThrow(BadRequestException);
        });

        it('throws BadRequestException when no pending submission exists', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.IN_REVIEW),
            );
            prismaMock.courseSubmission.findFirst.mockResolvedValue(null);
            await expect(
                service.approve(PRODUCT_ID, MANAGER_ID, {}),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ── requestChanges ─────────────────────────────────────────────────────────
    describe('requestChanges', () => {
        it('moves IN_REVIEW to CHANGES_REQUESTED', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.IN_REVIEW),
            );
            prismaMock.courseSubmission.findFirst.mockResolvedValue(
                mockSubmission(),
            );
            prismaMock.product.update.mockResolvedValue(
                mockProduct(ProductStatus.CHANGES_REQUESTED),
            );
            prismaMock.courseSubmission.update.mockResolvedValue({});

            const result = await service.requestChanges(PRODUCT_ID, MANAGER_ID, {
                comment: 'Fix the intro video please',
            });
            expect(result.status).toBe(ProductStatus.CHANGES_REQUESTED);
            expect(auditLogMock.log).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'COURSE_CHANGES_REQUESTED' }),
            );
        });

        it('throws BadRequestException when comment is missing', async () => {
            await expect(
                service.requestChanges(PRODUCT_ID, MANAGER_ID, {}),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ── publish ────────────────────────────────────────────────────────────────
    describe('publish', () => {
        it('moves APPROVED to ON_AIR', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.APPROVED),
            );
            prismaMock.product.update.mockResolvedValue(
                mockProduct(ProductStatus.ON_AIR),
            );

            const result = await service.publish(PRODUCT_ID, MANAGER_ID);
            expect(result.status).toBe(ProductStatus.ON_AIR);
            expect(auditLogMock.log).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'COURSE_PUBLISHED' }),
            );
        });

        it('throws BadRequestException when course is not APPROVED', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.IN_REVIEW),
            );
            await expect(
                service.publish(PRODUCT_ID, MANAGER_ID),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ── unpublish ──────────────────────────────────────────────────────────────
    describe('unpublish', () => {
        it('moves ON_AIR to DRAFT', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.ON_AIR),
            );
            prismaMock.product.update.mockResolvedValue(
                mockProduct(ProductStatus.DRAFT),
            );

            const result = await service.unpublish(PRODUCT_ID, MANAGER_ID);
            expect(result.status).toBe(ProductStatus.DRAFT);
            expect(auditLogMock.log).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'COURSE_UNPUBLISHED' }),
            );
        });

        it('throws BadRequestException when course is not ON_AIR', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.APPROVED),
            );
            await expect(
                service.unpublish(PRODUCT_ID, MANAGER_ID),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ── archive ────────────────────────────────────────────────────────────────
    describe('archive', () => {
        it('archives an ON_AIR course', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.ON_AIR),
            );
            prismaMock.product.update.mockResolvedValue(
                mockProduct(ProductStatus.ARCHIVED),
            );

            const result = await service.archive(PRODUCT_ID, MANAGER_ID);
            expect(result.status).toBe(ProductStatus.ARCHIVED);
            expect(auditLogMock.log).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'COURSE_ARCHIVED' }),
            );
        });

        it('throws BadRequestException when already ARCHIVED', async () => {
            prismaMock.product.findUnique.mockResolvedValue(
                mockProduct(ProductStatus.ARCHIVED),
            );
            await expect(
                service.archive(PRODUCT_ID, MANAGER_ID),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
