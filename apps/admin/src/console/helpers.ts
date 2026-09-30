import type { Status } from './types';
import { ENV } from '../config/env';

export const courseStatuses: Status[] = ['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'ON_AIR', 'ARCHIVED'];
export const navigate = (path: string) => { window.location.hash = path; };
export const statusLabel = (status: string) => status.toLowerCase().replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
export function safeUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('/uploads/')) {
    const origin = ENV.API_URL.replace(/\/api\/?$/, '');
    return `${origin}${url}`;
  }
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}
