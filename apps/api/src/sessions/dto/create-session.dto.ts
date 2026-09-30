import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({
    example: '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d1234',
    description: 'Section ID to attach this session to',
  })
  @IsUUID()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({
    example: 'Session 1: Introduction to NestJS Architecture',
    description: 'Session title',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: 'In this session, we will cover controllers, providers, and modules.',
    description: 'Session description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Position index within the section (auto-calculated if omitted)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({
    enum: SessionType,
    default: SessionType.VIDEO,
    description: 'Type of session (VIDEO, TEXT, LIVE)',
  })
  @IsOptional()
  @IsEnum(SessionType)
  type?: SessionType;

  @ApiPropertyOptional({
    enum: SessionType,
    description: 'Alias for type (status field in Prisma model)',
  })
  @IsOptional()
  @IsEnum(SessionType)
  status?: SessionType;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Whether this session is accessible as a public preview',
  })
  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Whether this session is free to view without enrollment',
  })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}
