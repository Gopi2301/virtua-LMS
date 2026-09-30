import { VideoStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface DummyVimeoVideoInput {
  title?: string;
  description?: string;
  duration?: number;
  sessionId?: string;
}

export interface DummyVimeoVideoResult {
  vimeoVideoId: string;
  duration: number;
  thumbnail: string;
  status: VideoStatus;
  title?: string;
  description?: string;
}

/**
 * Dummy Vimeo video helper function.
 * 
 * NOTE: This is a placeholder dummy function for Vimeo video processing.
 * Real Vimeo API client and upload workflow will be connected tomorrow.
 */
export async function createDummyVimeoVideo(
  input: DummyVimeoVideoInput,
): Promise<DummyVimeoVideoResult> {
  const dummyNumericId = Math.floor(100000000 + Math.random() * 900000000).toString();

  return {
    vimeoVideoId: dummyNumericId,
    duration: input.duration ?? 300, // 5 minutes default
    thumbnail: `https://vumbnail.com/${dummyNumericId}.jpg`,
    status: VideoStatus.READY,
    title: input.title || `Vimeo Video ${dummyNumericId}`,
    description: input.description,
  };
}

/**
 * Dummy function to fetch Vimeo video status/metadata.
 */
export async function getDummyVimeoVideo(
  vimeoVideoId: string,
): Promise<DummyVimeoVideoResult> {
  return {
    vimeoVideoId,
    duration: 300,
    thumbnail: `https://vumbnail.com/${vimeoVideoId}.jpg`,
    status: VideoStatus.READY,
    title: `Vimeo Video ${vimeoVideoId}`,
  };
}
