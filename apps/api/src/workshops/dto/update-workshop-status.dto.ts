import { ApiProperty } from '@nestjs/swagger';
import { WorkshopStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateWorkshopStatusDto {
  @ApiProperty({
    enum: WorkshopStatus,
    example: WorkshopStatus.LIVE,
    description: 'Updated workshop status (SCHEDULED, LIVE, COMPLETED, CANCELLED)',
  })
  @IsEnum(WorkshopStatus)
  @IsNotEmpty()
  status: WorkshopStatus;
}
