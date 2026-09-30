import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export interface CreateAuditLogParams {
    actorId: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
    constructor(private readonly prisma: PrismaService) { }

    async log(params: CreateAuditLogParams): Promise<void> {
        await this.prisma.auditLog.create({
            data: {
                actorId: params.actorId,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                metadata: params.metadata as any,
            },
        });
    }
}
