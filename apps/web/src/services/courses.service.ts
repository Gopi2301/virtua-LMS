import { contentClient } from './apiClient';

export interface AuthorInfo {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
}

export interface SessionSummary {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  status: 'VIDEO' | 'TEXT' | 'LIVE';
  isPreview: boolean;
  isFree: boolean;
  video?: {
    duration?: number | null;
  } | null;
  _count?: {
    resources?: number;
  };
}

export interface SectionSummary {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  sessions: SessionSummary[];
}

export interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  thumbnail?: string | null;
  type: string;
  status: string;
  course: {
    id: string;
    level: string;
    language: string;
    author: AuthorInfo;
    category?: CategoryInfo | null;
    sections: SectionSummary[];
  };
}

export interface CatalogResponse {
  courses: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    shortDescription?: string | null;
    thumbnail?: string | null;
    type: string;
    status: string;
    course: {
      id: string;
      level: string;
      author: AuthorInfo;
      category?: CategoryInfo | null;
      _count?: {
        sections: number;
      };
    };
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SessionPreviewData {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  status: 'VIDEO' | 'TEXT' | 'LIVE';
  isPreview: boolean;
  isFree: boolean;
  video?: {
    id: string;
    vimeoVideoId: string;
    duration?: number | null;
    status: string;
  } | null;
  resources?: {
    id: string;
    title: string;
    type: string;
    url?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
  }[];
}

export const coursesService = {
  async getCatalog(params?: { search?: string; categoryId?: string; page?: number; limit?: number }): Promise<CatalogResponse> {
    return contentClient.get<CatalogResponse>('/courses/query', { params });
  },

  async getCourse(idOrSlug: string): Promise<CourseDetail> {
    return contentClient.get<CourseDetail>(`/courses/${idOrSlug}`);
  },

  async getCoursePreview(courseIdOrSlug: string, sessionId: string): Promise<SessionPreviewData> {
    return contentClient.get<SessionPreviewData>(`/courses/${courseIdOrSlug}/preview/${sessionId}`);
  },

  async getCategories(): Promise<CategoryInfo[]> {
    return contentClient.get<CategoryInfo[]>('/categories');
  },
};
