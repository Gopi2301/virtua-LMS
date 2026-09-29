import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import type { AuthenticatedUser, KeycloakTokenPayload } from '@virtua-lms/types';
import { keycloakConfig } from './keycloak.config';

export type { AuthenticatedUser, KeycloakTokenPayload };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor() {
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

    validate(payload: KeycloakTokenPayload): AuthenticatedUser {
        if (!payload || !payload.sub) {
            throw new UnauthorizedException('Invalid token payload');
        }

        const realmRoles = payload.realm_access?.roles || [];
        const clientRoles = payload.resource_access?.[keycloakConfig.clientId]?.roles || [];
        const allRoles = Array.from(new Set([...realmRoles, ...clientRoles]));

        return {
            id: payload.sub,
            username: payload.preferred_username || payload.sub,
            email: payload.email || '',
            name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || payload.preferred_username || '',
            roles: allRoles,
            rawPayload: payload,
        };
    }
}
