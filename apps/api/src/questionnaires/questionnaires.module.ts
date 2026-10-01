import { Module } from '@nestjs/common';
import { AuditLogModule } from 'src/audit-log/audit-log.module';
import { CertificatesModule } from 'src/certificates/certificates.module';
import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnaireAttemptsController } from './questionnaire-attempts.controller';
import { QuestionnairesService } from './questionnaires.service';

@Module({
  imports: [AuditLogModule, CertificatesModule],
  controllers: [QuestionnairesController, QuestionnaireAttemptsController],
  providers: [QuestionnairesService],
  exports: [QuestionnairesService],
})
export class QuestionnairesModule {}

