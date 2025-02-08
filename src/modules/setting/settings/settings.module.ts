import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { Setting, SettingSchema } from './settings.schema';
import { SettingCategoryModule } from '../setting-category/setting-category.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Setting.name, schema: SettingSchema }
        ]),
        SettingCategoryModule
    ],
    controllers: [SettingsController],
    providers: [SettingsService],
    exports: [SettingsService]
})
export class SettingsModule { }