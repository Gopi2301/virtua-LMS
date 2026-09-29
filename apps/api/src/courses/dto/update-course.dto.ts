import { PartialType, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateCourseDto } from "./create-course.dto";
import { IsEnum, IsOptional } from "class-validator";
import { ProductStatus, ProductType } from "@prisma/client";

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
    @ApiPropertyOptional({
        enum: ProductStatus,
        example: ProductStatus.DRAFT,
    })
    @IsOptional()
    @IsEnum(ProductStatus)
    status?: ProductStatus;

    @ApiPropertyOptional({
        enum: ProductType,
        example: ProductType.COURSE,
    })
    @IsOptional()
    @IsEnum(ProductType)
    type?: ProductType;
}