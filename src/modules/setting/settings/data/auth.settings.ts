import { CreateSettingDto } from '../dto/create-setting.dto';
import { SettingCategoryEnum } from './category-enum';
import { SettingDataType } from './settings-data-type.enum';

export const authSettings: CreateSettingDto[] = [
    {
        key: 'auth.jwt.expiration',
        value: {
            default: 3600
        },
        label: {
            en: 'JWT Token Expiration (seconds)',
            vi: 'Thời gian hết hạn JWT Token (giây)'
        },
        category: SettingCategoryEnum.AUTH,
        dataType: SettingDataType.NUMBER,
        isSystem: true,
        isActive: true
    },
    {
        key: 'auth.password.min_length',
        value: {
            default: 8
        },
        label: {
            en: 'Minimum Password Length',
            vi: 'Độ dài mật khẩu tối thiểu'
        },
        category: SettingCategoryEnum.AUTH,
        dataType: SettingDataType.NUMBER,
        isSystem: true,
        isActive: true
    }
];