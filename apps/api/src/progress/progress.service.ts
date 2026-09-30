import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class ProgressService {
    constructor(private readonly prisma: PrismaService) { }

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
        });

        if (!session) {
            throw new BadRequestException('Session does not belong to this enrollment');
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

        return progress;
    }

    // ─── Get full progress for an enrollment ─────────────────────────────────
    async getEnrollmentProgress(userId: string, enrollmentId: string) {
        const enrollment = await this.findActiveEnrollmentOrThrow(enrollmentId, userId);

        // Fetch all sessions in the product's courses
        const sections = await this.prisma.section.findMany({
            where: {
                course: {
                    product: { id: enrollment.productId },
                },
            },
            include: {
                sessions: {
                    select: { id: true, title: true, position: true, status: true },
                    orderBy: { position: 'asc' },
                },
            },
            orderBy: { position: 'asc' },
        });

        const completedProgress = await this.prisma.sessionProgress.findMany({
            where: { enrollmentId, completedAt: { not: null } },
            select: { sessionId: true },
        });

        const allProgress = await this.prisma.sessionProgress.findMany({
            where: { enrollmentId },
        });

        const totalSessions = sections.flatMap((s) => s.sessions).length;
        const completedCount = completedProgress.length;
        const percentComplete = totalSessions > 0
            ? Math.round((completedCount / totalSessions) * 100)
            : 0;

        return {
            enrollmentId,
            productId: enrollment.productId,
            percentComplete,
            completedSessions: completedCount,
            totalSessions,
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
