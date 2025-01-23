import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true, enum: ['RESET_PASSWORD', 'EMAIL_VERIFICATION'], index: true })
  type: string;

  @Prop({ required: true, default: Date.now, expires: 300 }) // 5 minutes expiry
  expiresAt: Date;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: false })
  isVerified: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);