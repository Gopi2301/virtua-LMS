import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateOptionDto {
  @ApiPropertyOptional({
    example: 'Updated option text',
    description: 'Answer option text',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this option is a correct answer',
  })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Position order of this option among choices',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
