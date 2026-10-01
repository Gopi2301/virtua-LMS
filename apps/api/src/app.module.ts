import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthorApplicationsModule } from "./authors/author-applications.module";
import { CoursesModule } from './courses/courses.module';
import { SectionsModule } from './sections/sections.module';
import { SessionsModule } from './sessions/sessions.module';
import { VideosModule } from './videos/videos.module';
import { ResourcesModule } from './resources/resources.module';
import { QuestionnairesModule } from './questionnaires/questionnaires.module';
import { BundlesModule } from './bundles/bundles.module';
import { WorkshopsModule } from './workshops/workshops.module';
import { CategoriesModule } from "./categories/categories.module";
import { AuditLogModule } from './audit-log/audit-log.module';
import { CoursePublishingModule } from './course-publishing/course-publishing.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { CertificatesModule } from './certificates/certificates.module';

import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
    imports: [
      PrismaModule,
      AuthModule,
      UsersModule,
      AuthorApplicationsModule,
      CoursesModule,
      SectionsModule,
      SessionsModule,
      VideosModule,
      ResourcesModule,
      QuestionnairesModule,
      BundlesModule,
      WorkshopsModule,
      CategoriesModule,
      AuditLogModule,
      CoursePublishingModule,
      // ─── Phase 4 ───────────────────────────────────────
      EnrollmentsModule,
      ProgressModule,
      CertificatesModule,
      // ─── Phase 5 ───────────────────────────────────────
      OrdersModule,
      PaymentsModule,
    ],
    controllers: [AppController],
    providers: [],
})
export class AppModule { }