import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/modules/user/user.schema';

export type UserSettingDocument = UserSetting & Document;

interface SettingValue {
  value: any;
  isActive: boolean;
  isCustomized: boolean;
}

@Schema({
  timestamps: true,
  collection: 'user-settings'
})
export class UserSetting {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true
  })
  user: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
    // Store settings as key-value pairs where key is the setting ID
    // and value contains the setting value and metadata
    // Example:
    // {
    //   "settingId1": { value: "custom-value", isActive: true, isCustomized: true },
    //   "settingId2": { value: false, isActive: true, isCustomized: true }
    // }
  })
  settings: Record<string, SettingValue>;
}

export const UserSettingSchema = SchemaFactory.createForClass(UserSetting);

// Index on user field for faster lookups
UserSettingSchema.index({ user: 1 }, { unique: true });