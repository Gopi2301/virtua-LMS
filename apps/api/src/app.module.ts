import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthorApplicationsModule } from "./authors/author-applications.module";
import { CoursesModule } from './courses/courses.module';
import { SectionsModule } from './sections/sections.module';
import { CategoriesModule } from "./categories/categories.module";

@Module({
    imports: [PrismaModule, AuthModule, UsersModule, AuthorApplicationsModule, CoursesModule, SectionsModule, CategoriesModule],
    controllers: [AppController],
    providers: [],
})
export class AppModule { }