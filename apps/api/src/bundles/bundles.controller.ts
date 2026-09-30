import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BundlesService } from './bundles.service';
import {
  AddCourseToBundleDto,
  CreateBundleDto,
  QueryBundleDto,
  UpdateBundleDto,
} from './dto';

@ApiTags('Bundles')
@ApiBearerAuth()
@Controller('bundles')
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new course bundle' })
  @ApiResponse({ status: 201, description: 'Bundle created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Product slug conflict' })
  create(@Body() createBundleDto: CreateBundleDto, @Req() req: any) {
    return this.bundlesService.create(createBundleDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List bundles with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Bundles fetched successfully' })
  findAll(@Query() query: QueryBundleDto) {
    return this.bundlesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bundle by ID or slug with included courses' })
  @ApiParam({ name: 'id', description: 'Bundle UUID or slug' })
  @ApiResponse({ status: 200, description: 'Bundle fetched successfully' })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  findOne(@Param('id') id: string) {
    return this.bundlesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update bundle metadata' })
  @ApiParam({ name: 'id', description: 'Bundle UUID or product ID' })
  @ApiResponse({ status: 200, description: 'Bundle updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  update(
    @Param('id') id: string,
    @Body() updateBundleDto: UpdateBundleDto,
    @Req() req: any,
  ) {
    return this.bundlesService.update(id, updateBundleDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bundle' })
  @ApiParam({ name: 'id', description: 'Bundle UUID or product ID' })
  @ApiResponse({ status: 200, description: 'Bundle deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.bundlesService.remove(id, req.user.id);
  }

  @Post(':id/courses')
  @ApiOperation({ summary: 'Add a course to a bundle' })
  @ApiParam({ name: 'id', description: 'Bundle UUID or product ID' })
  @ApiResponse({ status: 201, description: 'Course added to bundle' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Bundle or course not found' })
  @ApiResponse({ status: 409, description: 'Course already exists in this bundle' })
  addCourse(
    @Param('id') id: string,
    @Body() dto: AddCourseToBundleDto,
    @Req() req: any,
  ) {
    return this.bundlesService.addCourse(id, dto.courseId, req.user.id);
  }

  @Delete(':id/courses/:courseId')
  @ApiOperation({ summary: 'Remove a course from a bundle' })
  @ApiParam({ name: 'id', description: 'Bundle UUID or product ID' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Course removed from bundle' })
  @ApiResponse({ status: 403, description: 'Forbidden: Author mismatch' })
  @ApiResponse({ status: 404, description: 'Bundle or course link not found' })
  removeCourse(
    @Param('id') id: string,
    @Param('courseId') courseId: string,
    @Req() req: any,
  ) {
    return this.bundlesService.removeCourse(id, courseId, req.user.id);
  }
}
