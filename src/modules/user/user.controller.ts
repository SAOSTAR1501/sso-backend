import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { LocalGuard } from '../auth/guard/local.guard';
import { UpdateAvatarDto } from './dtos/update-avatar.dto';
import { UpdateUserInfoDto } from './dtos/update-user-info.dto';
import { UserService } from './user.service';
import { CheckEmailDto } from './dtos/check-email.dto';
import { Public } from 'src/decorators/public.decorator';
import { CheckUsernameDto } from './dtos/check-username.dto';

@ApiTags('User Profile Management')
@Controller('profile')
@ApiBearerAuth()
@UseGuards(LocalGuard)
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }

    @Get('me')
    @ApiOperation({
        summary: 'Get current user information',
        description: 'Retrieves detailed information about the currently authenticated user'
    })
    async getCurrentUser(@Req() req: Request) {
        const userId = req.user['id'];
        return await this.userService.getCurrentUser(userId);
    }

    @Post('avatar')
    async updateAvatar(
        @Req() req: Request,
        @Body() avatar: UpdateAvatarDto
    ) {
        const userId = req.user['id'];
        return await this.userService.updateAvatar(userId, avatar);
    }

    @Post('info')
    @ApiOperation({
        summary: 'Update user profile information',
        description: 'Updates the profile information for the currently authenticated user'
    })
    async updateInfo(
        @Req() req: Request,
        @Body() updateData: UpdateUserInfoDto
    ) {
        const userId = req.user['id'];
        return await this.userService.updateInfo(userId, updateData);
    }

    @Public()
    @Post('check-email')
    @ApiOperation({ summary: "Check if an email is already in use" })
    async checkEmail(@Body() body: CheckEmailDto) {
        return await this.userService.checkEmail(body.email);
    }

    @Post('check-username')
    @ApiOperation({ summary: "Check if a username is already in use" })
    async checkUsername(@Body() body: CheckUsernameDto) {
        return await this.userService.checkUsername(body.username);
    }
}