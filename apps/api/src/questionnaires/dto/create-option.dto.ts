import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateOptionDto {
  @ApiProperty({
    example: '@Controller()',
    description: 'Answer option text',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Whether this option is a correct answer',
  })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: 'Position order of this option among choices',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
