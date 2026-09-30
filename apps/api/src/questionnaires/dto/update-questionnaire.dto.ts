import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateQuestionnaireDto {
  @ApiPropertyOptional({
    example: 'Updated Questionnaire Title',
    description: 'Title of the questionnaire',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated instructions for quiz takers',
    description: 'Description of the questionnaire',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 80,
    description: 'Minimum percentage score required to pass (0-100)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Maximum number of attempts allowed (0 = unlimited)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxAttempts?: number;
}
