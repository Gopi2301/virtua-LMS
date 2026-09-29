import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthorApplicationsModule } from "./authors/author-applications.module";
import { CategoriesService } from './categories/categories.service';
import { CategoriesController } from './categories/categories.controller';
import { CoursesService } from './courses/courses.service';
import { CoursesModule } from './courses/courses.module';

@Module({
    imports: [PrismaModule, AuthModule, UsersModule, AuthorApplicationsModule, CoursesModule],
    controllers: [AppController, CategoriesController],
    providers: [CategoriesService, CoursesService],
})
export class AppModule {}