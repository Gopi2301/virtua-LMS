import { IsArray, IsEnum, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateRolesDto {
    @ApiProperty({ enum: Role, isArray: true, example: ['AUTHOR', 'STUDENT'] })
    @IsArray()
    @ArrayNotEmpty()
    @IsEnum(Role, { each: true })
    roles!: Role[];
}
