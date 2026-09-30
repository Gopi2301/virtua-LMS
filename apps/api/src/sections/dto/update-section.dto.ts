import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSectionDto {
  @ApiPropertyOptional({
    example: 'Module 1: Advanced Fundamentals',
    description: 'Updated section title',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated section description and detailed overview',
    description: 'Updated section description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Position index within the course',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
