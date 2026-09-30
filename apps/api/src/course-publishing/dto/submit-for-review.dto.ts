import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitForReviewDto {
    @ApiProperty({
        description: 'Optional note from the author when submitting',
        required: false,
        example: 'All sections and videos are complete. Ready for review.',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    note?: string;
}
