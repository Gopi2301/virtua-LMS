import { contentClient } from './apiClient';

export interface QuestionOption {
  id: string;
  text: string;
  position: number;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE';
  position: number;
  explanation?: string | null;
  options: QuestionOption[];
}

export interface SessionQuestionnaire {
  id: string;
  title: string;
  description?: string | null;
  questions: QuizQuestion[];
}

export interface SessionResource {
  id: string;
  title: string;
  type: 'PDF' | 'ZIP' | 'EXTERNAL_LINK' | 'GITHUB';
  url?: string | null;
  storageKey?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  position: number;
}

export interface PlayerSessionData {
  id: string;
  sectionId: string;
  title: string;
  description?: string | null;
  position: number;
  status: 'VIDEO' | 'TEXT' | 'LIVE';
  isPreview: boolean;
  isFree: boolean;
  watchTime: number;
  completed: boolean;
  completedAt?: string | null;
  video?: {
    id: string;
    vimeoVideoId: string;
    duration?: number | null;
    thumbnail?: string | null;
    status: string;
  } | null;
  resources: SessionResource[];
  questionnaire?: SessionQuestionnaire | null;
  section?: {
    id: string;
    title: string;
  };
}

export interface PlayerCurriculumSession {
  id: string;
  title: string;
  position: number;
  status: 'VIDEO' | 'TEXT' | 'LIVE';
  description?: string | null;
  isPreview: boolean;
  isFree: boolean;
  video?: { duration?: number | null };
  _count?: { resources?: number };
  watchTime: number;
  completed: boolean;
  completedAt?: string | null;
}

export interface PlayerCurriculumSection {
  id: string;
  title: string;
  sessions: PlayerCurriculumSession[];
}

export interface LearningProgressResponse {
  enrollmentId: string;
  productId: string;
  productTitle?: string;
  productSlug?: string;
  thumbnail?: string | null;
  author?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  };
  percentComplete: number;
  completedSessions: number;
  totalSessions: number;
  certificate?: {
    id: string;
    code: string;
    issuedAt: string;
  } | null;
  nextSessionId?: string | null;
  sections: PlayerCurriculumSection[];
}

export const learningService = {
  async getEnrollmentProgress(enrollmentId: string): Promise<LearningProgressResponse> {
    return contentClient.get<LearningProgressResponse>(`/enrollments/${enrollmentId}/progress`);
  },

  async getEnrollmentSession(enrollmentId: string, sessionId: string): Promise<PlayerSessionData> {
    return contentClient.get<PlayerSessionData>(`/enrollments/${enrollmentId}/progress/sessions/${sessionId}`);
  },

  async updateProgress(
    enrollmentId: string,
    dto: { sessionId: string; watchTime?: number; completed?: boolean }
  ) {
    return contentClient.post(`/enrollments/${enrollmentId}/progress`, dto);
  },

  async claimCertificate(enrollmentId: string): Promise<{ id: string; code: string; issuedAt: string }> {
    return contentClient.post<{ id: string; code: string; issuedAt: string }>(
      `/enrollments/${enrollmentId}/certificate`
    );
  },
};
