import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";

export class CreateCategoryDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    name: string;
    @ApiPropertyOptional()
    @IsString()
    slug?: string;
    @ApiPropertyOptional()
    @IsString()
    description?: string;
}

