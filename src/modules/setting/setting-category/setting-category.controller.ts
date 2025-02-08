import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { CategoriesService } from './setting-category.service';
import { CreateCategoryDto } from './dto/create-setting-cateogory.dto';
import { UpdateCategoryDto } from './dto/update-setting-category.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Public } from 'src/decorators/public.decorator';

interface ResponseType<T> {
    message: string;
    result: T;
}

// @ApiBearerAuth()
@ApiTags('Setting Categories')
@Controller('setting-categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new category' })
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<ResponseType<any>> {
        const category = await this.categoriesService.create(createCategoryDto);
        return {
            message: 'Category created successfully',
            result: category
        };
    }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get all categories with pagination and filtering' })
    async findAll(@Query() query: QueryCategoryDto): Promise<ResponseType<any>> {
        const result = await this.categoriesService.findAll(query);
        return {
            message: 'Categories retrieved successfully',
            result
        };
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get a category by id' })
    async findOne(@Param('id') id: string): Promise<ResponseType<any>> {
        const category = await this.categoriesService.findOne(id);
        return {
            message: 'Category retrieved successfully',
            result: category
        };
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a category' })
    async update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ): Promise<ResponseType<any>> {
        const category = await this.categoriesService.update(id, updateCategoryDto);
        return {
            message: 'Category updated successfully',
            result: category
        };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a category' })
    async remove(@Param('id') id: string): Promise<ResponseType<any>> {
        const category = await this.categoriesService.remove(id);
        return {
            message: 'Category deleted successfully',
            result: category
        };
    }
}