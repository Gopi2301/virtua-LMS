import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VideoStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { createDummyVimeoVideo } from 'src/utils/vimeo.helper';
import { AttachVideoDto, UpdateVideoDto } from './dto';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to verify session existence and retrieve course author
   */
  private async resolveSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        section: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  /**
   * Attach a video to a session
   */
  async attach(dto: AttachVideoDto, userId: string) {
    const session = await this.resolveSession(dto.sessionId);

    if (session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only attach videos to sessions in your own courses');
    }

    const existingVideo = await this.prisma.video.findUnique({
      where: { sessionId: dto.sessionId },
    });

    if (existingVideo) {
      throw new ConflictException('A video is already attached to this session. Please update or detach it first.');
    }

    let vimeoVideoId = dto.vimeoVideoId;
    let duration = dto.duration;
    let thumbnail = dto.thumbnail;
    let status = dto.status ?? VideoStatus.READY;
    let title = dto.title ?? session.title;
    let description = dto.description ?? session.description ?? undefined;

    if (vimeoVideoId) {
      const duplicateVimeo = await this.prisma.video.findUnique({
        where: { vimeoVideoId },
      });

      if (duplicateVimeo) {
        throw new ConflictException(`A video with Vimeo ID ${vimeoVideoId} already exists`);
      }

      duration = duration ?? 0;
      thumbnail = thumbnail ?? `https://vumbnail.com/${vimeoVideoId}.jpg`;
    } else {
      // Generate a mock/dummy Vimeo video for testing/development
      const dummy = await createDummyVimeoVideo({
        title,
        description,
        duration,
        sessionId: dto.sessionId,
      });

      vimeoVideoId = dummy.vimeoVideoId;
      duration = dummy.duration;
      thumbnail = dummy.thumbnail;
      status = dummy.status;
      title = dummy.title ?? title;
      description = dummy.description ?? description;
    }

    return this.prisma.video.create({
      data: {
        sessionId: dto.sessionId,
        vimeoVideoId,
        duration,
        thumbnail,
        status,
        title,
        description,
      },
    });
  }

  /**
   * Find video attached to a session
   */
  async findBySessionId(sessionId: string) {
    await this.resolveSession(sessionId);

    const video = await this.prisma.video.findUnique({
      where: { sessionId },
    });

    if (!video) {
      throw new NotFoundException('No video found for this session');
    }

    return video;
  }

  /**
   * Update video details
   */
  async update(sessionId: string, dto: UpdateVideoDto, userId: string) {
    const session = await this.resolveSession(sessionId);

    if (session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only update videos in your own courses');
    }

    const video = await this.prisma.video.findUnique({
      where: { sessionId },
    });

    if (!video) {
      throw new NotFoundException('No video found for this session');
    }

    if (dto.vimeoVideoId && dto.vimeoVideoId !== video.vimeoVideoId) {
      const duplicate = await this.prisma.video.findUnique({
        where: { vimeoVideoId: dto.vimeoVideoId },
      });

      if (duplicate) {
        throw new ConflictException(`A video with Vimeo ID ${dto.vimeoVideoId} already exists`);
      }
    }

    return this.prisma.video.update({
      where: { sessionId },
      data: {
        title: dto.title,
        description: dto.description,
        vimeoVideoId: dto.vimeoVideoId,
        duration: dto.duration,
        thumbnail: dto.thumbnail,
        status: dto.status,
      },
    });
  }

  /**
   * Detach/delete video from a session
   */
  async remove(sessionId: string, userId: string) {
    const session = await this.resolveSession(sessionId);

    if (session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only detach videos from your own courses');
    }

    const video = await this.prisma.video.findUnique({
      where: { sessionId },
    });

    if (!video) {
      throw new NotFoundException('No video found for this session');
    }

    await this.prisma.video.delete({
      where: { sessionId },
    });

    return { message: 'Video detached successfully', sessionId };
  }
}
