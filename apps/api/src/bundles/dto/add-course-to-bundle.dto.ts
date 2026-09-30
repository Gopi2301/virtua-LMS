import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddCourseToBundleDto {
  @ApiProperty({
    example: '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d1111',
    description: 'Course ID or Product ID of the course to add to this bundle',
  })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;
}
