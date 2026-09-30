import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { CreateOptionDto } from './create-option.dto';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateQuestionDto {
  @ApiPropertyOptional({ type: [CreateOptionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];

  @ApiProperty({
    example: 'What decorator defines a controller in NestJS?',
    description: 'The question text',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    enum: QuestionType,
    default: QuestionType.MULTIPLE_CHOICE,
    description: 'Type of question (MULTIPLE_CHOICE, MULTIPLE_SELECT, TRUE_FALSE)',
  })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({
    example: 'Controllers in NestJS are decorated with @Controller() to define routing paths.',
    description: 'Explanation shown to students after answering',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Position order of the question within the quiz',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
