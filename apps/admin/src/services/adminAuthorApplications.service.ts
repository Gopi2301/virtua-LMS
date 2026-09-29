import { apiClient } from './apiClient';
import type {
  AuthorApplication,
  AuthorApplicationsResponse,
  ReviewAuthorApplicationDto,
  ApplicationStatus,
} from '@virtua-lms/types';

export interface GetAuthorApplicationsParams {
  page?: number;
  limit?: number;
  status?: ApplicationStatus;
}

export const adminAuthorApplicationsService = {
  getApplications: (params: GetAuthorApplicationsParams = {}): Promise<AuthorApplicationsResponse> => {
    return apiClient.get<AuthorApplicationsResponse>('/admin/author-applications', {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        status: params.status,
      },
    });
  },

  review: (id: string, dto: ReviewAuthorApplicationDto): Promise<AuthorApplication> => {
    return apiClient.patch<AuthorApplication>(`/admin/author-applications/${id}/review`, dto);
  },
};
