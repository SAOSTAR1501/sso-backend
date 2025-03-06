import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { UpdateAvatarDto } from './dtos/update-avatar.dto';
import { UpdateUserInfoDto } from './dtos/update-user-info.dto';
import { ResponseType } from 'src/interfaces/response.interface';
import * as bcrypt from 'bcryptjs';
import { UpdatePasswordDto } from './dtos/update-password.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }
  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId)
      .select('fullName phoneNumber dateOfBirth gender username email avatar googleId role isActive').lean().exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ email }).exec();
  }

  async checkEmail(email: string): Promise<any> {
    const user = await this.userModel.findOne({ email }).exec();
    if (user) {
      throw new ConflictException('Email is already in use');
    }
    return {
      message: 'Email is available',
      result: false,
      statusCode: 200
    };
  }

  async checkUsername(username: string): Promise<any> {
    const user = await this.userModel.findOne({ username }).exec();
    if (user) {
      throw new ConflictException('Username is already in use');
    }
    return {
      message: 'Username is available',
      result: false,
      statusCode: 200
    }
  }
  
  async create(user: Partial<User>): Promise<User> {
    const newUser = new this.userModel(user);
    const username = newUser.email.split('@')[0];
    newUser.username = username;
    return newUser.save();
  }

  async update(userId: string, updateData: Partial<User>): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
  }

  async updateInfo(userId: string, updateData: UpdateUserInfoDto): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Clean update data by removing undefined values
    const cleanUpdateData = Object.entries(updateData)
      .reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

    // Update the user
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: cleanUpdateData },
      {
        new: true,
        runValidators: true,
        select: '-password -__v'
      }
    ).exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }

    return {
      message: "User info updated successfully",
      result: {
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        avatar: updatedUser.avatar
      }
    };
  }

  async updateAvatar(userId: string, avatar: UpdateAvatarDto) {
    const user = await this.userModel.findByIdAndUpdate(userId, { avatar }, { new: true }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user.toObject();
    return {
      message: "Avatar updated successfully",
      result: result
    }
  }

  async updatePassword(userId: string, passwords: UpdatePasswordDto): Promise<ResponseType<any>> {
    const user = await this.userModel.findById(userId);
    const oldPassword = await bcrypt.compare(passwords.oldPassword, user.password);
    if (!oldPassword) {
      throw new BadRequestException('Old password is incorrect');
    }

    if(passwords.oldPassword === passwords.newPassword) {
      throw new ConflictException('New password cannot be the same as the old password');
    }

    const hashedPassword = await bcrypt.hash(passwords.newPassword, 10);
    await this.userModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true },
    );

    return {
      message: "Password updated successfully",
      success: true
    }
  }

  async delete(userId: string): Promise<void> {
    await this.userModel.findByIdAndDelete(userId);
  }

  async getCurrentUser(userId: string) {
    const user = await this.userModel.findById(userId).select('-password -__v'); // Phương thức findById trong UserService
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      result: user,
      message: 'Get user info successfully'
    };
  }
}
