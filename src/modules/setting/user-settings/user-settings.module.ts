import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// import { UserSettingsController } from './user-settings.controller';
import { UserSettingsService } from './user-settings.service';
import { UserSetting, UserSettingSchema } from './user-settings.schema';
import { SettingsModule } from '../settings/settings.module';
import { CacheModule } from '@nestjs/cache-manager';
import { UserSettingsController } from './user-settings.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: UserSetting.name, schema: UserSettingSchema }
        ]),
        SettingsModule,
        CacheModule.register({
            ttl: 300, // Cache for 5 minutes
        })
    ],
    controllers: [UserSettingsController],
    providers: [UserSettingsService],
    exports: [UserSettingsService]
})
export class UserSettingsModule {}