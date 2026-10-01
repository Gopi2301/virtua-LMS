import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({ description: 'Order ID to pay for', example: 'uuid' })
  @IsUUID()
  orderId: string;
}
