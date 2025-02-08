import { SettingCategory } from '../../setting-category/setting-category.schema';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { SettingCategoryEnum } from './category-enum';
import { SettingDataType } from './settings-data-type.enum';

export const systemSettings: CreateSettingDto[] = [
    {
        key: 'system.site.name',
        value: {
            en: '1ai.one',
            vi: '1ai.one'
        },
        label: {
            en: 'Site Name',
            vi: 'Tên trang web'
        },
        category: SettingCategoryEnum.SYSTEM,
        dataType: SettingDataType.STRING,
        isSystem: true,
        isActive: true
    },
    {
        key: 'system.timezone',
        value: {
            default: 'Asia/Ho_Chi_Minh'
        },
        label: {
            en: 'System Timezone',
            vi: 'Múi giờ hệ thống'
        },
        category: SettingCategoryEnum.SYSTEM,
        dataType: SettingDataType.STRING,
        options: {
            availableTimezones: [
                'Asia/Ho_Chi_Minh',
                'Asia/Bangkok',
                'UTC'
            ]
        },
        isSystem: true,
        isActive: true
    }
];