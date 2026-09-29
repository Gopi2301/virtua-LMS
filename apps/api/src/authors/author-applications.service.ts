import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthorApplicationDto } from './dto/create-application.dto';
import { ReviewAuthorApplicationDto } from './dto/review-application.dto';
import { ApplicationStatus, Role } from '@prisma/client';

@Injectable()
export class AuthorApplicationsService {
    constructor(private readonly prisma: PrismaService) {}

    async apply(userId: string, dto: CreateAuthorApplicationDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.roles.includes(Role.AUTHOR)) {
            throw new BadRequestException('You are already an approved instructor');
        }

        // Check if there is already a pending application
        const existingPending = await this.prisma.authorApplication.findFirst({
            where: {
                userId,
                status: ApplicationStatus.PENDING,
            },
        });

        if (existingPending) {
            throw new ConflictException('You already have an instructor application pending review');
        }

        return this.prisma.authorApplication.create({
            data: {
                userId,
                headline: dto.headline,
                bio: dto.bio,
                expertise: dto.expertise,
                portfolioUrl: dto.portfolioUrl,
                sampleVideo: dto.sampleVideo,
            },
        });
    }

    async getMyApplication(userId: string) {
        return this.prisma.authorApplication.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAll(page = 1, limit = 10, status?: ApplicationStatus) {
        const skip = (page - 1) * limit;
        const where: any = {};
        if (status) {
            where.status = status;
        }

        const [items, total] = await Promise.all([
            this.prisma.authorApplication.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            roles: true,
                            avatarUrl: true,
                        },
                    },
                },
            }),
            this.prisma.authorApplication.count({ where }),
        ]);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findById(id: string) {
        const application = await this.prisma.authorApplication.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });

        if (!application) {
            throw new NotFoundException('Author application not found');
        }

        return application;
    }

    async review(id: string, reviewerId: string, dto: ReviewAuthorApplicationDto) {
        const application = await this.prisma.authorApplication.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!application) {
            throw new NotFoundException('Author application not found');
        }

        if (application.status !== ApplicationStatus.PENDING) {
            throw new BadRequestException(`Application is already ${application.status.toLowerCase()}`);
        }

        const newStatus = dto.status as ApplicationStatus;

        return this.prisma.$transaction(async (tx) => {
            // If approved, elevate user roles to include AUTHOR
            if (newStatus === ApplicationStatus.APPROVED) {
                const currentRoles = application.user.roles;
                if (!currentRoles.includes(Role.AUTHOR)) {
                    await tx.user.update({
                        where: { id: application.userId },
                        data: {
                            roles: [...currentRoles, Role.AUTHOR],
                        },
                    });
                }
            }

            // Update application state
            return tx.authorApplication.update({
                where: { id },
                data: {
                    status: newStatus,
                    reviewNotes: dto.reviewNotes,
                    reviewedBy: reviewerId,
                    reviewedAt: new Date(),
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            roles: true,
                        },
                    },
                },
            });
        });
    }
}
