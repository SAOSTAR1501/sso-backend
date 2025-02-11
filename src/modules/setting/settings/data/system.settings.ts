import { CreateSettingDto } from '../dto/create-setting.dto';
import { SettingCategoryEnum } from './category-enum';
import { SettingDataType } from './settings-data-type.enum';

export const systemSettings: CreateSettingDto[] = [
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
        dataType: SettingDataType.SELECT,
        options: [
            'Asia/Ho_Chi_Minh',
            'Asia/Bangkok', 
            'Asia/Tokyo',
            'Asia/Singapore',
            'Asia/Seoul',
            'Asia/Shanghai',
            'UTC',
            'Europe/London',
            'America/New_York',
            'America/Los_Angeles'
        ],
        isSystem: false, // Allow users to modify
        isActive: true,
        description: {
            en: 'Select the default timezone for system operations and timestamp calculations',
            vi: 'Chọn múi giờ mặc định cho các hoạt động hệ thống và tính toán dấu thời gian'
        }
    },
    {
        key: 'system.date_format',
        value: {
            default: 'DD/MM/YYYY'
        },
        label: {
            en: 'Date Display Format',
            vi: 'Định dạng hiển thị ngày'
        },
        category: SettingCategoryEnum.SYSTEM,
        dataType: SettingDataType.SELECT,
        options: [
            'DD/MM/YYYY',
            'MM/DD/YYYY',
            'YYYY-MM-DD',
            'DD-MM-YYYY',
            'MM.DD.YYYY'
        ],
        isSystem: false,
        isActive: true,
        description: {
            en: 'Choose how dates are displayed throughout the system',
            vi: 'Chọn cách hiển thị ngày trong toàn hệ thống'
        }
    },
    {
        key: 'system.number_format',
        value: {
            default: 'en-US'
        },
        label: {
            en: 'Number Format',
            vi: 'Định dạng số'
        },
        category: SettingCategoryEnum.SYSTEM,
        dataType: SettingDataType.SELECT,
        options: [
            'en-US',
            'vi-VN',
            'de-DE',
            'fr-FR',
            'ja-JP',
            'zh-CN'
        ],
        isSystem: false,
        isActive: true,
        description: {
            en: 'Select the number formatting locale (decimal and thousand separators)',
            vi: 'Chọn locale định dạng số (dấu phân cách thập phân và hàng nghìn)'
        }
    },
    {
        key: 'system.pagination_default',
        value: {
            default: 10
        },
        label: {
            en: 'Default Items per Page',
            vi: 'Số mục mặc định trên mỗi trang'
        },
        category: SettingCategoryEnum.SYSTEM,
        dataType: SettingDataType.NUMBER,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Set the default number of items displayed per page',
            vi: 'Đặt số lượng mục hiển thị mặc định trên mỗi trang'
        }
    },
    {
        key: 'system.maintenance_message',
        value: {
            default: {
                en: 'System is currently undergoing maintenance. We will be back soon.',
                vi: 'Hệ thống đang trong quá trình bảo trì. Chúng tôi sẽ quay lại ngay.'
            }
        },
        label: {
            en: 'Maintenance Message',
            vi: 'Thông báo bảo trì'
        },
        category: SettingCategoryEnum.SYSTEM,
        dataType: SettingDataType.JSON,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Custom maintenance message in different languages',
            vi: 'Thông báo bảo trì tùy chỉnh bằng nhiều ngôn ngữ'
        }
    },
    {
        key: 'system.support_contact',
        value: {
            default: {
                email: 'support@1ai.one',
                phone: '+84 123 456 789'
            }
        },
        label: {
            en: 'Support Contact Information',
            vi: 'Thông tin liên hệ hỗ trợ'
        },
        category: SettingCategoryEnum.SYSTEM,
        dataType: SettingDataType.JSON,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Configure support contact details',
            vi: 'Cấu hình thông tin liên hệ hỗ trợ'
        }
    },
    {
        key: 'system.error_reporting',
        value: {
            default: true
        },
        label: {
            en: 'Enable Error Reporting',
            vi: 'Bật báo cáo lỗi'
        },
        category: SettingCategoryEnum.SYSTEM,
        dataType: SettingDataType.BOOLEAN,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Allow automatic error reporting to improve system stability',
            vi: 'Cho phép báo cáo lỗi tự động để cải thiện độ ổn định hệ thống'
        }
    },
    {
        key: 'system.feature_flags',
        value: {
            default: {
                beta_features: false,
                experimental_mode: false
            }
        },
        label: {
            en: 'System Feature Flags',
            vi: 'Cờ tính năng hệ thống'
        },
        category: SettingCategoryEnum.SYSTEM,
        dataType: SettingDataType.JSON,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Enable or disable experimental and beta features',
            vi: 'Bật hoặc tắt các tính năng thử nghiệm và beta'
        }
    }
];