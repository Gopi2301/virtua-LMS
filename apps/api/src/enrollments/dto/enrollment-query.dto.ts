import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EnrollmentStatus } from '@prisma/client';

export class EnrollmentQueryDto {
    @ApiProperty({ enum: EnrollmentStatus, required: false })
    @IsOptional()
    @IsEnum(EnrollmentStatus)
    status?: EnrollmentStatus;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}
