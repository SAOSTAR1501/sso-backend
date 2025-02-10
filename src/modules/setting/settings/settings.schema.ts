import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { SettingDataType } from './data/settings-data-type.enum';
import { SettingCategory } from '../setting-category/setting-category.schema';

export type SettingDocument = Setting & Document;

@Schema({
  timestamps: true,
  collection: 'settings'
})
export class Setting extends Document {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  })
  key: string;

  @Prop({
    required: true,
    type: MongooseSchema.Types.Mixed,
    default: {}
  })
  value: Record<string, any>;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
    default: {}
  })
  label: Record<string, string>;

  @Prop({
    type: String,
    ref: SettingCategory.name,
    required: true
  })
  category: String;

  @Prop({
    type: String,
    enum: SettingDataType,
    required: true
  })
  dataType: SettingDataType;

  @Prop({
    type: [String],
    default: []
  })
  options: string[];

  @Prop({ default: false })
  isSystem: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);