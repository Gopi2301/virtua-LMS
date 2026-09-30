import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewDecisionDto {
    @ApiProperty({
        description: 'Reviewer comment — required when requesting changes, optional when approving',
        required: false,
        example: 'Great course! Please fix the typo in Section 2 session title.',
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    comment?: string;
}
