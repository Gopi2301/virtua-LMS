import { apiClient } from './apiClient';
import type { LMSUser, UserRole, UsersResponse, GetUsersParams } from '@virtua-lms/types';

export type { UsersResponse, GetUsersParams };

export const adminUsersService = {
  getUsers: (params: GetUsersParams = {}): Promise<UsersResponse> => {
    return apiClient.get<UsersResponse>('/admin/users', {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        search: params.search,
        role: params.role,
        isActive: params.isActive,
      },
    });
  },

  updateStatus: (userId: string, isActive: boolean): Promise<LMSUser> => {
    return apiClient.patch<LMSUser>(`/admin/users/${userId}/status`, { isActive });
  },

  updateRoles: (userId: string, roles: UserRole[]): Promise<LMSUser> => {
    return apiClient.patch<LMSUser>(`/admin/users/${userId}/roles`, { roles });
  },
};
