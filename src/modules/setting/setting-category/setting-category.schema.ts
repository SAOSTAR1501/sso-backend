import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CategoryDocument = SettingCategory & Document;

@Schema({
    timestamps: true,
    collection: 'setting-categories'
})
export class SettingCategory {
    @Prop({
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    })
    code: string;

    @Prop({
        type: MongooseSchema.Types.Mixed,
        required: true,
        default: {}
    })
    name: Record<string, string>;

    @Prop({
        type: MongooseSchema.Types.Mixed,
        default: {}
    })
    description: Record<string, string>;

    @Prop({ type: Number, default: 0 })
    order: number;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isSystem: boolean;
}

export const SettingCategorySchema = SchemaFactory.createForClass(SettingCategory);