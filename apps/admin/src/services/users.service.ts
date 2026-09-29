import { apiClient } from './apiClient';
import type { LMSUser, UpdateProfileDto } from '@virtua-lms/types';

export type { LMSUser, UpdateProfileDto };

export const usersService = {
  getProfile: (): Promise<LMSUser> => {
    return apiClient.get<LMSUser>('/users/profile');
  },

  updateProfile: (data: UpdateProfileDto): Promise<LMSUser> => {
    return apiClient.put<LMSUser>('/users/profile', data);
  },
};
