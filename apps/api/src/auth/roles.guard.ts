import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from '@virtua-lms/types';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<(string)[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user: AuthenticatedUser = request.user;

        if (!user || !user.roles) {
            throw new ForbiddenException('User lacks required roles');
        }

        // Check if user has at least one of the required roles (or is SUPER_ADMIN which has full access)
        const hasRole = user.roles.some((role) =>
            requiredRoles.includes(role) || role === 'SUPER_ADMIN' || role === 'admin'
        );

        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied. Requires one of roles: [${requiredRoles.join(', ')}]. User has: [${user.roles.join(', ')}]`
            );
        }

        return true;
    }
}
