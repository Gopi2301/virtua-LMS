import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateQuestionnaireDto {
  @ApiProperty({
    example: '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d1234',
    description: 'Session UUID to attach this questionnaire to',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    example: 'Module 1 Knowledge Check',
    description: 'Title of the questionnaire / quiz',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: 'Test your understanding of NestJS fundamentals and controllers.',
    description: 'Description or instructions for the questionnaire',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 70,
    default: 0,
    description: 'Minimum percentage score required to pass (0 = no passing score requirement)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({
    example: 3,
    default: 0,
    description: 'Maximum number of attempts allowed (0 = unlimited)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxAttempts?: number;
}
