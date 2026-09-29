import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser } from '@virtua-lms/types';
import { keycloakConfig } from './keycloak.config';

@Controller('api/auth')
export class AuthController {
    @Get('config')
    getConfig() {
        return {
            url: keycloakConfig.url,
            realm: keycloakConfig.realm,
            clientId: keycloakConfig.clientId,
        };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getProfile(@CurrentUser() user: AuthenticatedUser) {
        return {
            status: 'authenticated',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                roles: user.roles,
            },
        };
    }

    @Get('admin-test')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    getAdminProtected(@CurrentUser() user: AuthenticatedUser) {
        return {
            message: 'Access granted to admin-level resource',
            user: user.email || user.username,
            roles: user.roles,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('student-test')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STUDENT')
    getStudentProtected(@CurrentUser() user: AuthenticatedUser) {
        return {
            message: 'Access granted to student-level resource',
            user: user.email || user.username,
            roles: user.roles,
            timestamp: new Date().toISOString(),
        };
    }
}
