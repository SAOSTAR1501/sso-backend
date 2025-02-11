import { CreateSettingDto } from '../dto/create-setting.dto';
import { SettingCategoryEnum } from './category-enum';
import { SettingDataType } from './settings-data-type.enum';

export const appearanceSettings: CreateSettingDto[] = [
    {
        key: 'appearance.theme',
        value: {
            default: 'light'
        },
        label: {
            en: 'Theme Mode',
            vi: 'Chế độ giao diện'
        },
        category: SettingCategoryEnum.APPEARANCE,
        dataType: SettingDataType.SELECT,
        options: 
            ['light', 'dark', 'system']
        ,
        isSystem: true,
        isActive: true
    },
    {
        key: 'appearance.primary_color',
        value: {
            default: '#1677ff'
        },
        label: {
            en: 'Primary Color',
            vi: 'Màu chủ đạo'
        },
        category: SettingCategoryEnum.APPEARANCE,
        dataType: SettingDataType.COLOR,
        isSystem: true,
        isActive: true
    }
];