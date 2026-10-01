import { IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QuestionAnswerDto {
  @ApiProperty({ description: 'Question UUID' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ description: 'Array of selected option UUIDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  selectedOptionIds: string[];
}

export class SubmitAttemptDto {
  @ApiProperty({ description: 'List of question answers', type: [QuestionAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerDto)
  answers: QuestionAnswerDto[];
}
