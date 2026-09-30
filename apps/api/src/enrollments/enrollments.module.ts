import { Module } from '@nestjs/common';
import { AuditLogModule } from 'src/audit-log/audit-log.module';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';

@Module({
    imports: [AuditLogModule],
    controllers: [EnrollmentsController],
    providers: [EnrollmentsService],
    exports: [EnrollmentsService],
})
export class EnrollmentsModule { }
