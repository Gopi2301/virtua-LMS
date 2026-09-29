import { ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { generateSlug } from 'src/utils/slugify';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/query-course.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CoursesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createCourseDto: CreateCourseDto, userId: string) {
        const slug = generateSlug(createCourseDto.title)
        const existing = await this.prisma.product.findUnique({
            where: { slug }
        })

        if (existing) {
            throw new ConflictException("Product already exists")
        }
        const course = await this.prisma.product.create({
            data: {
                title: createCourseDto.title,
                slug: generateSlug(createCourseDto.title),
                description: createCourseDto.description,
                shortDescription: createCourseDto.shortDescription,
                thumbnail: createCourseDto.thumbnail,
                type: 'COURSE',
                status: 'DRAFT',
                createdById: userId,
                updatedById: userId,
                course: {
                    create: {
                        level: createCourseDto.level,
                        language: createCourseDto.language,
                        authorId: userId,
                        categoryId: createCourseDto.categoryId,
                    }
                }
            }
        })
        return course
    }

    async update(
        updateCourseDto: UpdateCourseDto,
        courseId: string,
        userId: string,
    ) {
        const existing = await this.prisma.product.findUnique({
            where: {
                id: courseId,
            },
            include: {
                course: true,
            },
        });

        if (!existing?.course) {
            throw new NotFoundException('Course not found');
        }

        if (existing.course.authorId !== userId) {
            throw new ForbiddenException(
                'You can only update your own courses',
            );
        }

        const productData: Prisma.ProductUpdateInput = {
            updatedBy: {
                connect: {
                    id: userId,
                },
            },
        };

        const courseData: Prisma.CourseUpdateInput = {};

        // Product fields
        if (updateCourseDto.title !== undefined) {
            const slug = generateSlug(updateCourseDto.title);

            const slugExists = await this.prisma.product.findFirst({
                where: {
                    slug,
                    NOT: {
                        id: courseId,
                    },
                },
            });

            if (slugExists) {
                throw new ConflictException(
                    'A course with this title already exists',
                );
            }

            productData.title = updateCourseDto.title;
            productData.slug = slug;
        }

        if (updateCourseDto.description !== undefined) {
            productData.description =
                updateCourseDto.description;
        }

        if (updateCourseDto.shortDescription !== undefined) {
            productData.shortDescription =
                updateCourseDto.shortDescription;
        }

        if (updateCourseDto.thumbnail !== undefined) {
            productData.thumbnail =
                updateCourseDto.thumbnail;
        }

        // Course fields
        if (updateCourseDto.level !== undefined) {
            courseData.level = updateCourseDto.level;
        }

        if (updateCourseDto.language !== undefined) {
            courseData.language =
                updateCourseDto.language;
        }

        if (updateCourseDto.categoryId !== undefined) {
            if (updateCourseDto.categoryId === null) {
                courseData.category = {
                    disconnect: true,
                };
            } else {
                const category =
                    await this.prisma.category.findUnique({
                        where: {
                            id: updateCourseDto.categoryId,
                        },
                    });

                if (!category) {
                    throw new NotFoundException(
                        'Category not found',
                    );
                }

                courseData.category = {
                    connect: {
                        id: updateCourseDto.categoryId,
                    },
                };
            }
        }

        const update = await this.prisma.product.update({
            where: {
                id: courseId,
            },
            data: {
                ...productData,

                ...(Object.keys(courseData).length > 0
                    ? {
                        course: {
                            update: courseData,
                        },
                    }
                    : {}),
            },

            include: {
                course: true,
            },
        });

        return update;
    }
    async delete(id: string, userId: string) {
        const existing = await this.prisma.product.findUnique({
            where: { id },
            include: {
                course: true
            }
        })
        if (!existing) {
            throw new NotFoundException("Course not found")
        }

        if (existing.course?.authorId !== userId) {
            throw new ForbiddenException("You can only delete your own courses")
        }

        await this.prisma.product.delete({
            where: { id }
        })
        return { message: "Course deleted successfully" };
    }

    async findOne(id: string) {
        const existing = await this.prisma.product.findUnique({
            where: { id },
            include: {
                course: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                email: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                                bio: true
                            }
                        },
                        category: true,
                        sections: {
                            orderBy: { position: 'asc' }
                        }
                    }
                }
            }
        })
        if (!existing) {
            throw new NotFoundException("Course not found")
        }
        return existing
    }
    async query(queryCourseDto: CourseQueryDto) {
        const { search, page, limit } = queryCourseDto;
        const where: any = {
            type: 'COURSE'
        };
        if (search) {
            where.OR = [{
                title: {
                    contains: search,
                    mode: 'insensitive'
                }
            }, {
                description: {
                    contains: search,
                    mode: 'insensitive'
                }
            }]
        }

        const [courses, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit,
                skip: (page - 1) * limit
            }),
            this.prisma.product.count({ where })
        ])

        return {
            courses,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }
}
