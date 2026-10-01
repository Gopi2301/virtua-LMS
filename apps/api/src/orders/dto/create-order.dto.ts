import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'Product ID (or primary product) to purchase', example: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'List of product IDs for multi-item or bundle checkout', example: ['uuid'], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  productIds?: string[];

  @ApiProperty({ description: 'Currency code', example: 'USD', required: false, default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}
