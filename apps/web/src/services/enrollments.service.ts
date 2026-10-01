import { contentClient } from './apiClient';

export interface EnrollmentRecord {
  id: string;
  userId: string;
  productId: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  enrolledAt: string;
  product: {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    type: string;
    status: string;
  };
  certificate?: {
    id: string;
    code: string;
    issuedAt: string;
  } | null;
}

export interface MyEnrollmentsResponse {
  enrollments: EnrollmentRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const enrollmentsService = {
  async enroll(productId: string): Promise<EnrollmentRecord> {
    return contentClient.post<EnrollmentRecord>('/enrollments', { productId });
  },

  async getMyEnrollments(params?: { status?: string; page?: number; limit?: number }): Promise<MyEnrollmentsResponse> {
    return contentClient.get<MyEnrollmentsResponse>('/enrollments/me', { params });
  },
};
