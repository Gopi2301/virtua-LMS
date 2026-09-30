import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class EnrollDto {
    @ApiProperty({ description: 'Product (course/bundle) ID to enroll in', example: 'uuid' })
    @IsUUID()
    productId: string;

    @ApiProperty({ description: 'Optional expiry date for the enrollment', required: false })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}
