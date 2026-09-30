import { ApiPropertyOptional } from '@nestjs/swagger';
import { VideoStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateVideoDto {
  @ApiPropertyOptional({
    example: 'Updated Video Title',
    description: 'Video title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated description of the lecture video',
    description: 'Video description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '918273645',
    description: 'Vimeo Video ID',
  })
  @IsOptional()
  @IsString()
  vimeoVideoId?: string;

  @ApiPropertyOptional({
    example: 420,
    description: 'Duration in seconds',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    example: 'https://vumbnail.com/918273645.jpg',
    description: 'Video thumbnail URL',
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({
    enum: VideoStatus,
    description: 'Current video status',
  })
  @IsOptional()
  @IsEnum(VideoStatus)
  status?: VideoStatus;
}
