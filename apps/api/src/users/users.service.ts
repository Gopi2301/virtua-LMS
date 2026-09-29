import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        return user;
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
                ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
                ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
                ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
            },
        });
    }

    async findAll(query: FindUsersQueryDto) {
        const { page = 1, limit = 20, search, role, isActive } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {};

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (role) {
            where.roles = {
                has: role,
            };
        }

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findById(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        return user;
    }

    async updateRoles(userId: string, roles: Role[]) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        if (!roles || roles.length === 0) {
            throw new BadRequestException('At least one role must be assigned');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { roles },
        });
    }

    async updateStatus(userId: string, isActive: boolean) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { isActive },
        });
    }
}
