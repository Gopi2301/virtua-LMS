import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, EnrollmentStatus } from '@prisma/client';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CertificatesService } from './certificates.service';

const USER_ID = 'student-uuid';
const ENROLLMENT_ID = 'enrollment-uuid';
const PRODUCT_ID = 'product-uuid';

const prismaMock = {
    enrollment: {
        findUnique: jest.fn() as jest.Mock<any>,
    },
    certificate: {
        findUnique: jest.fn() as jest.Mock<any>,
        create: jest.fn() as jest.Mock<any>,
        findMany: jest.fn() as jest.Mock<any>,
    },
    section: {
        findMany: jest.fn() as jest.Mock<any>,
    },
    sessionProgress: {
        count: jest.fn() as jest.Mock<any>,
    },
};

const auditLogMock = { log: jest.fn() as jest.Mock<any> };

describe('CertificatesService', () => {
    let service: CertificatesService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CertificatesService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: AuditLogService, useValue: auditLogMock },
            ],
        }).compile();

        service = module.get<CertificatesService>(CertificatesService);
    });

    describe('issue', () => {
        it('throws NotFoundException if enrollment not found', async () => {
            prismaMock.enrollment.findUnique.mockResolvedValue(null);

            await expect(service.issue(ENROLLMENT_ID, USER_ID)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('throws ConflictException if certificate already issued', async () => {
            prismaMock.enrollment.findUnique.mockResolvedValue({
                id: ENROLLMENT_ID,
                status: EnrollmentStatus.ACTIVE,
                productId: PRODUCT_ID,
                userId: USER_ID,
            });
            prismaMock.certificate.findUnique.mockResolvedValue({ id: 'existing-cert' });

            await expect(service.issue(ENROLLMENT_ID, USER_ID)).rejects.toThrow(
                ConflictException,
            );
        });

        it('throws BadRequestException if course is not 100% complete', async () => {
            prismaMock.enrollment.findUnique.mockResolvedValue({
                id: ENROLLMENT_ID,
                status: EnrollmentStatus.ACTIVE,
                productId: PRODUCT_ID,
                userId: USER_ID,
            });
            prismaMock.certificate.findUnique.mockResolvedValue(null);
            prismaMock.section.findMany.mockResolvedValue([
                { sessions: [{ id: 's1' }, { id: 's2' }] },
            ]);
            prismaMock.sessionProgress.count.mockResolvedValue(1); // Only 1 of 2 completed

            await expect(service.issue(ENROLLMENT_ID, USER_ID)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('issues certificate successfully when 100% completed', async () => {
            prismaMock.enrollment.findUnique.mockResolvedValue({
                id: ENROLLMENT_ID,
                status: EnrollmentStatus.ACTIVE,
                productId: PRODUCT_ID,
                userId: USER_ID,
            });
            prismaMock.certificate.findUnique
                .mockResolvedValueOnce(null) // enrollment check
                .mockResolvedValueOnce(null); // code collision check
            prismaMock.section.findMany.mockResolvedValue([
                { sessions: [{ id: 's1' }] },
            ]);
            prismaMock.sessionProgress.count.mockResolvedValue(1);
            prismaMock.certificate.create.mockResolvedValue({
                id: 'cert-1',
                code: 'AB12CD',
                enrollmentId: ENROLLMENT_ID,
            });

            const cert = await service.issue(ENROLLMENT_ID, USER_ID);

            expect(cert.id).toBe('cert-1');
            expect(auditLogMock.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: AuditAction.CERTIFICATE_ISSUED,
                }),
            );
        });
    });

    describe('verifyByCode', () => {
        it('throws NotFoundException if code does not exist', async () => {
            prismaMock.certificate.findUnique.mockResolvedValue(null);

            await expect(service.verifyByCode('UNKNOWN')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('returns certificate details for valid code', async () => {
            const certData = { id: 'c1', code: 'VALID123', user: {}, product: {} };
            prismaMock.certificate.findUnique.mockResolvedValue(certData);

            const result = await service.verifyByCode('valid123');
            expect(result).toBe(certData);
        });
    });
});
