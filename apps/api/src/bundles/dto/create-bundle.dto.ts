import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateBundleDto {
  @ApiProperty({
    example: 'Full Stack Web Development Bundle',
    description: 'Title of the course bundle',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: 'Get all our premium web development courses in one cost-effective package.',
    description: 'Detailed description of the bundle',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'All frontend and backend courses bundled together.',
    description: 'Short summary of the bundle',
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/thumbnails/bundle-webdev.jpg',
    description: 'Cover thumbnail URL for the bundle',
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({
    example: [
      '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d1111',
      '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d2222',
    ],
    description: 'Array of Course IDs to initially include in this bundle',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  courseIds?: string[];
}
