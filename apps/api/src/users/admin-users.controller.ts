import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from './users.service';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateRolesDto } from './dto/update-roles.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'MANAGER')
@Controller('api/admin/users')
export class AdminUsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @ApiOperation({ summary: 'List and search users with pagination and filtering' })
    async findAll(@Query() query: FindUsersQueryDto) {
        return this.usersService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user details by ID' })
    async findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Patch(':id/roles')
    @Roles('SUPER_ADMIN')
    @ApiOperation({ summary: 'Update user roles (Super Admin only)' })
    async updateRoles(
        @Param('id') id: string,
        @Body() dto: UpdateRolesDto,
    ) {
        return this.usersService.updateRoles(id, dto.roles);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Activate or deactivate a user' })
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateStatusDto,
    ) {
        return this.usersService.updateStatus(id, dto.isActive);
    }
}
