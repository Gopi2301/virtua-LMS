export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'AUTHOR' | 'STUDENT';

export interface User {
    id: string;
    email: string;
    role?: UserRole;
    roles?: (UserRole | string)[];
    username?: string;
    name?: string;
}

export interface AuthUser {
    id: string;
    username: string;
    email: string;
    name: string;
    roles: (UserRole | string)[];
}

export interface AuthContextType {
    initialized: boolean;
    authenticated: boolean;
    user: AuthUser | null;
    token: string | undefined;
    login: () => void;
    logout: () => void;
    apiFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

export interface KeycloakTokenPayload {
    sub: string;
    email?: string;
    preferred_username?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    realm_access?: {
        roles: string[];
    };
    resource_access?: Record<string, { roles: string[] }>;
}

export interface AuthenticatedUser extends AuthUser {
    rawPayload?: KeycloakTokenPayload;
}

export interface AuthConfigResponse {
    url: string;
    realm: string;
    clientId: string;
}

export interface AuthMeResponse {
    status: 'authenticated' | 'unauthenticated';
    user: AuthUser;
}