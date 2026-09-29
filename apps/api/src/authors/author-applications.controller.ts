import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '@virtua-lms/types';
import { AuthorApplicationsService } from './author-applications.service';
import { CreateAuthorApplicationDto } from './dto/create-application.dto';

@ApiTags('author-applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/authors')
export class AuthorApplicationsController {
    constructor(private readonly applicationsService: AuthorApplicationsService) {}

    @Post('apply')
    @ApiOperation({ summary: 'Submit an application to become an author/instructor' })
    async apply(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateAuthorApplicationDto,
    ) {
        return this.applicationsService.apply(user.id, dto);
    }

    @Get('my-application')
    @ApiOperation({ summary: 'Check status of current user instructor application' })
    async getMyApplication(@CurrentUser() user: AuthenticatedUser) {
        return this.applicationsService.getMyApplication(user.id);
    }
}
