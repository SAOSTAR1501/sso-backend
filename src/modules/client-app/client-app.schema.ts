// src/modules/client-app/schemas/client-app.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ClientApp extends Document {
  @Prop({ required: true, unique: true })
  clientId: string;

  @Prop({ required: true })
  clientSecret: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: [String] })
  redirectUris: string[];

  @Prop({ required: true, type: [String], default: ['profile', 'email'] })
  allowedScopes: string[];

  @Prop({ required: true, default: false })
  trusted: boolean;

  @Prop({ required: true, default: true })
  active: boolean;

  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;
  
  @Prop({ default: 3600 }) // 1 hour in seconds
  accessTokenLifetime: number;

  @Prop({ default: 2592000 }) // 30 days in seconds
  refreshTokenLifetime: number;
}

export const ClientAppSchema = SchemaFactory.createForClass(ClientApp);