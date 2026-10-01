import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseQueryDto } from './dto/query-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CourseContentGuard, ContentKind } from '../auth/course-content.guard';
import { saveAssetToServer } from '../utils/storage.helper';

@ApiTags("Courses")
@ApiBearerAuth()
@Controller('courses')
@ContentKind('course')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    @Post('upload-thumbnail')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 5 * 1024 * 1024 },
    }))
    @ApiOperation({ summary: "Upload course thumbnail" })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, description: "Thumbnail uploaded successfully" })
    async uploadThumbnail(@UploadedFile() file: Express.Multer.File, @Req() req) {
        if (!file) {
            throw new BadRequestException('Image file is required');
        }
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed');
        }
        const stored = await saveAssetToServer(file, 'thumbnails');
        const host = req.get('host');
        const protocol = req.protocol;
        const fullUrl = `${protocol}://${host}${stored.url}`;
        return {
            url: fullUrl,
            path: stored.url,
            fileName: stored.fileName,
        };
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: "Create a new course" })
    @ApiResponse({ status: 201, description: "Course created successfully" })
    @ApiResponse({ status: 400, description: "Invalid request" })
    create(@Body() createCourseDto: CreateCourseDto, @Req() req) {
        return this.coursesService.create(createCourseDto, req.user.id);
    }

    @Get('manage')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    manage(@Query() query: CourseQueryDto, @Req() req) {
        return this.coursesService.query(query, req.user);
    }

    @Get('manage/:id')
    @UseGuards(JwtAuthGuard, RolesGuard, CourseContentGuard)
    @Roles('AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    manageOne(@Param('id') id: string) {
        return this.coursesService.findOne(id);
    }

    @Get('query')
    @ApiOperation({ summary: "Get all courses with pagination" })
    @ApiResponse({ status: 200, description: "Courses fetched successfully" })
    query(@Query() queryCourseDto: CourseQueryDto) {
        return this.coursesService.query(queryCourseDto);
    }

    @Get(':idOrSlug/preview/:sessionId')
    @ApiOperation({ summary: "Get a free preview session for a course" })
    findPreviewSession(@Param('idOrSlug') idOrSlug: string, @Param('sessionId') sessionId: string) {
        return this.coursesService.findPreviewSession(idOrSlug, sessionId);
    }

    @Get(':idOrSlug')
    @ApiOperation({ summary: "Get a course by id or slug" })
    @ApiResponse({ status: 200, description: "Course fetched successfully" })
    @ApiResponse({ status: 404, description: "Course not found" })
    findOne(@Param('idOrSlug') idOrSlug: string) {
        return this.coursesService.findPublicOne(idOrSlug);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard, CourseContentGuard)
    @Roles('AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: "Update a course" })
    @ApiResponse({ status: 200, description: "Course updated successfully" })
    @ApiResponse({ status: 404, description: "Course not found" })
    update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto, @Req() req) {
        return this.coursesService.update(updateCourseDto, id, req.user.id, req.user.roles);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard, CourseContentGuard)
    @Roles('AUTHOR', 'MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: "Delete a course" })
    @ApiResponse({ status: 200, description: "Course deleted successfully" })
    @ApiResponse({ status: 404, description: "Course not found" })
    delete(@Param('id') id: string, @Req() req) {
        return this.coursesService.delete(id, req.user.id, req.user.roles);
    }
}
