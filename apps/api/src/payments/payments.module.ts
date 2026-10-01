import { Module } from '@nestjs/common';
import { AuditLogModule } from 'src/audit-log/audit-log.module';
import { VirtuaPaymentsDummyService } from 'src/integrations/virtuapayments/virtuapayments.dummy.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, VirtuaPaymentsDummyService],
  exports: [PaymentsService, VirtuaPaymentsDummyService],
})
export class PaymentsModule {}
