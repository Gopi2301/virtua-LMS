import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateSectionDto,
  ReorderSectionsDto,
  UpdateSectionDto,
} from './dto';

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to resolve a Course by either course.id or product.id
   */
  private async resolveCourse(courseOrProductId: string) {
    return this.prisma.course.findFirst({
      where: {
        OR: [
          { id: courseOrProductId },
          { productId: courseOrProductId },
        ],
      },
      include: {
        product: true,
      },
    });
  }

  /**
   * Create a new section in a course
   */
  async create(dto: CreateSectionDto, userId: string) {
    const course = await this.resolveCourse(dto.courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.authorId !== userId) {
      throw new ForbiddenException('You can only add sections to your own courses');
    }

    let targetPosition = dto.position;

    if (targetPosition === undefined || targetPosition === null) {
      const highestSection = await this.prisma.section.findFirst({
        where: { courseId: course.id },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      targetPosition = highestSection ? highestSection.position + 1 : 0;
    } else {
      // Check if position already exists in this course
      const existingAtPosition = await this.prisma.section.findUnique({
        where: {
          courseId_position: {
            courseId: course.id,
            position: targetPosition,
          },
        },
      });

      if (existingAtPosition) {
        // Shift existing sections at or after targetPosition to make space
        await this.prisma.$transaction(async (tx) => {
          const sectionsToShift = await tx.section.findMany({
            where: {
              courseId: course.id,
              position: { gte: targetPosition },
            },
            orderBy: { position: 'desc' },
          });

          for (const s of sectionsToShift) {
            await tx.section.update({
              where: { id: s.id },
              data: { position: s.position + 1 },
            });
          }
        });
      }
    }

    return this.prisma.section.create({
      data: {
        courseId: course.id,
        title: dto.title,
        description: dto.description,
        position: targetPosition,
      },
      include: {
        sessions: {
          orderBy: { position: 'asc' },
          include: {
            video: true,
            resources: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
  }

  /**
   * Find all sections belonging to a course
   */
  async findAllByCourse(courseId: string) {
    const course = await this.resolveCourse(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.section.findMany({
      where: { courseId: course.id },
      orderBy: { position: 'asc' },
      include: {
        sessions: {
          orderBy: { position: 'asc' },
          include: {
            video: true,
            resources: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
  }

  /**
   * Find a single section by its ID
   */
  async findOne(id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            product: true,
          },
        },
        sessions: {
          orderBy: { position: 'asc' },
          include: {
            video: true,
            resources: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    return section;
  }

  /**
   * Update section details or position
   */
  async update(id: string, dto: UpdateSectionDto, userId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (section.course.authorId !== userId) {
      throw new ForbiddenException('You can only update sections in your own courses');
    }

    // If changing position
    if (dto.position !== undefined && dto.position !== section.position) {
      const targetPos = dto.position;
      const courseId = section.courseId;

      await this.prisma.$transaction(async (tx) => {
        // Temporarily move the section out of range to prevent unique constraint conflict
        await tx.section.update({
          where: { id },
          data: { position: -1 },
        });

        if (targetPos > section.position) {
          // Shift intermediate sections down: [oldPos + 1 .. targetPos] -> pos - 1
          const toShift = await tx.section.findMany({
            where: {
              courseId,
              position: {
                gt: section.position,
                lte: targetPos,
              },
            },
            orderBy: { position: 'asc' },
          });

          for (const s of toShift) {
            await tx.section.update({
              where: { id: s.id },
              data: { position: s.position - 1 },
            });
          }
        } else {
          // Shift intermediate sections up: [targetPos .. oldPos - 1] -> pos + 1
          const toShift = await tx.section.findMany({
            where: {
              courseId,
              position: {
                gte: targetPos,
                lt: section.position,
              },
            },
            orderBy: { position: 'desc' },
          });

          for (const s of toShift) {
            await tx.section.update({
              where: { id: s.id },
              data: { position: s.position + 1 },
            });
          }
        }

        await tx.section.update({
          where: { id },
          data: {
            title: dto.title ?? section.title,
            description: dto.description !== undefined ? dto.description : section.description,
            position: targetPos,
          },
        });
      });

      return this.findOne(id);
    }

    return this.prisma.section.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
      },
      include: {
        sessions: {
          orderBy: { position: 'asc' },
          include: {
            video: true,
            resources: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
  }

  /**
   * Delete a section
   */
  async remove(id: string, userId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (section.course.authorId !== userId) {
      throw new ForbiddenException('You can only delete sections in your own courses');
    }

    const courseId = section.courseId;
    const deletedPosition = section.position;

    await this.prisma.$transaction(async (tx) => {
      await tx.section.delete({
        where: { id },
      });

      // Shift subsequent sections down so positions stay contiguous
      const subsequentSections = await tx.section.findMany({
        where: {
          courseId,
          position: { gt: deletedPosition },
        },
        orderBy: { position: 'asc' },
      });

      for (const s of subsequentSections) {
        await tx.section.update({
          where: { id: s.id },
          data: { position: s.position - 1 },
        });
      }
    });

    return { message: 'Section deleted successfully', id };
  }

  /**
   * Reorder all sections for a course in one batch
   */
  async reorder(dto: ReorderSectionsDto, userId: string) {
    const course = await this.resolveCourse(dto.courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.authorId !== userId) {
      throw new ForbiddenException('You can only reorder sections in your own courses');
    }

    const existingSections = await this.prisma.section.findMany({
      where: { courseId: course.id },
    });

    const existingIds = new Set(existingSections.map((s) => s.id));

    for (const id of dto.sectionIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Section ${id} does not belong to course ${dto.courseId}`);
      }
    }

    if (dto.sectionIds.length !== existingSections.length) {
      throw new BadRequestException('All section IDs for the course must be included in reorder request');
    }

    // Atomic reorder using transaction and temporary offset to avoid unique constraint violations
    await this.prisma.$transaction(async (tx) => {
      // 1. Move to negative positions first
      for (let i = 0; i < dto.sectionIds.length; i++) {
        await tx.section.update({
          where: { id: dto.sectionIds[i] },
          data: { position: -(i + 1) },
        });
      }

      // 2. Assign target 0-indexed positions
      for (let i = 0; i < dto.sectionIds.length; i++) {
        await tx.section.update({
          where: { id: dto.sectionIds[i] },
          data: { position: i },
        });
      }
    });

    return this.findAllByCourse(course.id);
  }
}
