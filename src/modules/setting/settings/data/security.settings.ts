import { CreateSettingDto } from '../dto/create-setting.dto';
import { SettingCategoryEnum } from './category-enum';
import { SettingDataType } from './settings-data-type.enum';

export const securitySettings: CreateSettingDto[] = [
    {
        key: 'security.max_login_attempts',
        value: {
            default: 5
        },
        label: {
            en: 'Maximum Login Attempts',
            vi: 'Số lần đăng nhập tối đa'
        },
        category: SettingCategoryEnum.SECURITY,
        dataType: SettingDataType.NUMBER,
        isSystem: true,
        isActive: true
    },
    {
        key: 'security.2fa.enabled',
        value: {
            default: false
        },
        label: {
            en: '2FA Authentication',
            vi: 'Xác thực 2 yếu tố'
        },
        category: SettingCategoryEnum.SECURITY,
        dataType: SettingDataType.BOOLEAN,
        isSystem: true,
        isActive: true
    }
];