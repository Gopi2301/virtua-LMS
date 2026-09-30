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
import { EnrollDto } from './dto/enroll.dto';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments')
export class EnrollmentsController {
    constructor(private readonly enrollmentsService: EnrollmentsService) { }

    // ─── Student: enroll self ─────────────────────────────────────────────────
    @Post()
    @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Enroll in a course or bundle' })
    @ApiResponse({ status: 201, description: 'Enrollment created' })
    @ApiResponse({ status: 400, description: 'Product not published or invalid type' })
    @ApiResponse({ status: 409, description: 'Already enrolled' })
    enroll(@Body() dto: EnrollDto, @Req() req) {
        return this.enrollmentsService.enroll(req.user.id, dto);
    }

    // ─── Student: my enrollments ──────────────────────────────────────────────
    @Get('me')
    @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Get my enrollments' })
    @ApiResponse({ status: 200, description: 'Paginated list of my enrollments' })
    findMine(@Query() query: EnrollmentQueryDto, @Req() req) {
        return this.enrollmentsService.findMyEnrollments(req.user.id, query);
    }

    // ─── Manager: enrollments for a product ──────────────────────────────────
    @Get('product/:productId')
    @Roles('MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'List all enrollments for a product (manager)' })
    @ApiParam({ name: 'productId', description: 'Product ID' })
    @ApiResponse({ status: 200, description: 'Paginated enrollment list' })
    findByProduct(
        @Param('productId', ParseUUIDPipe) productId: string,
        @Query() query: EnrollmentQueryDto,
    ) {
        return this.enrollmentsService.findByProduct(productId, query);
    }

    // ─── Get single enrollment ─────────────────────────────────────────────────
    @Get(':id')
    @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Get a single enrollment (owner or manager)' })
    @ApiParam({ name: 'id', description: 'Enrollment ID' })
    @ApiResponse({ status: 200, description: 'Enrollment details' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiResponse({ status: 404, description: 'Not found' })
    findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
        return this.enrollmentsService.findOne(id, req.user.id, req.user.roles);
    }

    // ─── Manager: revoke enrollment ───────────────────────────────────────────
    @Post(':id/revoke')
    @Roles('MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Revoke an enrollment' })
    @ApiParam({ name: 'id', description: 'Enrollment ID' })
    @ApiResponse({ status: 201, description: 'Enrollment revoked' })
    @ApiResponse({ status: 400, description: 'Not active' })
    @ApiResponse({ status: 404, description: 'Not found' })
    revoke(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
        return this.enrollmentsService.revoke(id, req.user.id);
    }
}
