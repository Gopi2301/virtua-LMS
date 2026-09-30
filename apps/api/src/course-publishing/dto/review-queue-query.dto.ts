import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubmissionStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewQueueQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by submission status',
        enum: SubmissionStatus,
        default: SubmissionStatus.PENDING,
    })
    @IsOptional()
    @IsEnum(SubmissionStatus)
    status?: SubmissionStatus = SubmissionStatus.PENDING;

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}
