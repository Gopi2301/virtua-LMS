import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';

export class SimulateWebhookDto {
  @ApiProperty({ description: 'Order ID to simulate payment event for', example: 'uuid' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: 'Target outcome', enum: ['SUCCEEDED', 'FAILED'], example: 'SUCCEEDED' })
  @IsEnum(['SUCCEEDED', 'FAILED'])
  status: 'SUCCEEDED' | 'FAILED';
}
