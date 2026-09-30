import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
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
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: "Create a new category" })
    @ApiResponse({ status: 201, description: "Category created successfully", type: CreateCategoryDto })
    @ApiResponse({ status: 400, description: "Invalid request" })
    async create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto)
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('MANAGER', 'SUPER_ADMIN')
    @ApiOperation({ summary: "Update a category" })
    @ApiResponse({ status: 200, description: "Category updated successfully", type: UpdateCategoryDto })
    @ApiResponse({ status: 400, description: "Invalid request" })
    async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoriesService.update(id, updateCategoryDto)
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('MANAGER', 'SUPER_ADMIN')
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

