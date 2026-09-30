import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { AuditAction, EnrollmentStatus } from '@prisma/client';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomBytes } from 'crypto';

/** Generate a short human-readable certificate verification code */
function generateCertCode(): string {
    return randomBytes(6).toString('hex').toUpperCase(); // e.g. A3F9C2D1
}

@Injectable()
export class CertificatesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditLog: AuditLogService,
    ) { }

    // ─── Issue certificate (auto-called when progress hits 100%) ─────────────
    async issue(enrollmentId: string, actorId: string) {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id: enrollmentId },
        });

        if (!enrollment) throw new NotFoundException('Enrollment not found');
        if (enrollment.status !== EnrollmentStatus.ACTIVE) {
            throw new BadRequestException('Enrollment is not active');
        }

        const existing = await this.prisma.certificate.findUnique({
            where: { enrollmentId },
        });

        if (existing) {
            throw new ConflictException('Certificate already issued for this enrollment');
        }

        // Verify 100% completion
        const sections = await this.prisma.section.findMany({
            where: { course: { product: { id: enrollment.productId } } },
            include: { sessions: { select: { id: true } } },
        });

        const totalSessions = sections.flatMap((s) => s.sessions).length;

        if (totalSessions === 0) {
            throw new BadRequestException('Course has no sessions to complete');
        }

        const completedCount = await this.prisma.sessionProgress.count({
            where: { enrollmentId, completedAt: { not: null } },
        });

        if (completedCount < totalSessions) {
            throw new BadRequestException(
                `Course not fully completed: ${completedCount}/${totalSessions} sessions done`,
            );
        }

        let code: string;
        let collision = true;
        while (collision) {
            code = generateCertCode();
            const exists = await this.prisma.certificate.findUnique({ where: { code } });
            collision = !!exists;
        }

        const cert = await this.prisma.certificate.create({
            data: {
                enrollmentId,
                userId: enrollment.userId,
                productId: enrollment.productId,
                code: code!,
            },
        });

        await this.auditLog.log({
            actorId,
            action: AuditAction.CERTIFICATE_ISSUED,
            entityType: 'Certificate',
            entityId: cert.id,
            metadata: { userId: enrollment.userId, productId: enrollment.productId, code: cert.code },
        });

        return cert;
    }

    // ─── Get my certificates ──────────────────────────────────────────────────
    async findMyCertificates(userId: string) {
        return this.prisma.certificate.findMany({
            where: { userId },
            include: {
                product: {
                    select: { id: true, title: true, slug: true, thumbnail: true },
                },
                enrollment: {
                    select: { enrolledAt: true },
                },
            },
            orderBy: { issuedAt: 'desc' },
        });
    }

    // ─── Verify a certificate by code (public) ────────────────────────────────
    async verifyByCode(code: string) {
        const cert = await this.prisma.certificate.findUnique({
            where: { code: code.toUpperCase() },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
                product: { select: { id: true, title: true, slug: true } },
            },
        });

        if (!cert) throw new NotFoundException('Certificate not found or invalid code');

        return cert;
    }

    // ─── Get single certificate by ID ────────────────────────────────────────
    async findOne(id: string) {
        const cert = await this.prisma.certificate.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                product: { select: { id: true, title: true, slug: true, thumbnail: true } },
            },
        });

        if (!cert) throw new NotFoundException('Certificate not found');
        return cert;
    }
}
