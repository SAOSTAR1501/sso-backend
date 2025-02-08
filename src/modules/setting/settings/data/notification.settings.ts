import { CreateSettingDto } from '../dto/create-setting.dto';
import { SettingCategoryEnum } from './category-enum';
import { SettingDataType } from './settings-data-type.enum';

export const notificationSettings: CreateSettingDto[] = [
    {
        key: 'notification.email.enabled',
        value: {
            default: true
        },
        label: {
            en: 'Enable Email Notifications',
            vi: 'Bật thông báo qua email'
        },
        category: SettingCategoryEnum.NOTIFICATION,
        dataType: SettingDataType.BOOLEAN,
        isSystem: true,
        isActive: true
    }
];