import { ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateQuestionDto {
  @ApiPropertyOptional({
    example: 'Updated question text',
    description: 'The question text',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    enum: QuestionType,
    description: 'Type of question (MULTIPLE_CHOICE, MULTIPLE_SELECT, TRUE_FALSE)',
  })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({
    example: 'Updated explanation',
    description: 'Explanation shown to students after answering',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Position order of the question within the quiz',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
