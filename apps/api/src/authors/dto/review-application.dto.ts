import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewAuthorApplicationDto {
    @ApiProperty({ enum: ['APPROVED', 'REJECTED'], example: 'APPROVED' })
    @IsNotEmpty()
    @IsIn(['APPROVED', 'REJECTED'])
    status: 'APPROVED' | 'REJECTED';

    @ApiPropertyOptional({ example: 'Great profile and teaching experience. Welcome to Virtua!' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    reviewNotes?: string;
}
