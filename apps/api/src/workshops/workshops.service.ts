import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkshopStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateSlug } from '@virtua-lms/utils';
import {
  CreateWorkshopDto,
  QueryWorkshopDto,
  UpdateWorkshopDto,
} from './dto';

@Injectable()
export class WorkshopsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly workshopInclude = {
    workshop: {
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        WorkshopSession: {
          orderBy: { position: 'asc' as const },
          include: {
            sessions: true,
          },
        },
      },
    },
  };

  /**
   * Helper to resolve workshop product by workshop.id, product.id, or slug
   */
  private async resolveWorkshop(idOrSlug: string) {
    return this.prisma.product.findFirst({
      where: {
        type: 'WORKSHOP',
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
          { workshop: { id: idOrSlug } },
        ],
      },
      include: this.workshopInclude,
    });
  }

  /**
   * Create a new workshop product and scheduling record
   */
  async create(dto: CreateWorkshopDto, userId: string) {
    const slug = generateSlug(dto.title);

    const existing = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('A product with this title already exists');
    }

    const isFree = dto.isFree ?? (dto.price && dto.price > 0 ? false : true);

    return this.prisma.product.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        thumbnail: dto.thumbnail,
        type: 'WORKSHOP',
        status: 'DRAFT',
        createdById: userId,
        updatedById: userId,
        workshop: {
          create: {
            authorId: userId,
            startTime: dto.startTime,
            endTime: dto.endTime,
            meetingUrl: dto.meetingUrl,
            recordingUrl: dto.recordingUrl,
            price: dto.price ?? 0.0,
            isFree,
            maxAttendees: dto.maxAttendees,
            status: dto.status ?? WorkshopStatus.SCHEDULED,
          },
        },
      },
      include: this.workshopInclude,
    });
  }

  /**
   * List workshops with pagination and filters
   */
  async findAll(query: QueryWorkshopDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, query.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      type: 'WORKSHOP',
    };

    if (query.productStatus) {
      where.status = query.productStatus;
    }

    if (query.authorId || query.status || query.isFree !== undefined) {
      where.workshop = {
        ...(query.authorId && { authorId: query.authorId }),
        ...(query.status && { status: query.status }),
        ...(query.isFree !== undefined && { isFree: query.isFree }),
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { shortDescription: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [workshops, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.workshopInclude,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: workshops,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single workshop by ID or slug
   */
  async findOne(idOrSlug: string) {
    const workshop = await this.resolveWorkshop(idOrSlug);

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    return workshop;
  }

  /**
   * Update workshop details and schedule
   */
  async update(id: string, dto: UpdateWorkshopDto, userId: string) {
    const product = await this.resolveWorkshop(id);

    if (!product || !product.workshop) {
      throw new NotFoundException('Workshop not found');
    }

    if (product.workshop.authorId !== userId) {
      throw new ForbiddenException('You can only update your own workshops');
    }

    return this.prisma.product.update({
      where: { id: product.id },
      data: {
        title: dto.title,
        description: dto.description,
        shortDescription: dto.shortDescription,
        thumbnail: dto.thumbnail,
        status: dto.productStatus,
        updatedById: userId,
        workshop: {
          update: {
            startTime: dto.startTime,
            endTime: dto.endTime,
            meetingUrl: dto.meetingUrl,
            recordingUrl: dto.recordingUrl,
            price: dto.price !== undefined ? dto.price : undefined,
            isFree: dto.isFree !== undefined ? dto.isFree : undefined,
            maxAttendees: dto.maxAttendees,
            status: dto.status,
          },
        },
      },
      include: this.workshopInclude,
    });
  }

  /**
   * Delete a workshop
   */
  async remove(id: string, userId: string) {
    const product = await this.resolveWorkshop(id);

    if (!product || !product.workshop) {
      throw new NotFoundException('Workshop not found');
    }

    if (product.workshop.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own workshops');
    }

    await this.prisma.product.delete({
      where: { id: product.id },
    });

    return { message: 'Workshop deleted successfully', id: product.id };
  }

  /**
   * Update live status of the workshop (SCHEDULED, LIVE, COMPLETED, CANCELLED)
   */
  async updateStatus(id: string, status: WorkshopStatus, userId: string) {
    const product = await this.resolveWorkshop(id);

    if (!product || !product.workshop) {
      throw new NotFoundException('Workshop not found');
    }

    if (product.workshop.authorId !== userId) {
      throw new ForbiddenException('You can only update your own workshops');
    }

    return this.prisma.workshop.update({
      where: { id: product.workshop.id },
      data: { status },
      include: {
        product: true,
      },
    });
  }
}
