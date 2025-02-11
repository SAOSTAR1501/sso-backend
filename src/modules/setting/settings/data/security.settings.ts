import { CreateSettingDto } from '../dto/create-setting.dto';
import { SettingCategoryEnum } from './category-enum';
import { SettingDataType } from './settings-data-type.enum';

export const securitySettings: CreateSettingDto[] = [
    {
        key: 'security.two_factor_authentication',
        value: {
            default: false
        },
        label: {
            en: 'Two-Factor Authentication',
            vi: 'Xác thực hai yếu tố'
        },
        category: SettingCategoryEnum.SECURITY,
        dataType: SettingDataType.BOOLEAN,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Enable additional security by requiring a second verification method',
            vi: 'Bật bảo mật bổ sung bằng cách yêu cầu phương thức xác minh thứ hai'
        }
    },
    {
        key: 'security.two_factor_method',
        value: {
            default: 'authenticator_app'
        },
        label: {
            en: '2FA Verification Method',
            vi: 'Phương thức xác minh 2FA'
        },
        category: SettingCategoryEnum.SECURITY,
        dataType: SettingDataType.SELECT,
        options: [
            'authenticator_app',
            'sms',
            'email'
        ],
        isSystem: false,
        isActive: true,
        description: {
            en: 'Choose your preferred two-factor authentication method',
            vi: 'Chọn phương thức xác thực hai yếu tố ưa thích'
        }
    },
    {
        key: 'security.login_activity_tracking',
        value: {
            default: true
        },
        label: {
            en: 'Login Activity Tracking',
            vi: 'Theo dõi hoạt động đăng nhập'
        },
        category: SettingCategoryEnum.SECURITY,
        dataType: SettingDataType.BOOLEAN,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Track and log login attempts and device information',
            vi: 'Theo dõi và ghi lại các lần đăng nhập và thông tin thiết bị'
        }
    },
    {
        key: 'security.active_sessions',
        value: {
            default: true
        },
        label: {
            en: 'Manage Active Sessions',
            vi: 'Quản lý phiên đang hoạt động'
        },
        category: SettingCategoryEnum.SECURITY,
        dataType: SettingDataType.BOOLEAN,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Allow viewing and terminating active sessions on other devices',
            vi: 'Cho phép xem và kết thúc các phiên đang hoạt động trên các thiết bị khác'
        }
    },
    {
        key: 'security.password_complexity',
        value: {
            default: {
                minLength: 12,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true
            }
        },
        label: {
            en: 'Password Complexity Requirements',
            vi: 'Yêu cầu độ phức tạp mật khẩu'
        },
        category: SettingCategoryEnum.SECURITY,
        dataType: SettingDataType.JSON,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Set your preferred password complexity requirements',
            vi: 'Đặt các yêu cầu về độ phức tạp của mật khẩu'
        }
    },
    {
        key: 'security.device_authorization',
        value: {
            default: true
        },
        label: {
            en: 'New Device Authorization',
            vi: 'Ủy quyền thiết bị mới'
        },
        category: SettingCategoryEnum.SECURITY,
        dataType: SettingDataType.BOOLEAN,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Require explicit authorization for new devices',
            vi: 'Yêu cầu ủy quyền rõ ràng cho các thiết bị mới'
        }
    },
    {
        key: 'security.privacy_data_sharing',
        value: {
            default: {
                analytics: false,
                personalization: false
            }
        },
        label: {
            en: 'Data Sharing Preferences',
            vi: 'Tùy chọn chia sẻ dữ liệu'
        },
        category: SettingCategoryEnum.SECURITY,
        dataType: SettingDataType.JSON,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Control how your data is used for analytics and personalization',
            vi: 'Kiểm soát cách sử dụng dữ liệu của bạn cho phân tích và cá nhân hóa'
        }
    }
];