import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateProgressDto {
    @ApiProperty({ description: 'Session ID to record progress for' })
    @IsUUID()
    sessionId: string;

    @ApiProperty({ description: 'Seconds watched so far', required: false, default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    watchTime?: number;

    @ApiProperty({ description: 'Mark session as completed', required: false })
    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}
