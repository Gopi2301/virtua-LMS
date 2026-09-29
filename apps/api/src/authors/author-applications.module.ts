import { Module } from '@nestjs/common';
import { AuthorApplicationsService } from './author-applications.service';
import { AuthorApplicationsController } from './author-applications.controller';
import { AdminAuthorApplicationsController } from './admin-author-applications.controller';

@Module({
    controllers: [AuthorApplicationsController, AdminAuthorApplicationsController],
    providers: [AuthorApplicationsService],
    exports: [AuthorApplicationsService],
})
export class AuthorApplicationsModule {}
