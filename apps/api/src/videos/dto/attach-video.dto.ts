import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VideoStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AttachVideoDto {
  @ApiProperty({
    example: '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d1234',
    description: 'Session UUID to attach this video to',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiPropertyOptional({
    example: '892716382',
    description: 'Vimeo Video ID. If omitted, a dummy mock Vimeo video will be generated for development/testing.',
  })
  @IsOptional()
  @IsString()
  vimeoVideoId?: string;

  @ApiPropertyOptional({
    example: 'Course Overview and Introduction',
    description: 'Video title (defaults to session title if omitted)',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'Detailed walkthrough of the module curriculum',
    description: 'Video description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 360,
    description: 'Duration in seconds (defaults to 300 if omitted in dummy mode)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    example: 'https://vumbnail.com/892716382.jpg',
    description: 'Video thumbnail URL',
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({
    enum: VideoStatus,
    default: VideoStatus.READY,
    description: 'Current video status (UPLOADING, PROCESSING, READY, FAILED)',
  })
  @IsOptional()
  @IsEnum(VideoStatus)
  status?: VideoStatus;
}
