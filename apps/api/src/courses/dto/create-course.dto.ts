import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { CourseLevel } from '@prisma/client';

export class CreateCourseDto {
    @ApiProperty({
        example: 'Complete Node.js Backend Development',
        description: 'Course title',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string;

    @ApiPropertyOptional({
        example: 'Learn Node.js, Express, PostgreSQL and backend architecture.',
        description: 'Short description displayed in course cards and listings',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    shortDescription?: string;

    @ApiPropertyOptional({
        example:
            'A complete backend development course covering Node.js, Express, PostgreSQL, authentication and production deployment.',
        description: 'Full course description',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        enum: CourseLevel,
        example: CourseLevel.BEGINNER,
    })
    @IsEnum(CourseLevel)
    level: CourseLevel;

    @ApiPropertyOptional({
        example: 'en',
        default: 'en',
    })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    language?: string;

    @ApiPropertyOptional({
        example: '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d1234',
        description: 'Course category ID',
    })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({
        example: 'https://cdn.example.com/courses/nodejs.jpg',
        description: 'Course thumbnail URL',
    })
    @IsOptional()
    @IsString()
    thumbnail?: string;
}