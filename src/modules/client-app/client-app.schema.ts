import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClientAppDocument = ClientApp & Document;

@Schema({ timestamps: true })
export class ClientApp extends Document {
  @Prop({ required: true, unique: true })
  clientId: string;

  @Prop({ required: true })
  clientName: string;

  @Prop({ required: true })
  clientSecret: string;

  @Prop({ required: true })
  frontendUrl: string;

  @Prop({ required: true })
  backendUrl: string;

  @Prop({ type: [String], default: [] })
  redirectUrls: string[];

  @Prop({ type: [String], default: [] })
  allowedOrigins: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isInternal: boolean;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const ClientAppSchema = SchemaFactory.createForClass(ClientApp);