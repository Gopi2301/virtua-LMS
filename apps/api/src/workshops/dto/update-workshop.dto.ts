import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus, WorkshopStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateWorkshopDto {
  @ApiPropertyOptional({
    example: 'Updated Workshop Title',
    description: 'Title of the workshop',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated detailed description',
    description: 'Detailed description of the workshop',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Updated short summary',
    description: 'Short summary of the workshop',
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/thumbnails/updated-workshop.jpg',
    description: 'Cover thumbnail URL',
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({
    enum: ProductStatus,
    description: 'Lifecycle status of the product (DRAFT, IN_REVIEW, APPROVED, ON_AIR, OFF_AIR, ARCHIVED)',
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  productStatus?: ProductStatus;

  @ApiPropertyOptional({
    example: '2026-10-15T15:00:00.000Z',
    description: 'Scheduled start time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startTime?: Date;

  @ApiPropertyOptional({
    example: '2026-10-15T18:00:00.000Z',
    description: 'Scheduled end time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endTime?: Date;

  @ApiPropertyOptional({
    example: 'https://meet.google.com/xyz-uvwx-rst',
    description: 'Virtual meeting URL',
  })
  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/recordings/workshop-rec.mp4',
    description: 'Recording URL',
  })
  @IsOptional()
  @IsString()
  recordingUrl?: string;

  @ApiPropertyOptional({
    example: 79.99,
    description: 'Price in dollars',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the workshop is free to join',
  })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({
    example: 150,
    description: 'Maximum number of attendees',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttendees?: number;

  @ApiPropertyOptional({
    enum: WorkshopStatus,
    description: 'Live workshop status (SCHEDULED, LIVE, COMPLETED, CANCELLED)',
  })
  @IsOptional()
  @IsEnum(WorkshopStatus)
  status?: WorkshopStatus;
}
