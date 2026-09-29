import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '@virtua-lms/types';
import { AuthorApplicationsService } from './author-applications.service';
import { ReviewAuthorApplicationDto } from './dto/review-application.dto';
import { ApplicationStatus } from '@prisma/client';

@ApiTags('admin-author-applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'MANAGER')
@Controller('api/admin/author-applications')
export class AdminAuthorApplicationsController {
    constructor(private readonly applicationsService: AuthorApplicationsService) {}

    @Get()
    @ApiOperation({ summary: 'List author applications with pagination and status filtering' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus })
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: ApplicationStatus,
    ) {
        return this.applicationsService.findAll(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
            status,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get application details by ID' })
    async findOne(@Param('id') id: string) {
        return this.applicationsService.findById(id);
    }

    @Patch(':id/review')
    @ApiOperation({ summary: 'Review (Approve or Reject) an author application' })
    async review(
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: ReviewAuthorApplicationDto,
    ) {
        return this.applicationsService.review(id, user.id, dto);
    }
}
