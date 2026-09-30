import {
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
import { CertificatesService } from './certificates.service';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
    constructor(private readonly certificatesService: CertificatesService) { }

    // ─── Public: verify by code ───────────────────────────────────────────────
    @Get('verify/:code')
    @ApiOperation({ summary: 'Verify a certificate by its code (public)' })
    @ApiParam({ name: 'code', description: 'Human-readable certificate code' })
    @ApiResponse({ status: 200, description: 'Certificate details' })
    @ApiResponse({ status: 404, description: 'Invalid code' })
    verify(@Param('code') code: string) {
        return this.certificatesService.verifyByCode(code);
    }

    // ─── Authenticated routes ─────────────────────────────────────────────────
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('me')
    @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Get my certificates' })
    @ApiResponse({ status: 200, description: 'List of certificates earned' })
    findMine(@Req() req) {
        return this.certificatesService.findMyCertificates(req.user.id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get(':id')
    @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Get a certificate by ID' })
    @ApiParam({ name: 'id', description: 'Certificate ID' })
    @ApiResponse({ status: 200, description: 'Certificate details' })
    @ApiResponse({ status: 404, description: 'Not found' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.certificatesService.findOne(id);
    }
}

// ─── Nested under enrollments: issue a certificate ────────────────────────────
@ApiTags('Certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments/:enrollmentId/certificate')
export class EnrollmentCertificateController {
    constructor(private readonly certificatesService: CertificatesService) { }

    @Post()
    @Roles('STUDENT', 'AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Issue certificate for a completed enrollment' })
    @ApiParam({ name: 'enrollmentId', description: 'Enrollment ID' })
    @ApiResponse({ status: 201, description: 'Certificate issued' })
    @ApiResponse({ status: 400, description: 'Course not 100% complete' })
    @ApiResponse({ status: 409, description: 'Certificate already issued' })
    issue(@Param('enrollmentId', ParseUUIDPipe) enrollmentId: string, @Req() req) {
        return this.certificatesService.issue(enrollmentId, req.user.id);
    }
}
