import { CreateSettingDto } from '../dto/create-setting.dto';
import { SettingCategoryEnum } from './category-enum';
import { SettingDataType } from './settings-data-type.enum';

export const languageSettings: CreateSettingDto[] = [
    {
        key: 'language.user_interface',
        value: {
            default: 'vi'
        },
        label: {
            en: 'User Interface Language',
            vi: 'Ngôn ngữ giao diện'
        },
        category: SettingCategoryEnum.LANGUAGE,
        dataType: SettingDataType.SELECT,
        options: [
            'vi',
            'en'
        ],
        isSystem: false,
        isActive: true,
        description: {
            en: 'Choose the language for the application interface',
            vi: 'Chọn ngôn ngữ cho giao diện ứng dụng'
        }
    },
    {
        key: 'language.content_preference',
        value: {
            default: 'auto'
        },
        label: {
            en: 'Content Language Preference',
            vi: 'Ngôn ngữ ưa thích cho nội dung'
        },
        category: SettingCategoryEnum.LANGUAGE,
        dataType: SettingDataType.SELECT,
        options: [
            'auto',
            'vi',
            'en'
        ],
        isSystem: false,
        isActive: true,
        description: {
            en: 'Preferred language for content and documents',
            vi: 'Ngôn ngữ ưa thích cho nội dung và tài liệu'
        }
    },
    {
        key: 'language.translation_assistance',
        value: {
            default: true
        },
        label: {
            en: 'Automatic Translation Assistance',
            vi: 'Hỗ trợ dịch thuật tự động'
        },
        category: SettingCategoryEnum.LANGUAGE,
        dataType: SettingDataType.BOOLEAN,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Automatically offer translations for content in other languages',
            vi: 'Tự động cung cấp bản dịch cho nội dung bằng các ngôn ngữ khác'
        }
    },
    {
        key: 'language.keyboard_layout',
        value: {
            default: 'vi-VN'
        },
        label: {
            en: 'Keyboard Layout',
            vi: 'Bố trí bàn phím'
        },
        category: SettingCategoryEnum.LANGUAGE,
        dataType: SettingDataType.SELECT,
        options: [
            'vi-VN',
            'en-US',
            'en-UK',
            'zh-CN',
            'ja-JP',
            'ko-KR'
        ],
        isSystem: false,
        isActive: true,
        description: {
            en: 'Select the keyboard layout for input methods',
            vi: 'Chọn bố trí bàn phím cho các phương thức nhập'
        }
    }
];