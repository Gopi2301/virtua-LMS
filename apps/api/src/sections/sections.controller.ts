import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import {
  CreateSectionDto,
  ReorderSectionsDto,
  UpdateSectionDto,
} from './dto';

@ApiTags('Sections')
@ApiBearerAuth()
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new course section' })
  @ApiResponse({ status: 201, description: 'Section created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  create(@Body() createSectionDto: CreateSectionDto, @Req() req: any) {
    return this.sectionsService.create(createSectionDto, req.user.id);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder sections within a course' })
  @ApiResponse({ status: 200, description: 'Sections reordered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid section IDs supplied' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  reorder(@Body() reorderDto: ReorderSectionsDto, @Req() req: any) {
    return this.sectionsService.reorder(reorderDto, req.user.id);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all sections for a course (with sessions, videos, and resources)' })
  @ApiParam({ name: 'courseId', description: 'Course ID or Product ID' })
  @ApiResponse({ status: 200, description: 'Sections fetched successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.sectionsService.findAllByCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a section by ID' })
  @ApiParam({ name: 'id', description: 'Section UUID' })
  @ApiResponse({ status: 200, description: 'Section fetched successfully' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  findOne(@Param('id') id: string) {
    return this.sectionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a section' })
  @ApiParam({ name: 'id', description: 'Section UUID' })
  @ApiResponse({ status: 200, description: 'Section updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  update(
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
    @Req() req: any,
  ) {
    return this.sectionsService.update(id, updateSectionDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a section' })
  @ApiParam({ name: 'id', description: 'Section UUID' })
  @ApiResponse({ status: 200, description: 'Section deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.sectionsService.remove(id, req.user.id);
  }
}
