import { Module } from '@nestjs/common';
import { CertificatesModule } from 'src/certificates/certificates.module';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
    imports: [CertificatesModule],
    controllers: [ProgressController],
    providers: [ProgressService],
    exports: [ProgressService],
})
export class ProgressModule { }

