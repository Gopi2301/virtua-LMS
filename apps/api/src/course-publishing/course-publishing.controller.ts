import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { CoursePublishingService } from './course-publishing.service';
import { ReviewDecisionDto } from './dto/review-decision.dto';
import { ReviewQueueQueryDto } from './dto/review-queue-query.dto';
import { SubmitForReviewDto } from './dto/submit-for-review.dto';

@ApiTags('Course Publishing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses/:id/publishing')
export class CoursePublishingController {
    constructor(
        private readonly coursePublishingService: CoursePublishingService,
    ) {}

    // ─── Author actions ───────────────────────────────────────────────────────

    @Post('submit')
    @Roles('AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @ApiOperation({
        summary: 'Submit course for manager review',
        description:
            'Author submits a DRAFT or CHANGES_REQUESTED course for approval. Moves status to IN_REVIEW.',
    })
    @ApiParam({ name: 'id', description: 'Course product ID' })
    @ApiResponse({ status: 201, description: 'Course submitted for review' })
    @ApiResponse({ status: 400, description: 'Invalid transition or missing submission' })
    @ApiResponse({ status: 403, description: 'Not the course author' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    submitForReview(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: SubmitForReviewDto,
        @Req() req,
    ) {
        return this.coursePublishingService.submitForReview(id, req.user.id, dto);
    }

    // ─── Manager / Super Admin actions ────────────────────────────────────────

    @Post('approve')
    @Roles('MANAGER', 'SUPER_ADMIN')
    @ApiOperation({
        summary: 'Approve a submitted course',
        description: 'Moves status from IN_REVIEW → APPROVED.',
    })
    @ApiParam({ name: 'id', description: 'Course product ID' })
    @ApiResponse({ status: 201, description: 'Course approved' })
    @ApiResponse({ status: 400, description: 'Invalid transition' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    approve(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ReviewDecisionDto,
        @Req() req,
    ) {
        return this.coursePublishingService.approve(id, req.user.id, dto);
    }

    @Post('request-changes')
    @Roles('MANAGER', 'SUPER_ADMIN')
    @ApiOperation({
        summary: 'Request changes on a submitted course',
        description:
            'Moves status from IN_REVIEW → CHANGES_REQUESTED. A review comment is required.',
    })
    @ApiParam({ name: 'id', description: 'Course product ID' })
    @ApiResponse({ status: 201, description: 'Changes requested' })
    @ApiResponse({ status: 400, description: 'Comment required or invalid transition' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    requestChanges(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ReviewDecisionDto,
        @Req() req,
    ) {
        return this.coursePublishingService.requestChanges(id, req.user.id, dto);
    }

    @Post('publish')
    @Roles('MANAGER', 'SUPER_ADMIN')
    @ApiOperation({
        summary: 'Publish an approved course',
        description: 'Moves status from APPROVED → ON_AIR.',
    })
    @ApiParam({ name: 'id', description: 'Course product ID' })
    @ApiResponse({ status: 201, description: 'Course published and now ON_AIR' })
    @ApiResponse({ status: 400, description: 'Course not in APPROVED state' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    publish(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
        return this.coursePublishingService.publish(id, req.user.id);
    }

    @Post('unpublish')
    @Roles('MANAGER', 'SUPER_ADMIN')
    @ApiOperation({
        summary: 'Unpublish a live course',
        description: 'Moves status from ON_AIR → DRAFT.',
    })
    @ApiParam({ name: 'id', description: 'Course product ID' })
    @ApiResponse({ status: 201, description: 'Course unpublished' })
    @ApiResponse({ status: 400, description: 'Course not ON_AIR' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    unpublish(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
        return this.coursePublishingService.unpublish(id, req.user.id);
    }

    @Post('archive')
    @Roles('MANAGER', 'SUPER_ADMIN')
    @ApiOperation({
        summary: 'Archive a course',
        description: 'Moves course to ARCHIVED (terminal state).',
    })
    @ApiParam({ name: 'id', description: 'Course product ID' })
    @ApiResponse({ status: 201, description: 'Course archived' })
    @ApiResponse({ status: 400, description: 'Invalid state for archiving' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    archive(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
        return this.coursePublishingService.archive(id, req.user.id);
    }

    // ─── Read endpoints ───────────────────────────────────────────────────────

    @Get('submissions')
    @Roles('AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @ApiOperation({
        summary: 'Get submission history for a course',
        description: 'Returns all past submission cycles for the course.',
    })
    @ApiParam({ name: 'id', description: 'Course product ID' })
    @ApiResponse({ status: 200, description: 'Submission history' })
    getSubmissionHistory(@Param('id', ParseUUIDPipe) id: string) {
        return this.coursePublishingService.getSubmissionHistory(id);
    }
}

// ─── Separate controller for Manager review queue (no :id prefix) ─────────────
@ApiTags('Course Publishing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('course-publishing')
export class CoursePublishingQueueController {
    constructor(
        private readonly coursePublishingService: CoursePublishingService,
    ) {}

    @Get('review-queue')
    @Roles('MANAGER', 'SUPER_ADMIN')
    @ApiOperation({
        summary: 'Get the manager review queue',
        description:
            'Returns courses pending review (or filtered by submission status).',
    })
    @ApiResponse({ status: 200, description: 'Paginated review queue' })
    getReviewQueue(@Query() query: ReviewQueueQueryDto) {
        return this.coursePublishingService.getReviewQueue(query);
    }
}
