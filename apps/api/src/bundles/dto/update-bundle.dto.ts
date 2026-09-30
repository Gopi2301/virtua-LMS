import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateBundleDto {
  @ApiPropertyOptional({
    example: 'Updated Bundle Title',
    description: 'Title of the course bundle',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated comprehensive description of the bundle package.',
    description: 'Detailed description of the bundle',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Updated short summary',
    description: 'Short summary of the bundle',
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/thumbnails/updated-bundle.jpg',
    description: 'Cover thumbnail URL',
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({
    enum: ProductStatus,
    description: 'Product lifecycle status (DRAFT, IN_REVIEW, APPROVED, ON_AIR, OFF_AIR, ARCHIVED)',
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
