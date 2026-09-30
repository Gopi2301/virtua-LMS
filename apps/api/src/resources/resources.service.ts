import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ResourceType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  deleteAssetFromServer,
  saveAssetToServer,
  UploadedFileInput,
} from 'src/utils/storage.helper';
import {
  CreateResourceDto,
  ReorderResourcesDto,
  UpdateResourceDto,
} from './dto';

@Injectable()
export class ResourcesService {
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
   * Helper to verify resource existence and retrieve course author
   */
  private async resolveResource(resourceId: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        session: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  /**
   * Create a new resource attached to a session
   */
  async create(dto: CreateResourceDto, userId: string, roles?: string[]) {
    const session = await this.resolveSession(dto.sessionId);

    const isPrivileged = roles?.some(r => ['MANAGER', 'SUPER_ADMIN'].includes(r));
    if (session.section.course.authorId !== userId && !isPrivileged) {
      throw new ForbiddenException('You can only add resources to sessions in your own courses');
    }

    if (dto.type === ResourceType.PDF) {
      const isImage =
        (dto.mimeType && dto.mimeType.startsWith('image/')) ||
        (dto.fileName && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(dto.fileName)) ||
        (dto.url && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(dto.url.split('?')[0]));
      if (isImage) {
        throw new BadRequestException('Cannot attach an image as a PDF resource. Please upload a PDF file or change the resource type.');
      }
    } else if (dto.type === ResourceType.ZIP) {
      const isImage =
        (dto.mimeType && dto.mimeType.startsWith('image/')) ||
        (dto.fileName && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(dto.fileName)) ||
        (dto.url && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(dto.url.split('?')[0]));
      if (isImage) {
        throw new BadRequestException('Cannot attach an image as a ZIP resource. Please upload an archive file or change the resource type.');
      }
    }

    let targetPosition = dto.position;

    if (targetPosition === undefined || targetPosition === null) {
      const highestResource = await this.prisma.resource.findFirst({
        where: { sessionId: session.id },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      targetPosition = highestResource ? highestResource.position + 1 : 0;
    } else {
      const existingAtPosition = await this.prisma.resource.findUnique({
        where: {
          sessionId_position: {
            sessionId: session.id,
            position: targetPosition,
          },
        },
      });

      if (existingAtPosition) {
        await this.prisma.$transaction(async (tx) => {
          const toShift = await tx.resource.findMany({
            where: {
              sessionId: session.id,
              position: { gte: targetPosition },
            },
            orderBy: { position: 'desc' },
          });

          for (const r of toShift) {
            await tx.resource.update({
              where: { id: r.id },
              data: { position: r.position + 1 },
            });
          }
        });
      }
    }

    return this.prisma.resource.create({
      data: {
        sessionId: session.id,
        title: dto.title,
        type: dto.type,
        url: dto.url,
        storageKey: dto.storageKey,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        position: targetPosition,
      },
    });
  }

  /**
   * Upload file and attach as resource to session
   */
  async uploadFile(
    sessionId: string,
    file: UploadedFileInput,
    title: string | undefined,
    type: ResourceType,
    userId: string,
    roles?: string[],
  ) {
    const session = await this.resolveSession(sessionId);

    const isPrivileged = roles?.some(r => ['MANAGER', 'SUPER_ADMIN'].includes(r));
    if (session.section.course.authorId !== userId && !isPrivileged) {
      throw new ForbiddenException('You can only upload resources to sessions in your own courses');
    }

    const stored = await saveAssetToServer(file, 'resources');

    return this.create(
      {
        sessionId,
        title: title || file.originalname,
        type,
        url: stored.url,
        storageKey: stored.storageKey,
        fileName: stored.fileName,
        fileSize: stored.fileSize,
        mimeType: stored.mimeType,
      },
      userId,
    );
  }

  /**
   * Find all resources for a session
   */
  async findAllBySession(sessionId: string) {
    await this.resolveSession(sessionId);

    return this.prisma.resource.findMany({
      where: { sessionId },
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Find a single resource by its ID
   */
  async findOne(id: string) {
    return this.resolveResource(id);
  }

  /**
   * Update resource details or position
   */
  async update(id: string, dto: UpdateResourceDto, userId: string, roles?: string[]) {
    const resource = await this.resolveResource(id);

    const isPrivileged = roles?.some(r => ['MANAGER', 'SUPER_ADMIN'].includes(r));
    if (resource.session.section.course.authorId !== userId && !isPrivileged) {
      throw new ForbiddenException('You can only update resources in your own courses');
    }

    if (dto.position !== undefined && dto.position !== resource.position) {
      const targetPos = dto.position;
      const sessionId = resource.sessionId;

      await this.prisma.$transaction(async (tx) => {
        await tx.resource.update({
          where: { id },
          data: { position: -1 },
        });

        if (targetPos > resource.position) {
          const toShift = await tx.resource.findMany({
            where: {
              sessionId,
              position: {
                gt: resource.position,
                lte: targetPos,
              },
            },
            orderBy: { position: 'asc' },
          });

          for (const r of toShift) {
            await tx.resource.update({
              where: { id: r.id },
              data: { position: r.position - 1 },
            });
          }
        } else {
          const toShift = await tx.resource.findMany({
            where: {
              sessionId,
              position: {
                gte: targetPos,
                lt: resource.position,
              },
            },
            orderBy: { position: 'desc' },
          });

          for (const r of toShift) {
            await tx.resource.update({
              where: { id: r.id },
              data: { position: r.position + 1 },
            });
          }
        }

        await tx.resource.update({
          where: { id },
          data: {
            title: dto.title ?? resource.title,
            type: dto.type ?? resource.type,
            url: dto.url !== undefined ? dto.url : resource.url,
            storageKey: dto.storageKey !== undefined ? dto.storageKey : resource.storageKey,
            fileName: dto.fileName !== undefined ? dto.fileName : resource.fileName,
            fileSize: dto.fileSize !== undefined ? dto.fileSize : resource.fileSize,
            mimeType: dto.mimeType !== undefined ? dto.mimeType : resource.mimeType,
            position: targetPos,
          },
        });
      });

      return this.findOne(id);
    }

    return this.prisma.resource.update({
      where: { id },
      data: {
        title: dto.title,
        type: dto.type,
        url: dto.url,
        storageKey: dto.storageKey,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
      },
    });
  }

  /**
   * Delete a resource and remove any stored file
   */
  async remove(id: string, userId: string, roles?: string[]) {
    const resource = await this.resolveResource(id);

    const isPrivileged = roles?.some(r => ['MANAGER', 'SUPER_ADMIN'].includes(r));
    if (resource.session.section.course.authorId !== userId && !isPrivileged) {
      throw new ForbiddenException('You can only delete resources in your own courses');
    }

    const sessionId = resource.sessionId;
    const deletedPosition = resource.position;

    if (resource.storageKey) {
      await deleteAssetFromServer(resource.storageKey);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.resource.delete({
        where: { id },
      });

      const subsequent = await tx.resource.findMany({
        where: {
          sessionId,
          position: { gt: deletedPosition },
        },
        orderBy: { position: 'asc' },
      });

      for (const r of subsequent) {
        await tx.resource.update({
          where: { id: r.id },
          data: { position: r.position - 1 },
        });
      }
    });

    return { message: 'Resource deleted successfully', id };
  }

  /**
   * Reorder all resources for a session in one batch
   */
  async reorder(dto: ReorderResourcesDto, userId: string) {
    const session = await this.resolveSession(dto.sessionId);

    if (session.section.course.authorId !== userId) {
      throw new ForbiddenException('You can only reorder resources in your own courses');
    }

    const existingResources = await this.prisma.resource.findMany({
      where: { sessionId: session.id },
    });

    const existingIds = new Set(existingResources.map((r) => r.id));

    for (const id of dto.resourceIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Resource ${id} does not belong to session ${dto.sessionId}`);
      }
    }

    if (dto.resourceIds.length !== existingResources.length) {
      throw new BadRequestException('All resource IDs for the session must be included in reorder request');
    }

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < dto.resourceIds.length; i++) {
        await tx.resource.update({
          where: { id: dto.resourceIds[i] },
          data: { position: -(i + 1) },
        });
      }

      for (let i = 0; i < dto.resourceIds.length; i++) {
        await tx.resource.update({
          where: { id: dto.resourceIds[i] },
          data: { position: i },
        });
      }
    });

    return this.findAllBySession(session.id);
  }
}
