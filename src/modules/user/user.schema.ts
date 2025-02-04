import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // Tự động thêm createdAt và updatedAt
export class User extends Document {
  @Prop({ required: true})
  fullName: string;

  @Prop({ required: false })
  password: string;

  @Prop({required: false})
  username: string;

  @Prop({ required: true, unique: true }) // Trường email là bắt buộc và duy nhất
  email: string;

  @Prop({ default: "" })
  phoneNumber: string;

  @Prop()
  dateOfBirth: Date;

  @Prop({ enum: ['Male', 'Female', 'Other'], default: 'Other' })
  gender: string;

  @Prop({ default: false })
  isVerified: boolean;

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

  @Prop({ default: 'customer' }) // Mặc định roles là 'user'
  role: string;

  @Prop({ default: true }) // Trạng thái tài khoản, mặc định là active
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
