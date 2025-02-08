import { CreateSettingDto } from '../dto/create-setting.dto';
import { SettingCategoryEnum } from './category-enum';
import { SettingDataType } from './settings-data-type.enum';

export const languageSettings: CreateSettingDto[] = [
    {
        key: 'language.default',
        value: {
            default: 'vi'
        },
        label: {
            en: 'Default Language',
            vi: 'Ngôn ngữ mặc định'
        },
        category: SettingCategoryEnum.LANGUAGE,
        dataType: SettingDataType.STRING,
        options: {
            availableLanguages: ['en', 'vi']
        },
        isSystem: true,
        isActive: true
    }
];