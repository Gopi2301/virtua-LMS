import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class ReorderSessionsDto {
  @ApiProperty({
    example: '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d1234',
    description: 'Section ID whose sessions are being reordered',
  })
  @IsUUID()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({
    example: [
      '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d1111',
      '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d2222',
      '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d3333',
    ],
    description: 'Array of Session IDs in the desired order (index will become the position)',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  sessionIds: string[];
}
