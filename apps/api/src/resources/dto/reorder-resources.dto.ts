import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class ReorderResourcesDto {
  @ApiProperty({
    example: '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d1234',
    description: 'Session UUID whose resources are being reordered',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    example: [
      '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d1111',
      '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d2222',
      '2b7c3f7a-2d2d-4f3b-9e7f-7b6a9c5d3333',
    ],
    description: 'Array of Resource IDs in the desired order (index will become the position)',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  resourceIds: string[];
}
