import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseQueryDto } from './dto/query-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';


@ApiTags("Courses")
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    @Post()
    @ApiOperation({ summary: "Create a new course" })
    @ApiResponse({ status: 201, description: "Course created successfully" })
    @ApiResponse({ status: 400, description: "Invalid request" })
    create(@Body() createCourseDto: CreateCourseDto, @Req() req) {
        return this.coursesService.create(createCourseDto, req.user.id);
    }

    @Get('query')
    @ApiOperation({ summary: "Get all courses with pagination" })
    @ApiResponse({ status: 200, description: "Courses fetched successfully" })
    query(@Query() queryCourseDto: CourseQueryDto) {
        return this.coursesService.query(queryCourseDto);
    }
    @Get(':id')
    @ApiOperation({ summary: "Get a course by id" })
    @ApiResponse({ status: 200, description: "Course fetched successfully" })
    @ApiResponse({ status: 404, description: "Course not found" })
    findOne(@Param('id') id: string) {
        return this.coursesService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: "Update a course" })
    @ApiResponse({ status: 200, description: "Course updated successfully" })
    @ApiResponse({ status: 404, description: "Course not found" })
    update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto, @Req() req) {
        return this.coursesService.update(updateCourseDto, id, req.user.id);
    }
    @Delete(':id')
    @ApiOperation({ summary: "Delete a course" })
    @ApiResponse({ status: 200, description: "Course deleted successfully" })
    @ApiResponse({ status: 404, description: "Course not found" })
    delete(@Param('id') id: string, @Req() req) {
        return this.coursesService.delete(id, req.user.id);
    }
}
