import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { QuerySettingDto } from './dto/query-setting.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/decorators/public.decorator';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new setting' })
    async create(@Body() createSettingDto: CreateSettingDto) {
        const setting = await this.settingsService.create(createSettingDto);
        return {
            message: 'Setting created successfully',
            result: setting
        };
    }   

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get all settings with pagination and filtering' })
    async findAll(@Query() query: QuerySettingDto) {
        const result = await this.settingsService.findAll(query);
        return {
            message: 'Settings retrieved successfully',
            result
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a setting by id' })
    async findOne(@Param('id') id: string) {
        const setting = await this.settingsService.findOne(id);
        return {
            message: 'Setting retrieved successfully',
            result: setting
        };
    }

    @Get('key/:key')
    @ApiOperation({ summary: 'Get a setting by key' })
    async findByKey(@Param('key') key: string) {
        const setting = await this.settingsService.findByKey(key);
        return {
            message: 'Setting retrieved successfully',
            result: setting
        };
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a setting' })
    async update(
        @Param('id') id: string,
        @Body() updateSettingDto: UpdateSettingDto,
    ) {
        const setting = await this.settingsService.update(id, updateSettingDto);
        return {
            message: 'Setting updated successfully',
            result: setting
        };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a setting' })
    async remove(@Param('id') id: string) {
        const setting = await this.settingsService.remove(id);
        return {
            message: 'Setting deleted successfully',
            result: setting
        };
    }

    @Public()
    @Post('init')
    @ApiOperation({ summary: 'Initialize default settings' })
    async initializeSettings() {
        const settings = await this.settingsService.createInitialSettings();
        return {
            message: 'Settings initialized successfully',
            result: {
                total: settings.length,
                items: settings
            }
        };
    }
}