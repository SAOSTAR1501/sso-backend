// src/modules/auth/schemas/authorization-code.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuthorizationCodeDocument = AuthorizationCode & Document;

@Schema({ timestamps: true })
export class AuthorizationCode {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  clientId: string;

  @Prop({ required: true })
  redirectUri: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: 'profile email' })
  scope: string;

  @Prop({ required: true, expires: 600 }) // 10 minutes (600 seconds)
  expiresAt: Date;
}

export const AuthorizationCodeSchema = SchemaFactory.createForClass(AuthorizationCode);

// Create indexes for faster queries and automatic expiration
AuthorizationCodeSchema.index({ code: 1 }, { unique: true });
AuthorizationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index