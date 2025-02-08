import { CreateSettingDto } from '../dto/create-setting.dto';
import { SettingCategoryEnum } from './category-enum';
import { SettingDataType } from './settings-data-type.enum';

export const apiSettings: CreateSettingDto[] = [
    {
        key: 'api.rate_limit.enabled',
        value: {
            default: true
        },
        label: {
            en: 'Enable Rate Limiting',
            vi: 'Bật giới hạn tần suất'
        },
        category: SettingCategoryEnum.API,
        dataType: SettingDataType.BOOLEAN,
        isSystem: true,
        isActive: true
    },
    {
        key: 'api.rate_limit.max_requests',
        value: {
            default: 100
        },
        label: {
            en: 'Maximum Requests per Minute',
            vi: 'Số yêu cầu tối đa mỗi phút'
        },
        category: SettingCategoryEnum.API,
        dataType: SettingDataType.NUMBER,
        isSystem: true,
        isActive: true
    }
];