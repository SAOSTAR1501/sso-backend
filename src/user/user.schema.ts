import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // Tự động thêm createdAt và updatedAt
export class User {
  @Prop({ required: true, unique: true }) // Trường username là bắt buộc và duy nhất
  username: string;

  @Prop({ required: true }) // Trường password là bắt buộc
  password: string;

  @Prop({ required: true, unique: true }) // Trường email là bắt buộc và duy nhất
  email: string;

  @Prop({ default: ['user'] }) // Mặc định roles là 'user'
  roles: string[];

  @Prop({ default: true }) // Trạng thái tài khoản, mặc định là active
  isActive: boolean;

  @Prop({ default: null }) // Trường resetPasswordToken nếu cần
  resetPasswordToken: string;

  @Prop({ default: null }) // Thời gian hết hạn token
  resetPasswordExpires: Date;

  @Prop({ default: null }) // Refresh Token
  refreshToken: string;

  @Prop({ default: null }) // Thời gian tạo Refresh Token
  refreshTokenCreatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
