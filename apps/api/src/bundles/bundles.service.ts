import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateSlug } from '@virtua-lms/utils';
import {
  CreateBundleDto,
  QueryBundleDto,
  UpdateBundleDto,
} from './dto';

@Injectable()
export class BundlesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly bundleInclude = {
    bundle: {
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
        BundleCourse: {
          include: {
            course: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    },
  };

  /**
   * Helper to resolve Course by course.id or product.id
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
   * Helper to resolve Bundle product by bundle.id, product.id, or slug
   */
  private async resolveBundle(idOrSlug: string) {
    return this.prisma.product.findFirst({
      where: {
        type: 'BUNDLE',
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
          { bundle: { id: idOrSlug } },
        ],
      },
      include: this.bundleInclude,
    });
  }

  /**
   * Create a new course bundle
   */
  async create(dto: CreateBundleDto, userId: string) {
    const slug = generateSlug(dto.title);

    const existingSlug = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException('A product with this title already exists');
    }

    let resolvedCourseIds: string[] = [];
    if (dto.courseIds && dto.courseIds.length > 0) {
      for (const id of dto.courseIds) {
        const course = await this.resolveCourse(id);
        if (!course) {
          throw new NotFoundException(`Course with ID ${id} not found`);
        }
        resolvedCourseIds.push(course.id);
      }
      resolvedCourseIds = Array.from(new Set(resolvedCourseIds));
    }

    return this.prisma.product.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        thumbnail: dto.thumbnail,
        type: 'BUNDLE',
        status: 'DRAFT',
        createdById: userId,
        updatedById: userId,
        bundle: {
          create: {
            authorId: userId,
            BundleCourse: resolvedCourseIds.length > 0
              ? {
                  create: resolvedCourseIds.map((cId) => ({
                    courseId: cId,
                  })),
                }
              : undefined,
          },
        },
      },
      include: this.bundleInclude,
    });
  }

  /**
   * List bundles with pagination and filters
   */
  async findAll(query: QueryBundleDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, query.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      type: 'BUNDLE',
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.authorId) {
      where.bundle = {
        authorId: query.authorId,
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { shortDescription: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [bundles, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.bundleInclude,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: bundles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single bundle by ID or slug
   */
  async findOne(idOrSlug: string) {
    const bundle = await this.resolveBundle(idOrSlug);

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    return bundle;
  }

  /**
   * Update bundle metadata
   */
  async update(id: string, dto: UpdateBundleDto, userId: string) {
    const product = await this.resolveBundle(id);

    if (!product || !product.bundle) {
      throw new NotFoundException('Bundle not found');
    }

    if (product.bundle.authorId !== userId) {
      throw new ForbiddenException('You can only update your own bundles');
    }

    return this.prisma.product.update({
      where: { id: product.id },
      data: {
        title: dto.title,
        description: dto.description,
        shortDescription: dto.shortDescription,
        thumbnail: dto.thumbnail,
        status: dto.status,
        updatedById: userId,
      },
      include: this.bundleInclude,
    });
  }

  /**
   * Delete a bundle
   */
  async remove(id: string, userId: string) {
    const product = await this.resolveBundle(id);

    if (!product || !product.bundle) {
      throw new NotFoundException('Bundle not found');
    }

    if (product.bundle.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own bundles');
    }

    await this.prisma.product.delete({
      where: { id: product.id },
    });

    return { message: 'Bundle deleted successfully', id: product.id };
  }

  /**
   * Add a course to a bundle
   */
  async addCourse(bundleId: string, courseId: string, userId: string) {
    const product = await this.resolveBundle(bundleId);

    if (!product || !product.bundle) {
      throw new NotFoundException('Bundle not found');
    }

    if (product.bundle.authorId !== userId) {
      throw new ForbiddenException('You can only manage courses in your own bundles');
    }

    const course = await this.resolveCourse(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existingLink = await this.prisma.bundleCourse.findFirst({
      where: {
        bundleId: product.bundle.id,
        courseId: course.id,
      },
    });

    if (existingLink) {
      throw new ConflictException('Course is already included in this bundle');
    }

    await this.prisma.bundleCourse.create({
      data: {
        bundleId: product.bundle.id,
        courseId: course.id,
      },
    });

    return this.findOne(product.id);
  }

  /**
   * Remove a course from a bundle
   */
  async removeCourse(bundleId: string, courseId: string, userId: string) {
    const product = await this.resolveBundle(bundleId);

    if (!product || !product.bundle) {
      throw new NotFoundException('Bundle not found');
    }

    if (product.bundle.authorId !== userId) {
      throw new ForbiddenException('You can only manage courses in your own bundles');
    }

    const course = await this.resolveCourse(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existingLink = await this.prisma.bundleCourse.findFirst({
      where: {
        bundleId: product.bundle.id,
        courseId: course.id,
      },
    });

    if (!existingLink) {
      throw new NotFoundException('Course is not in this bundle');
    }

    await this.prisma.bundleCourse.delete({
      where: { id: existingLink.id },
    });

    return { message: 'Course removed from bundle successfully', courseId: course.id };
  }
}
