import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // Tự động thêm createdAt và updatedAt
export class User extends Document {
  @Prop({ required: true})
  fullName: string;

  @Prop({ required: false })
  password: string;

  @Prop({ required: true, unique: true }) // Trường email là bắt buộc và duy nhất
  email: string;

  @Prop({
    type: {
      url: { type: String, required: true },
      publicId: { type: String, default: "" }
    },
    default: {
      url: "",
      publicId: ""
    }
  })
  avatar: {
    url: string;
    publicId: string;
  };

  @Prop({ default: "" })
  googleId: string;

  @Prop({ default: ['user'] }) // Mặc định roles là 'user'
  roles: string[];

  @Prop({ default: true }) // Trạng thái tài khoản, mặc định là active
  isActive: boolean;

  @Prop({ default: '' }) // Trường resetPasswordToken nếu cần
  resetPasswordToken: string;

  @Prop({ default: '' }) // Thời gian hết hạn token
  resetPasswordExpires: Date;

  @Prop({ default: null }) // Refresh Token
  refreshToken: string;

  @Prop({ default: null }) // Thời gian tạo Refresh Token
  refreshTokenCreatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
