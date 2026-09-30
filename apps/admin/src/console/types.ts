export type Status = 'DRAFT' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'ON_AIR' | 'OFF_AIR' | 'ARCHIVED';
export interface Person { id: string; firstName?: string; lastName?: string; email: string }
export interface Option { id: string; text: string; isCorrect: boolean }
export interface Question { id: string; text: string; type: string; explanation?: string; options: Option[] }
export interface Questionnaire { id: string; title: string; passingScore: number; maxAttempts: number; questions: Question[] }
export interface Session { id: string; title: string; description?: string; status: 'VIDEO' | 'TEXT' | 'LIVE'; position: number; isPreview: boolean; isFree: boolean; video?: { vimeoVideoId: string; duration?: number; status: string }; resources: { id: string; title: string; type: string; url?: string }[]; questionnaire?: Questionnaire }
export interface Section { id: string; title: string; description?: string; position: number; sessions: Session[] }
export interface Course { id: string; title: string; shortDescription?: string; description?: string; thumbnail?: string; status: Status; updatedAt: string; course: { id: string; authorId: string; author?: Person; level: string; language?: string; categoryId?: string | null; category?: { name: string }; sections?: Section[]; _count?: { sections: number } } }
export interface Submission { id: string; status: string; submittedAt: string; reviewedAt?: string; reviewComment?: string; submittedBy?: Person; reviewedBy?: Person; product?: Course }
export interface CoursePage { courses: Course[]; total: number; totalPages: number; page: number }
export interface ReviewPage { submissions: Submission[]; total: number; totalPages: number; page: number }
export interface CategoryItem { id: string; name: string; slug: string; description?: string | null; createdAt: string; updatedAt: string; _count?: { courses: number } }
export interface CategoryPage { categories: CategoryItem[]; total: number; totalPages: number; page: number; limit: number }
