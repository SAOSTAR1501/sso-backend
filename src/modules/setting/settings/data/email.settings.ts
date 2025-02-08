import { CreateSettingDto } from '../dto/create-setting.dto';
import { SettingCategoryEnum } from './category-enum';
import { SettingDataType } from './settings-data-type.enum';

export const emailSettings: CreateSettingDto[] = [
    {
        key: 'email.smtp.host',
        value: {
            default: 'smtp.gmail.com'
        },
        label: {
            en: 'SMTP Host',
            vi: 'Máy chủ SMTP'
        },
        category: SettingCategoryEnum.EMAIL,
        dataType: SettingDataType.STRING,
        isSystem: true,
        isActive: true
    },
    {
        key: 'email.smtp.port',
        value: {
            default: 587
        },
        label: {
            en: 'SMTP Port',
            vi: 'Cổng SMTP'
        },
        category: SettingCategoryEnum.EMAIL,
        dataType: SettingDataType.NUMBER,
        isSystem: true,
        isActive: true
    },
    {
        key: 'email.from.address',
        value: {
            default: 'noreply@1ai.one'
        },
        label: {
            en: 'From Email Address',
            vi: 'Địa chỉ email gửi'
        },
        category: SettingCategoryEnum.EMAIL,
        dataType: SettingDataType.STRING,
        isSystem: true,
        isActive: true
    }
];
