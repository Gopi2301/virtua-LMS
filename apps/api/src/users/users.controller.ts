import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '@virtua-lms/types';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile from database' })
    async getProfile(@CurrentUser() user: AuthenticatedUser) {
        return this.usersService.getProfile(user.id);
    }

    @Put('profile')
    @ApiOperation({ summary: 'Update current user profile' })
    async updateProfile(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(user.id, dto);
    }
}
