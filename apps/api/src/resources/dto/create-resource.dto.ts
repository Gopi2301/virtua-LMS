import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({
    example: '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d1234',
    description: 'Session UUID to attach this resource to',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    example: 'Lesson Cheatsheet & Slides',
    description: 'Title of the resource',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    enum: ResourceType,
    example: ResourceType.PDF,
    description: 'Type of resource (PDF, ZIP, EXTERNAL_LINK, GITHUB)',
  })
  @IsEnum(ResourceType)
  @IsNotEmpty()
  type: ResourceType;

  @ApiPropertyOptional({
    example: 'https://github.com/example/course-repo',
    description: 'External link or download URL for the resource',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    example: 'resources/1727680000_cheatsheet.pdf',
    description: 'Storage key on server / S3 storage for downloadable files',
  })
  @IsOptional()
  @IsString()
  storageKey?: string;

  @ApiPropertyOptional({
    example: 'cheatsheet.pdf',
    description: 'Original file name',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    example: 1048576,
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
    example: 0,
    description: 'Position index within the session (auto-assigned if omitted)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
