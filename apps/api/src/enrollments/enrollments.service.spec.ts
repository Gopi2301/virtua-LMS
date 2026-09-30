import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, EnrollmentStatus, ProductStatus, ProductType } from '@prisma/client';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EnrollmentsService } from './enrollments.service';

const USER_ID = 'student-uuid';
const PRODUCT_ID = 'product-uuid';
const ENROLLMENT_ID = 'enrollment-uuid';

const prismaMock = {
    product: {
        findUnique: jest.fn() as jest.Mock<any>,
    },
    enrollment: {
        findUnique: jest.fn() as jest.Mock<any>,
        findMany: jest.fn() as jest.Mock<any>,
        create: jest.fn() as jest.Mock<any>,
        update: jest.fn() as jest.Mock<any>,
        count: jest.fn() as jest.Mock<any>,
    },
};

const auditLogMock = { log: jest.fn() as jest.Mock<any> };

describe('EnrollmentsService', () => {
    let service: EnrollmentsService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EnrollmentsService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: AuditLogService, useValue: auditLogMock },
            ],
        }).compile();

        service = module.get<EnrollmentsService>(EnrollmentsService);
    });

    describe('enroll', () => {
        it('throws NotFoundException if product does not exist', async () => {
            prismaMock.product.findUnique.mockResolvedValue(null);

            await expect(service.enroll(USER_ID, { productId: PRODUCT_ID })).rejects.toThrow(
                NotFoundException,
            );
        });

        it('throws BadRequestException if product is not ON_AIR', async () => {
            prismaMock.product.findUnique.mockResolvedValue({
                id: PRODUCT_ID,
                status: ProductStatus.DRAFT,
                type: ProductType.COURSE,
            });

            await expect(service.enroll(USER_ID, { productId: PRODUCT_ID })).rejects.toThrow(
                BadRequestException,
            );
        });

        it('throws BadRequestException if product is not course or bundle', async () => {
            prismaMock.product.findUnique.mockResolvedValue({
                id: PRODUCT_ID,
                status: ProductStatus.ON_AIR,
                type: ProductType.WORKSHOP,
            });

            await expect(service.enroll(USER_ID, { productId: PRODUCT_ID })).rejects.toThrow(
                BadRequestException,
            );
        });

        it('throws ConflictException if already actively enrolled', async () => {
            prismaMock.product.findUnique.mockResolvedValue({
                id: PRODUCT_ID,
                status: ProductStatus.ON_AIR,
                type: ProductType.COURSE,
            });
            prismaMock.enrollment.findUnique.mockResolvedValue({
                id: ENROLLMENT_ID,
                status: EnrollmentStatus.ACTIVE,
            });

            await expect(service.enroll(USER_ID, { productId: PRODUCT_ID })).rejects.toThrow(
                ConflictException,
            );
        });

        it('creates an enrollment successfully when eligible', async () => {
            prismaMock.product.findUnique.mockResolvedValue({
                id: PRODUCT_ID,
                status: ProductStatus.ON_AIR,
                type: ProductType.COURSE,
            });
            prismaMock.enrollment.findUnique.mockResolvedValue(null);
            prismaMock.enrollment.create.mockResolvedValue({
                id: ENROLLMENT_ID,
                userId: USER_ID,
                productId: PRODUCT_ID,
                status: EnrollmentStatus.ACTIVE,
            });

            const result = await service.enroll(USER_ID, { productId: PRODUCT_ID });

            expect(result.id).toEqual(ENROLLMENT_ID);
            expect(auditLogMock.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    actorId: USER_ID,
                    action: AuditAction.ENROLLMENT_CREATED,
                }),
            );
        });
    });

    describe('revoke', () => {
        it('throws BadRequestException if enrollment is not ACTIVE', async () => {
            prismaMock.enrollment.findUnique.mockResolvedValue({
                id: ENROLLMENT_ID,
                status: EnrollmentStatus.REVOKED,
            });

            await expect(service.revoke(ENROLLMENT_ID, 'manager-id')).rejects.toThrow(
                BadRequestException,
            );
        });

        it('revokes active enrollment successfully', async () => {
            prismaMock.enrollment.findUnique.mockResolvedValue({
                id: ENROLLMENT_ID,
                status: EnrollmentStatus.ACTIVE,
                userId: USER_ID,
                productId: PRODUCT_ID,
            });
            prismaMock.enrollment.update.mockResolvedValue({
                id: ENROLLMENT_ID,
                status: EnrollmentStatus.REVOKED,
            });

            const res = await service.revoke(ENROLLMENT_ID, 'manager-id');
            expect(res.status).toBe(EnrollmentStatus.REVOKED);
            expect(auditLogMock.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: AuditAction.ENROLLMENT_REVOKED,
                }),
            );
        });
    });
});
