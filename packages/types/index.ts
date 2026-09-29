export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'AUTHOR' | 'STUDENT';

export interface User {
    id: string;
    email: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    roles: UserRole[];
    isActive: boolean;
    expertisorId?: string | null;
    lastLoginAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AuthUser {
    id: string;
    username: string;
    email: string;
    name: string;
    roles: (UserRole | string)[];
    isActive?: boolean;
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

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
}

export interface UpdateRolesRequest {
    roles: UserRole[];
}

export interface UpdateStatusRequest {
    isActive: boolean;
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export type LMSUser = User;
export type UpdateProfileDto = UpdateProfileRequest;

export interface GetUsersParams {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole | string;
    isActive?: boolean | string;
}

export type UsersResponse = PaginatedResult<User>;

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AuthorApplication {
    id: string;
    userId: string;
    user?: User;
    headline: string;
    bio: string;
    expertise: string[];
    portfolioUrl?: string | null;
    sampleVideo?: string | null;
    status: ApplicationStatus;
    reviewNotes?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAuthorApplicationDto {
    headline: string;
    bio: string;
    expertise: string[];
    portfolioUrl?: string;
    sampleVideo?: string;
}

export interface ReviewAuthorApplicationDto {
    status: 'APPROVED' | 'REJECTED';
    reviewNotes?: string;
}

export type AuthorApplicationsResponse = PaginatedResult<AuthorApplication>;