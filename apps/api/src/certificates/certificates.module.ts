import { Module } from '@nestjs/common';
import { AuditLogModule } from 'src/audit-log/audit-log.module';
import { CertificatesController, EnrollmentCertificateController } from './certificates.controller';
import { CertificatesService } from './certificates.service';

@Module({
    imports: [AuditLogModule],
    controllers: [CertificatesController, EnrollmentCertificateController],
    providers: [CertificatesService],
    exports: [CertificatesService],
})
export class CertificatesModule { }
