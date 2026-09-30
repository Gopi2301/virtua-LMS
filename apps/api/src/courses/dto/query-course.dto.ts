import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from "class-validator";
import { ProductStatus } from '@prisma/client';

export class CourseQueryDto {
    @ApiPropertyOptional({
        example: 'course title'
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        example: 1,
        default: 1,
        minimum: 1,
        maximum: 100,
    })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({
        example: 20,
        default: 20,
    })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;

    @ApiPropertyOptional({
        enum: ProductStatus
    })
    @IsOptional()
    @IsEnum(ProductStatus)
    status?: ProductStatus;

    @ApiPropertyOptional({
        example: 'cuid1234'
    })
    @IsOptional()
    @IsString()
    categoryId?: string;
}
