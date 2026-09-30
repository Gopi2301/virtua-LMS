import { Module } from '@nestjs/common';
import { AuditLogModule } from 'src/audit-log/audit-log.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CoursePublishingController, CoursePublishingQueueController } from './course-publishing.controller';
import { CoursePublishingService } from './course-publishing.service';

@Module({
    imports: [PrismaModule, AuditLogModule],
    controllers: [CoursePublishingController, CoursePublishingQueueController],
    providers: [CoursePublishingService],
    exports: [CoursePublishingService],
})
export class CoursePublishingModule {}
