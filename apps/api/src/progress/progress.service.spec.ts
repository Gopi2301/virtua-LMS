import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProgressService } from './progress.service';

const USER_ID = 'user-uuid';
const ENROLLMENT_ID = 'enrollment-uuid';
const PRODUCT_ID = 'product-uuid';
const SESSION_ID = 'session-uuid';

const prismaMock = {
    enrollment: {
        findUnique: jest.fn() as jest.Mock<any>,
        update: jest.fn() as jest.Mock<any>,
    },
    session: {
        findFirst: jest.fn() as jest.Mock<any>,
    },
    sessionProgress: {
        upsert: jest.fn() as jest.Mock<any>,
        findMany: jest.fn() as jest.Mock<any>,
    },
    section: {
        findMany: jest.fn() as jest.Mock<any>,
    },
};

describe('ProgressService', () => {
    let service: ProgressService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProgressService,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        service = module.get<ProgressService>(ProgressService);
    });

    describe('updateProgress', () => {
        it('throws NotFoundException if enrollment not found', async () => {
            prismaMock.enrollment.findUnique.mockResolvedValue(null);

            await expect(
                service.updateProgress(USER_ID, ENROLLMENT_ID, { sessionId: SESSION_ID }),
            ).rejects.toThrow(NotFoundException);
        });

        it('throws ForbiddenException if enrollment belongs to different user', async () => {
            prismaMock.enrollment.findUnique.mockResolvedValue({
                id: ENROLLMENT_ID,
                userId: 'other-user',
                status: EnrollmentStatus.ACTIVE,
            });

            await expect(
                service.updateProgress(USER_ID, ENROLLMENT_ID, { sessionId: SESSION_ID }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('throws BadRequestException if session is not part of the course', async () => {
            prismaMock.enrollment.findUnique.mockResolvedValue({
                id: ENROLLMENT_ID,
                userId: USER_ID,
                status: EnrollmentStatus.ACTIVE,
                productId: PRODUCT_ID,
            });
            prismaMock.session.findFirst.mockResolvedValue(null);

            await expect(
                service.updateProgress(USER_ID, ENROLLMENT_ID, { sessionId: SESSION_ID }),
            ).rejects.toThrow(BadRequestException);
        });

        it('upserts session progress when valid', async () => {
            prismaMock.enrollment.findUnique.mockResolvedValue({
                id: ENROLLMENT_ID,
                userId: USER_ID,
                status: EnrollmentStatus.ACTIVE,
                productId: PRODUCT_ID,
            });
            prismaMock.session.findFirst.mockResolvedValue({ id: SESSION_ID });
            prismaMock.sessionProgress.upsert.mockResolvedValue({
                id: 'progress-uuid',
                enrollmentId: ENROLLMENT_ID,
                sessionId: SESSION_ID,
                watchTime: 120,
            });

            const res = await service.updateProgress(USER_ID, ENROLLMENT_ID, {
                sessionId: SESSION_ID,
                watchTime: 120,
                completed: true,
            });

            expect(res.id).toBe('progress-uuid');
        });
    });

    describe('getEnrollmentProgress', () => {
        it('calculates percent complete accurately', async () => {
            prismaMock.enrollment.findUnique.mockResolvedValue({
                id: ENROLLMENT_ID,
                userId: USER_ID,
                status: EnrollmentStatus.ACTIVE,
                productId: PRODUCT_ID,
            });
            prismaMock.section.findMany.mockResolvedValue([
                {
                    id: 'sec-1',
                    title: 'Section 1',
                    sessions: [{ id: 's1', title: 'S1', position: 0, status: 'VIDEO' }],
                },
                {
                    id: 'sec-2',
                    title: 'Section 2',
                    sessions: [{ id: 's2', title: 'S2', position: 0, status: 'VIDEO' }],
                },
            ]);
            prismaMock.sessionProgress.findMany
                .mockResolvedValueOnce([{ sessionId: 's1' }]) // completedProgress
                .mockResolvedValueOnce([                      // allProgress
                    { sessionId: 's1', watchTime: 300, completedAt: new Date() },
                ]);

            const res = await service.getEnrollmentProgress(USER_ID, ENROLLMENT_ID);
            expect(res.totalSessions).toBe(2);
            expect(res.completedSessions).toBe(1);
            expect(res.percentComplete).toBe(50);
        });
    });
});
