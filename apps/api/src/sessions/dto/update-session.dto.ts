import { ApiPropertyOptional } from '@nestjs/swagger';
import { SessionType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSessionDto {
  @ApiPropertyOptional({
    example: 'Updated Session Title',
    description: 'Session title',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated description of what will be learned in this session.',
    description: 'Session description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'New position index within the section',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({
    enum: SessionType,
    description: 'Session type (VIDEO, TEXT, LIVE)',
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
    example: true,
    description: 'Whether this session is marked as preview',
  })
  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this session is free to view',
  })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}
