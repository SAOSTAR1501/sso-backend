import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Logger,
    Param,
    Post,
    Query
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { IUser } from 'src/interfaces/user.interface';
import { QueryUserSettingDto } from './dto/query-user-settings.dto';
import { UserSettingsService } from './user-settings.service';
import { UpdateUserSettingDto } from './dto/update-user-settings.dto';

@ApiTags('User Settings')
@ApiBearerAuth()
@Controller('user-settings')
export class UserSettingsController {
    private readonly logger = new Logger(UserSettingsController.name);

    constructor(private readonly userSettingsService: UserSettingsService) { }

    @Post()
    @ApiOperation({ summary: 'Update user setting' })
    async update(
        @User() user: IUser,
        @Param('settingId') settingId: string,
        @Body() updateDto: UpdateUserSettingDto
    ) {
        this.logger.debug(`Updating setting ${settingId} for user ${user.id}`);
        const setting = await this.userSettingsService.update(
            user.id.toString(),
            updateDto
        );
        return {
            statusCode: HttpStatus.OK,
            message: 'User setting updated successfully',
            data: setting
        };
    }

    @Get('all')
    @ApiOperation({ summary: 'Get all user settings merged with system defaults' })
    async findAllUserSettings(@User() user: IUser, @Query() query: QueryUserSettingDto) {
        return await this.userSettingsService.findAllUserSettings(
            user.id.toString(),
            query
        );
    }

    @Post('reset')
    @ApiOperation({ summary: 'Reset all user settings to default values' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Settings reset successfully' })
    async resetAllSettings(@User() user: IUser) {
        this.logger.debug(`Resetting all settings for user ${user.id}`);
        return await this.userSettingsService.resetAllSettings(user.id.toString());
    }
}