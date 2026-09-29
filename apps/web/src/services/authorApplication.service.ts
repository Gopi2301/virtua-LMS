import { apiClient } from './apiClient';
import type { AuthorApplication, CreateAuthorApplicationDto } from '@virtua-lms/types';

export const authorApplicationService = {
  apply: (dto: CreateAuthorApplicationDto): Promise<AuthorApplication> => {
    return apiClient.post<AuthorApplication>('/authors/apply', dto);
  },

  getMyApplication: (): Promise<AuthorApplication | null> => {
    return apiClient.get<AuthorApplication | null>('/authors/my-application');
  },
};
