import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus, WorkshopStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class QueryWorkshopDto {
  @ApiPropertyOptional({
    example: 'microservices',
    description: 'Search query matching title or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: WorkshopStatus,
    description: 'Filter by live workshop status (SCHEDULED, LIVE, COMPLETED, CANCELLED)',
  })
  @IsOptional()
  @IsEnum(WorkshopStatus)
  status?: WorkshopStatus;

  @ApiPropertyOptional({
    enum: ProductStatus,
    description: 'Filter by product status (DRAFT, IN_REVIEW, APPROVED, ON_AIR, OFF_AIR, ARCHIVED)',
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  productStatus?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Filter by author UUID',
  })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional({
    description: 'Filter free workshops only',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Page number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
