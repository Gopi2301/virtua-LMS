import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CertificatesService } from 'src/certificates/certificates.service';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class ProgressService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly certificatesService: CertificatesService,
    ) { }

    // ─── Upsert session progress ──────────────────────────────────────────────
    async updateProgress(userId: string, enrollmentId: string, dto: UpdateProgressDto) {
        const enrollment = await this.findActiveEnrollmentOrThrow(enrollmentId, userId);

        // Verify session belongs to this enrollment's product
        const session = await this.prisma.session.findFirst({
            where: {
                id: dto.sessionId,
                section: {
                    course: {
                        product: { id: enrollment.productId },
                    },
                },
            },
            include: {
                questionnaire: true,
            },
        });

        if (!session) {
            throw new BadRequestException('Session does not belong to this enrollment');
        }

        // If session has a questionnaire with passingScore > 0, verify student passed
        if (dto.completed && session.questionnaire && session.questionnaire.passingScore > 0) {
            const passed = await this.prisma.questionnaireAttempt.findFirst({
                where: {
                    questionnaireId: session.questionnaire.id,
                    userId,
                    isPassed: true,
                },
            });
            if (!passed) {
                throw new BadRequestException('You must pass the quiz before completing this lesson');
            }
        }

        const progress = await this.prisma.sessionProgress.upsert({
            where: { enrollmentId_sessionId: { enrollmentId, sessionId: dto.sessionId } },
            create: {
                enrollmentId,
                sessionId: dto.sessionId,
                watchTime: dto.watchTime ?? 0,
                completedAt: dto.completed ? new Date() : null,
            },
            update: {
                watchTime: dto.watchTime ?? undefined,
                completedAt: dto.completed ? new Date() : undefined,
            },
        });

        // If completed, check if course is now 100% complete and auto-issue certificate
        if (dto.completed) {
            try {
                await this.certificatesService.issue(enrollmentId, userId);
            } catch (err) {
                // Safely ignored if course not 100% or certificate already exists
            }
        }

        return progress;
    }

    // ─── Get full progress and curriculum for an enrollment ─────────────────
    async getEnrollmentProgress(userId: string, enrollmentId: string) {
        const enrollment = await this.findActiveEnrollmentOrThrow(enrollmentId, userId);

        const product = await this.prisma.product.findUnique({
            where: { id: enrollment.productId },
            include: {
                course: {
                    include: {
                        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                    },
                },
            },
        });

        // Fetch all sessions in the product's courses
        const sections = await this.prisma.section.findMany({
            where: {
                course: {
                    product: { id: enrollment.productId },
                },
            },
            include: {
                sessions: {
                    select: {
                        id: true,
                        title: true,
                        position: true,
                        status: true,
                        description: true,
                        isPreview: true,
                        isFree: true,
                        video: { select: { duration: true } },
                        _count: { select: { resources: true } },
                    },
                    orderBy: { position: 'asc' },
                },
            },
            orderBy: { position: 'asc' },
        });

        const allProgress = await this.prisma.sessionProgress.findMany({
            where: { enrollmentId },
        });

        const certificate = await this.prisma.certificate.findUnique({
            where: { enrollmentId },
            select: { id: true, code: true, issuedAt: true },
        });

        const allSessions = sections.flatMap((s) => s.sessions);
        const totalSessions = allSessions.length;
        const completedSessions = allProgress.filter((p) => p.completedAt).length;
        const percentComplete = totalSessions > 0
            ? Math.round((completedSessions / totalSessions) * 100)
            : 0;

        let nextSessionId = allSessions[0]?.id || null;
        for (const sess of allSessions) {
            const prog = allProgress.find((p) => p.sessionId === sess.id);
            if (!prog || !prog.completedAt) {
                nextSessionId = sess.id;
                break;
            }
        }

        return {
            enrollmentId,
            productId: enrollment.productId,
            productTitle: product?.title,
            productSlug: product?.slug,
            thumbnail: product?.thumbnail,
            author: product?.course?.author,
            percentComplete,
            completedSessions,
            totalSessions,
            certificate,
            nextSessionId,
            sections: sections.map((section) => ({
                id: section.id,
                title: section.title,
                sessions: section.sessions.map((sess) => {
                    const prog = allProgress.find((p) => p.sessionId === sess.id);
                    return {
                        ...sess,
                        watchTime: prog?.watchTime ?? 0,
                        completed: prog?.completedAt != null,
                        completedAt: prog?.completedAt ?? null,
                    };
                }),
            })),
        };
    }

    // ─── Get specific session content inside an enrollment ───────────────────
    async getEnrollmentSession(userId: string, enrollmentId: string, sessionId: string) {
        const enrollment = await this.findActiveEnrollmentOrThrow(enrollmentId, userId);

        const session = await this.prisma.session.findFirst({
            where: {
                id: sessionId,
                section: {
                    course: {
                        product: { id: enrollment.productId },
                    },
                },
            },
            include: {
                video: true,
                resources: { orderBy: { position: 'asc' } },
                questionnaire: {
                    include: {
                        questions: {
                            orderBy: { position: 'asc' },
                            include: {
                                options: {
                                    orderBy: { position: 'asc' },
                                    select: { id: true, text: true, position: true },
                                },
                            },
                        },
                    },
                },
                section: {
                    select: { id: true, title: true },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found in this enrollment');
        }

        const progress = await this.prisma.sessionProgress.findUnique({
            where: { enrollmentId_sessionId: { enrollmentId, sessionId } },
        });

        let questionnaireData: any = null;
        if (session.questionnaire) {
            const latestAttempt = await this.prisma.questionnaireAttempt.findFirst({
                where: {
                    questionnaireId: session.questionnaire.id,
                    userId,
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    status: true,
                    score: true,
                    totalScore: true,
                    scorePercentage: true,
                    isPassed: true,
                    startedAt: true,
                    submittedAt: true,
                },
            });

            questionnaireData = {
                ...session.questionnaire,
                latestAttempt,
            };
        }

        return {
            ...session,
            questionnaire: questionnaireData,
            watchTime: progress?.watchTime ?? 0,
            completed: !!progress?.completedAt,
            completedAt: progress?.completedAt ?? null,
        };
    }

    // ─── Private helpers ──────────────────────────────────────────────────────
    private async findActiveEnrollmentOrThrow(enrollmentId: string, userId: string) {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id: enrollmentId },
        });

        if (!enrollment) {
            throw new NotFoundException('Enrollment not found');
        }

        if (enrollment.userId !== userId) {
            throw new ForbiddenException('You cannot access this enrollment');
        }

        if (enrollment.status !== EnrollmentStatus.ACTIVE) {
            throw new BadRequestException('Enrollment is not active');
        }

        if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
            // Auto-expire
            await this.prisma.enrollment.update({
                where: { id: enrollmentId },
                data: { status: EnrollmentStatus.EXPIRED },
            });
            throw new BadRequestException('Enrollment has expired');
        }

        return enrollment;
    }
}
