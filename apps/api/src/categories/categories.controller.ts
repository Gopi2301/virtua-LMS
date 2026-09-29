import { Body, Controller, Post, Put, Delete, Get, Query, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoryQueryDto } from './dto/query-category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @ApiOperation({ summary: "Create a new category" })
    @ApiResponse({ status: 201, description: "Category created successfully", type: CreateCategoryDto })
    @ApiResponse({ status: 400, description: "Invalid request" })
    async create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto)
    }

    @Put(':id')
    @ApiOperation({ summary: "Update a category" })
    @ApiResponse({ status: 200, description: "Category updated successfully", type: UpdateCategoryDto })
    @ApiResponse({ status: 400, description: "Invalid request" })
    async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoriesService.update(id, updateCategoryDto)
    }

    @Delete(':id')
    @ApiOperation({ summary: "Delete a category" })
    @ApiResponse({ status: 200, description: "Category deleted successfully" })
    @ApiResponse({ status: 400, description: "Invalid request" })
    async delete(@Param('id') id: string) {
        return this.categoriesService.delete(id)
    }

    @Get('query')
    @ApiOperation({ summary: "Get all categories with pagination" })
    @ApiResponse({ status: 200, description: "Categories fetched successfully", type: [CreateCategoryDto] })
    async query(@Query() queryCategoryDto: CategoryQueryDto) {
        return this.categoriesService.query(queryCategoryDto)
    }

}
