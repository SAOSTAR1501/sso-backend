import { CreateSettingDto } from '../dto/create-setting.dto';
import { SettingCategoryEnum } from './category-enum';
import { SettingDataType } from './settings-data-type.enum';

export const authSettings: CreateSettingDto[] = [
    {
        key: 'auth.login.preferred_method',
        value: {
            default: 'email'
        },
        label: {
            en: 'Preferred Login Method',
            vi: 'Phương thức đăng nhập ưa thích'
        },
        category: SettingCategoryEnum.AUTH,
        dataType: SettingDataType.SELECT,
        options: [
            'email',
            'username',
            'phone'
        ],
        isSystem: false,
        isActive: true,
        description: {
            en: 'Choose your preferred method for logging into the account',
            vi: 'Chọn phương thức ưa thích để đăng nhập tài khoản'
        }
    },
    {
        key: 'auth.social_login.providers',
        value: {
            default: {
                google: false,
                facebook: false,
                apple: false
            }
        },
        label: {
            en: 'Social Login Providers',
            vi: 'Nhà cung cấp đăng nhập mạng xã hội'
        },
        category: SettingCategoryEnum.AUTH,
        dataType: SettingDataType.JSON,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Enable or disable social login options',
            vi: 'Bật hoặc tắt các tùy chọn đăng nhập bằng mạng xã hội'
        }
    },
    {
        key: 'auth.session.remember_me',
        value: {
            default: {
                enabled: true,
                duration: 30 // days
            }
        },
        label: {
            en: 'Remember Me Settings',
            vi: 'Cài đặt Ghi nhớ đăng nhập'
        },
        category: SettingCategoryEnum.AUTH,
        dataType: SettingDataType.JSON,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Configure automatic login and session persistence',
            vi: 'Cấu hình đăng nhập tự động và duy trì phiên'
        }
    },
    {
        key: 'auth.password.reset_method',
        value: {
            default: 'email'
        },
        label: {
            en: 'Password Reset Method',
            vi: 'Phương thức đặt lại mật khẩu'
        },
        category: SettingCategoryEnum.AUTH,
        dataType: SettingDataType.SELECT,
        options: [
            'email',
            'phone',
            'both'
        ],
        isSystem: false,
        isActive: true,
        description: {
            en: 'Choose how you want to receive password reset instructions',
            vi: 'Chọn cách bạn muốn nhận hướng dẫn đặt lại mật khẩu'
        }
    },
    {
        key: 'auth.login.device_management',
        value: {
            default: {
                max_devices: 5,
                allow_concurrent_login: false
            }
        },
        label: {
            en: 'Device Login Management',
            vi: 'Quản lý đăng nhập thiết bị'
        },
        category: SettingCategoryEnum.AUTH,
        dataType: SettingDataType.JSON,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Control the number of devices and concurrent logins',
            vi: 'Kiểm soát số lượng thiết bị và đăng nhập đồng thời'
        }
    },
    {
        key: 'auth.notifications.login_alerts',
        value: {
            default: {
                email: true,
                sms: false
            }
        },
        label: {
            en: 'Login Notification Channels',
            vi: 'Kênh thông báo đăng nhập'
        },
        category: SettingCategoryEnum.AUTH,
        dataType: SettingDataType.JSON,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Choose how you want to be notified about account logins',
            vi: 'Chọn cách bạn muốn nhận thông báo về đăng nhập tài khoản'
        }
    }
];