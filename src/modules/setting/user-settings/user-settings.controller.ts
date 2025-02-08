import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
    Query,
    UseGuards,
    HttpStatus,
    Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserSettingsService } from './user-settings.service';
import { CreateUserSettingDto } from './dto/create-user-settings.dto';
import { QueryUserSettingDto } from './dto/query-user-settings.dto';
import { User } from 'src/decorators/user.decorator';
import { IUser } from 'src/interfaces/user.interface';
import { UpdateUserSettingDto } from './dto/update-user-settins.dto';

@ApiTags('User Settings')
@ApiBearerAuth()
@Controller('user-settings')
export class UserSettingsController {
    private readonly logger = new Logger(UserSettingsController.name);

    constructor(private readonly userSettingsService: UserSettingsService) { }

    @Post()
    @ApiOperation({ summary: 'Create or update user setting' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Setting created/updated successfully'
    })
    async createOrUpdate(
        @User() user: IUser,
        @Body() createDto: CreateUserSettingDto
    ) {
        this.logger.debug(`Creating/updating setting for user ${user.id}`);
        const setting = await this.userSettingsService.createOrUpdate(
            user.id.toString(),
            createDto
        );
        return {
            statusCode: HttpStatus.CREATED,
            message: 'User setting created/updated successfully',
            data: setting
        };
    }

    @Get()
    @ApiOperation({ summary: 'Get all user settings with pagination and filtering' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Settings retrieved successfully'
    })
    async findAll(
        @User() user: IUser,
        @Query() query: QueryUserSettingDto
    ) {
        this.logger.debug(`Retrieving settings for user ${user.id}`);
        const result = await this.userSettingsService.findAll(
            user.id.toString(),
            query
        );
        return {
            statusCode: HttpStatus.OK,
            message: 'User settings retrieved successfully',
            data: result
        };
    }

    @Get('all')
    @ApiOperation({ summary: 'Get all user settings merged with system defaults' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'All settings retrieved successfully'
    })
    async findAllUserSettings(@User() user: IUser, @Query() query: QueryUserSettingDto) {
        return await this.userSettingsService.findAllUserSettings(
            user.id.toString(),
            query   
        );
    }

    @Put('setting/:settingId')
    @ApiOperation({ summary: 'Update specific user setting' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Setting updated successfully'
    })
    async update(
        @User() user: IUser,
        @Param('settingId') settingId: string,
        @Body() updateDto: UpdateUserSettingDto
    ) {
        this.logger.debug(`Updating setting ${settingId} for user ${user.id}`);
        const setting = await this.userSettingsService.update(
            user.id.toString(),
            settingId,
            updateDto
        );
        return {
            statusCode: HttpStatus.OK,
            message: 'User setting updated successfully',
            data: setting
        };
    }

    @Delete('setting/:settingId')
    @ApiOperation({ summary: 'Reset user setting to default' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Setting reset successfully'
    })
    async resetToDefault(
        @User() user: IUser,
        @Param('settingId') settingId: string
    ) {
        this.logger.debug(`Resetting setting ${settingId} for user ${user.id}`);
        const setting = await this.userSettingsService.resetToDefault(
            user.id.toString(),
            settingId
        );
        return {
            statusCode: HttpStatus.OK,
            message: 'User setting reset to default successfully',
            data: setting
        };
    }

    @Post('bulk')
    @ApiOperation({ summary: 'Update multiple user settings at once' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Settings updated successfully'
    })
    async bulkUpdate(
        @User() user: IUser,
        @Body() settings: CreateUserSettingDto[]
    ) {
        this.logger.debug(`Bulk updating settings for user ${user.id}`);
        const result = await this.userSettingsService.bulkUpdate(
            user.id.toString(),
            settings
        );
        return {
            statusCode: HttpStatus.OK,
            message: 'User settings updated successfully',
            data: result
        };
    }
}