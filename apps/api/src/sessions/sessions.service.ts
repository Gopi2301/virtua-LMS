import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateSessionDto,
  ReorderSessionsDto,
  UpdateSessionDto,
} from './dto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly sessionInclude = {
    video: true,
    resources: {
      orderBy: { position: 'asc' as const },
    },
    questionnaire: {
      include: {
        questions: {
          orderBy: { position: 'asc' as const },
          include: {
            options: {
              orderBy: { position: 'asc' as const },
            },
          },
        },
      },
    },
  };

  /**
   * Helper to resolve Section with course and author
   */
  private async resolveSection(sectionId: string) {
    return this.prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Create a new session in a section
   */
  async create(dto: CreateSessionDto, userId: string) {
    const section = await this.resolveSection(dto.sectionId);

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (section.course.authorId !== userId) {
      throw new ForbiddenException('You can only add sessions to your own courses');
    }

    let targetPosition = dto.position;

    if (targetPosition === undefined || targetPosition === null) {
      const highestSession = await this.prisma.session.findFirst({
        where: { sectionId: section.id },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      targetPosition = highestSession ? highestSession.position + 1 : 0;
    } else {
      // Check if position already exists in this section
      const existingAtPosition = await this.prisma.session.findUnique({
        where: {
          sectionId_position: {
            sectionId: section.id,
            position: targetPosition,
          },
        },
      });

      if (existingAtPosition) {
        // Shift existing sessions at or after targetPosition to make space
        await this.prisma.$transaction(async (tx) => {
          const sessionsToShift = await tx.session.findMany({
            where: {
              sectionId: section.id,
              position: { gte: targetPosition },
            },
            orderBy: { position: 'desc' },
          });

          for (const s of sessionsToShift) {
            await tx.session.update({
              where: { id: s.id },
              data: { position: s.position + 1 },
            });
          }
        });
      }
    }

    const sessionType = dto.type ?? dto.status ?? SessionType.VIDEO;

    return this.prisma.session.create({
      data: {
        sectionId: section.id,
        title: dto.title,
        description: dto.description,
        position: targetPosition,
        status: sessionType,
        isPreview: dto.isPreview ?? false,
        isFree: dto.isFree ?? false,
      },
      include: this.sessionInclude,
    });
  }

  /**
   * Find all sessions belonging to a section
   */
  async findAllBySection(sectionId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    return this.prisma.session.findMany({
      where: { sectionId: section.id },
      orderBy: { position: 'asc' },
      include: this.sessionInclude,
    });
  }

  /**
   * Find a single session by its ID
   */
  async findOne(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        ...this.sessionInclude,
        section: {
          include: {
            course: {
              include: {
                product: true,
              },
            },
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
   * Update session details or position
   */
  async update(id: string, dto: UpdateSessionDto, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
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

    if (session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only update sessions in your own courses');
    }

    const sessionType = dto.type ?? dto.status ?? undefined;

    // If changing position
    if (dto.position !== undefined && dto.position !== session.position) {
      const targetPos = dto.position;
      const sectionId = session.sectionId;

      await this.prisma.$transaction(async (tx) => {
        // Temporarily move session out of range to prevent unique constraint conflict
        await tx.session.update({
          where: { id },
          data: { position: -1 },
        });

        if (targetPos > session.position) {
          // Shift intermediate sessions down: [oldPos + 1 .. targetPos] -> pos - 1
          const toShift = await tx.session.findMany({
            where: {
              sectionId,
              position: {
                gt: session.position,
                lte: targetPos,
              },
            },
            orderBy: { position: 'asc' },
          });

          for (const s of toShift) {
            await tx.session.update({
              where: { id: s.id },
              data: { position: s.position - 1 },
            });
          }
        } else {
          // Shift intermediate sessions up: [targetPos .. oldPos - 1] -> pos + 1
          const toShift = await tx.session.findMany({
            where: {
              sectionId,
              position: {
                gte: targetPos,
                lt: session.position,
              },
            },
            orderBy: { position: 'desc' },
          });

          for (const s of toShift) {
            await tx.session.update({
              where: { id: s.id },
              data: { position: s.position + 1 },
            });
          }
        }

        await tx.session.update({
          where: { id },
          data: {
            title: dto.title ?? session.title,
            description: dto.description !== undefined ? dto.description : session.description,
            position: targetPos,
            ...(sessionType && { status: sessionType }),
            ...(dto.isPreview !== undefined && { isPreview: dto.isPreview }),
            ...(dto.isFree !== undefined && { isFree: dto.isFree }),
          },
        });
      });

      return this.findOne(id);
    }

    return this.prisma.session.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        ...(sessionType && { status: sessionType }),
        ...(dto.isPreview !== undefined && { isPreview: dto.isPreview }),
        ...(dto.isFree !== undefined && { isFree: dto.isFree }),
      },
      include: this.sessionInclude,
    });
  }

  /**
   * Delete a session and compact remaining positions
   */
  async remove(id: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
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

    if (session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only delete sessions in your own courses');
    }

    const sectionId = session.sectionId;
    const deletedPosition = session.position;

    await this.prisma.$transaction(async (tx) => {
      await tx.session.delete({
        where: { id },
      });

      // Shift subsequent sessions down so positions stay contiguous
      const subsequentSessions = await tx.session.findMany({
        where: {
          sectionId,
          position: { gt: deletedPosition },
        },
        orderBy: { position: 'asc' },
      });

      for (const s of subsequentSessions) {
        await tx.session.update({
          where: { id: s.id },
          data: { position: s.position - 1 },
        });
      }
    });

    return { message: 'Session deleted successfully', id };
  }

  /**
   * Reorder all sessions for a section in one batch
   */
  async reorder(dto: ReorderSessionsDto, userId: string) {
    const section = await this.resolveSection(dto.sectionId);

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (section.course.authorId !== userId) {
      throw new ForbiddenException('You can only reorder sessions in your own courses');
    }

    const existingSessions = await this.prisma.session.findMany({
      where: { sectionId: section.id },
    });

    const existingIds = new Set(existingSessions.map((s) => s.id));

    for (const id of dto.sessionIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Session ${id} does not belong to section ${dto.sectionId}`);
      }
    }

    if (dto.sessionIds.length !== existingSessions.length) {
      throw new BadRequestException('All session IDs for the section must be included in reorder request');
    }

    // Atomic reorder using transaction and temporary negative offset to avoid unique constraint violations
    await this.prisma.$transaction(async (tx) => {
      // 1. Move to negative positions first
      for (let i = 0; i < dto.sessionIds.length; i++) {
        await tx.session.update({
          where: { id: dto.sessionIds[i] },
          data: { position: -(i + 1) },
        });
      }

      // 2. Assign target 0-indexed positions
      for (let i = 0; i < dto.sessionIds.length; i++) {
        await tx.session.update({
          where: { id: dto.sessionIds[i] },
          data: { position: i },
        });
      }
    });

    return this.findAllBySection(section.id);
  }
}
