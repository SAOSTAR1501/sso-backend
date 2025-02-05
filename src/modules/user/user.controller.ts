import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Patch,
    Post,
    Req,
    UseGuards,
    ValidationPipe,
    ParseUUIDPipe,
    HttpException
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateAvatarDto } from './dtos/update-avatar.dto';
import { UpdateUserInfoDto } from './dtos/update-user-info.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guard/jwt.guard';
import { User } from './user.schema';

@ApiTags('User Profile Management')
@Controller('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
}