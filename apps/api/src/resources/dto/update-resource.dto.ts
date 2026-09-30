import { ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateResourceDto {
  @ApiPropertyOptional({
    example: 'Updated Resource Title',
    description: 'Title of the resource',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    enum: ResourceType,
    description: 'Type of resource (PDF, ZIP, EXTERNAL_LINK, GITHUB)',
  })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @ApiPropertyOptional({
    example: 'https://github.com/example/updated-course-repo',
    description: 'External link or download URL for the resource',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    example: 'resources/1727680000_updated_cheatsheet.pdf',
    description: 'Storage key on server / S3 storage',
  })
  @IsOptional()
  @IsString()
  storageKey?: string;

  @ApiPropertyOptional({
    example: 'updated_cheatsheet.pdf',
    description: 'Original file name',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    example: 2097152,
    description: 'File size in bytes',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;

  @ApiPropertyOptional({
    example: 'application/pdf',
    description: 'MIME type of the resource file',
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'New position index within the session',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
