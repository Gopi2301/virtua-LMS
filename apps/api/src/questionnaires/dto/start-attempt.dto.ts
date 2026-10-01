import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartAttemptDto {
  @ApiPropertyOptional({ description: 'Enrollment ID associated with the attempt' })
  @IsOptional()
  @IsUUID()
  enrollmentId?: string;
}
