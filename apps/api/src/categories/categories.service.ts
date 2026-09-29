import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { generateSlug } from '@virtua-lms/utils';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/query-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createCategoryDto: CreateCategoryDto) {
        const slug = generateSlug(createCategoryDto.name)

        const existing = await this.prisma.category.findUnique({
            where: { slug }
        })

        if (existing) {
            throw new ConflictException("Category already exists")
        }

        return await this.prisma.category.create({
            data: {
                name: createCategoryDto.name,
                slug,
                description: createCategoryDto.description
            }
        })

    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto) {
        const data: any = {
            ...updateCategoryDto
        };
        if (updateCategoryDto.slug) {
            const existing = await this.prisma.category.findUnique({
                where: {
                    slug: updateCategoryDto.slug
                }
            })
            if (existing) {
                throw new ConflictException("Category already exists")
            }
            data.slug = generateSlug(updateCategoryDto.slug)
        }
        return await this.prisma.category.update({
            where: {
                id
            },
            data
        })
    }

    async delete(id: string) {
        return await this.prisma.category.delete({
            where: {
                id
            }
        })
    }

    async findOne(id: string) {
        return await this.prisma.category.findUnique({
            where: {
                id
            }
        })
    }
    async query(queryCategoryDto: CategoryQueryDto) {
        const { search, page, limit } = queryCategoryDto;
        const where: any = {};
        if (search) {
            where.OR = [{
                name: {
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

        const [categories, total] = await Promise.all([
            this.prisma.category.findMany({
                where,
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit,
                skip: (page - 1) * limit
            }),
            this.prisma.category.count({ where })
        ])

        return {
            categories,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }


    }
}
