import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { Role } from '@prisma/client';
import type { AuthenticatedUser, KeycloakTokenPayload, UserRole } from '@virtua-lms/types';
import { keycloakConfig } from './keycloak.config';
import { PrismaService } from '../prisma/prisma.service';

export type { AuthenticatedUser, KeycloakTokenPayload };

const VALID_LMS_ROLES = new Set<string>(['SUPER_ADMIN', 'MANAGER', 'AUTHOR', 'STUDENT']);

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 10,
                jwksUri: keycloakConfig.jwksUri,
            }),
            issuer: keycloakConfig.issuer,
            algorithms: ['RS256'],
        });
    }

    async validate(payload: KeycloakTokenPayload): Promise<AuthenticatedUser> {
        if (!payload || !payload.sub) {
            throw new UnauthorizedException('Invalid token payload');
        }

        const realmRoles = payload.realm_access?.roles || [];
        const clientRoles = payload.resource_access?.[keycloakConfig.clientId]?.roles || [];
        const allTokenRoles = Array.from(new Set([...realmRoles, ...clientRoles]));

        // Filter and map valid LMS roles from token
        const matchedRoles: Role[] = allTokenRoles
            .map((r) => {
                const upper = r.toUpperCase();
                if (upper === 'ADMIN') return Role.SUPER_ADMIN;
                if (VALID_LMS_ROLES.has(upper)) return upper as Role;
                return null;
            })
            .filter((r): r is Role => r !== null);

        const email = payload.email || `${payload.sub}@placeholder.virtua`;
        const username = payload.preferred_username || payload.sub;
        const firstName = payload.given_name || null;
        const lastName = payload.family_name || null;
        const displayName = payload.name || `${firstName || ''} ${lastName || ''}`.trim() || username;

        // JIT (Just-In-Time) user synchronization with Prisma
        let dbUser = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!dbUser) {
            // Check if user exists by email (link external accounts)
            dbUser = await this.prisma.user.findUnique({
                where: { email },
            });

            if (dbUser) {
                // Update existing record with Keycloak sub
                dbUser = await this.prisma.user.update({
                    where: { email },
                    data: {
                        id: payload.sub,
                        username: username || dbUser.username,
                        firstName: firstName || dbUser.firstName,
                        lastName: lastName || dbUser.lastName,
                        lastLoginAt: new Date(),
                    },
                });
            } else {
                // Create newly discovered user
                const initialRoles = matchedRoles.length > 0 ? matchedRoles : [Role.STUDENT];
                dbUser = await this.prisma.user.create({
                    data: {
                        id: payload.sub,
                        email,
                        username,
                        firstName,
                        lastName,
                        roles: initialRoles,
                        isActive: true,
                        lastLoginAt: new Date(),
                    },
                });
            }
        } else {
            // Update last login
            await this.prisma.user.update({
                where: { id: payload.sub },
                data: {
                    lastLoginAt: new Date(),
                    ...(firstName && !dbUser.firstName ? { firstName } : {}),
                    ...(lastName && !dbUser.lastName ? { lastName } : {}),
                },
            });
        }

        // Account status check (Acceptance requirement: Activate/deactivate user)
        if (!dbUser.isActive) {
            throw new UnauthorizedException('User account has been deactivated. Please contact an administrator.');
        }

        // Keycloak seeds roles on first registration. Thereafter LMS role changes
        // are authoritative, including revocation; stale token grants must not win.
        const combinedRoles = dbUser.roles as UserRole[];

        return {
            id: dbUser.id,
            username: dbUser.username || username,
            email: dbUser.email,
            name: [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') || displayName,
            roles: combinedRoles,
            isActive: dbUser.isActive,
            rawPayload: payload,
        };
    }
}
