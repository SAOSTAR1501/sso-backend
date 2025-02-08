import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Setting } from '../settings/settings.schema';
import { User } from 'src/modules/user/user.schema';

export type UserSettingDocument = UserSetting & Document;

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
        type: MongooseSchema.Types.ObjectId,
        ref: Setting.name,
        required: true
    })
    setting: string;

    @Prop({
        type: MongooseSchema.Types.Mixed,
        required: true
    })
    value: any;

    @Prop({ default: true })
    isActive: boolean;
}

export const UserSettingSchema = SchemaFactory.createForClass(UserSetting);

UserSettingSchema.index({ userId: 1, settingId: 1 }, { unique: true });