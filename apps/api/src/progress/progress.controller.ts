import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
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
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ProgressService } from './progress.service';

@ApiTags('Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments/:enrollmentId/progress')
export class ProgressController {
    constructor(private readonly progressService: ProgressService) { }

    @Get()
    @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Get full progress for an enrollment' })
    @ApiParam({ name: 'enrollmentId', description: 'Enrollment ID' })
    @ApiResponse({ status: 200, description: 'Progress breakdown per session' })
    getProgress(@Param('enrollmentId', ParseUUIDPipe) enrollmentId: string, @Req() req) {
        return this.progressService.getEnrollmentProgress(req.user.id, enrollmentId);
    }

    @Post()
    @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Update session progress (watch time / mark complete)' })
    @ApiParam({ name: 'enrollmentId', description: 'Enrollment ID' })
    @ApiResponse({ status: 201, description: 'Progress updated' })
    @ApiResponse({ status: 400, description: 'Session not in enrollment or enrollment inactive' })
    updateProgress(
        @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
        @Body() dto: UpdateProgressDto,
        @Req() req,
    ) {
        return this.progressService.updateProgress(req.user.id, enrollmentId, dto);
    }
}
