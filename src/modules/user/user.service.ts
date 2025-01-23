import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId)
    .select('fullName email avatar googleId roles isActive').exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async update(userId: string, updateData: Partial<User>): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true },
    );
  }

  async delete(userId: string): Promise<void> {
    await this.userModel.findByIdAndDelete(userId);
  }

  async getRefreshToken(userId: string){
    const user = await this.userModel.findById(userId).select('refreshToken').exec();
    return user;
  }

  async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken,
      refreshTokenCreatedAt: new Date(),
    });
  }
}
