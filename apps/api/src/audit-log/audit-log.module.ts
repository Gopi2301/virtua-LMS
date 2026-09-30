import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [AuditLogService],
    exports: [AuditLogService],
})
export class AuditLogModule {}
