import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkshopStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateWorkshopDto {
  @ApiProperty({
    example: 'Live Interactive Masterclass: Microservices with NestJS',
    description: 'Title of the workshop',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: 'Join us for a 3-hour live hands-on workshop building microservices from scratch.',
    description: 'Detailed description of the workshop',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Build production-ready microservices with NestJS and Redis.',
    description: 'Short summary of the workshop',
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/thumbnails/workshop-microservices.jpg',
    description: 'Thumbnail cover URL',
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({
    example: '2026-10-15T14:00:00.000Z',
    description: 'Scheduled start time (ISO 8601 string)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startTime?: Date;

  @ApiPropertyOptional({
    example: '2026-10-15T17:00:00.000Z',
    description: 'Scheduled end time (ISO 8601 string)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endTime?: Date;

  @ApiPropertyOptional({
    example: 'https://meet.google.com/abc-defg-hij',
    description: 'Virtual meeting URL (Zoom, Google Meet, Teams)',
  })
  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/recordings/workshop-1.mp4',
    description: 'Link to recording after workshop has completed',
  })
  @IsOptional()
  @IsString()
  recordingUrl?: string;

  @ApiPropertyOptional({
    example: 49.99,
    default: 0.0,
    description: 'Price in dollars (0.0 if free)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    example: false,
    default: true,
    description: 'Whether the workshop is free to join',
  })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({
    example: 100,
    description: 'Maximum number of attendees',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttendees?: number;

  @ApiPropertyOptional({
    enum: WorkshopStatus,
    default: WorkshopStatus.SCHEDULED,
    description: 'Status of the workshop (SCHEDULED, LIVE, COMPLETED, CANCELLED)',
  })
  @IsOptional()
  @IsEnum(WorkshopStatus)
  status?: WorkshopStatus;
}
