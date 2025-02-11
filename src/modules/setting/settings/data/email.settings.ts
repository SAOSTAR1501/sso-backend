import { CreateSettingDto } from '../dto/create-setting.dto';
import { SettingCategoryEnum } from './category-enum';
import { SettingDataType } from './settings-data-type.enum';

export const emailSettings: CreateSettingDto[] = [
    {
        key: 'email.notifications.account_activity',
        value: {
            default: true
        },
        label: {
            en: 'Account Activity Notifications',
            vi: 'Thông báo hoạt động tài khoản'
        },
        category: SettingCategoryEnum.EMAIL,
        dataType: SettingDataType.BOOLEAN,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Receive emails about login, password changes, and account modifications',
            vi: 'Nhận email về đăng nhập, thay đổi mật khẩu và các thay đổi tài khoản'
        }
    },
    {
        key: 'email.notifications.security_alerts',
        value: {
            default: true
        },
        label: {
            en: 'Security Alerts',
            vi: 'Cảnh báo bảo mật'
        },
        category: SettingCategoryEnum.EMAIL,
        dataType: SettingDataType.BOOLEAN,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Receive important security notifications and unusual activity warnings',
            vi: 'Nhận thông báo bảo mật quan trọng và cảnh báo hoạt động bất thường'
        }
    },
    {
        key: 'email.notifications.project_updates',
        value: {
            default: true
        },
        label: {
            en: 'Project Update Notifications',
            vi: 'Thông báo cập nhật dự án'
        },
        category: SettingCategoryEnum.EMAIL,
        dataType: SettingDataType.BOOLEAN,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Receive emails about project progress, milestones, and changes',
            vi: 'Nhận email về tiến độ dự án, các mốc quan trọng và thay đổi'
        }
    },
    {
        key: 'email.notifications.task_assignments',
        value: {
            default: true
        },
        label: {
            en: 'Task Assignment Notifications',
            vi: 'Thông báo giao nhiệm vụ'
        },
        category: SettingCategoryEnum.EMAIL,
        dataType: SettingDataType.BOOLEAN,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Receive emails when new tasks are assigned to you',
            vi: 'Nhận email khi có nhiệm vụ mới được giao cho bạn'
        }
    },
    {
        key: 'email.notifications.collaboration_invites',
        value: {
            default: true
        },
        label: {
            en: 'Collaboration Invitation Notifications',
            vi: 'Thông báo lời mời cộng tác'
        },
        category: SettingCategoryEnum.EMAIL,
        dataType: SettingDataType.BOOLEAN,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Receive emails about project or team collaboration invitations',
            vi: 'Nhận email về các lời mời cộng tác dự án hoặc nhóm'
        }
    },
    {
        key: 'email.notifications.billing',
        value: {
            default: true
        },
        label: {
            en: 'Billing and Payment Notifications',
            vi: 'Thông báo thanh toán và hóa đơn'
        },
        category: SettingCategoryEnum.EMAIL,
        dataType: SettingDataType.BOOLEAN,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Receive emails about invoices, payment status, and billing updates',
            vi: 'Nhận email về hóa đơn, trạng thái thanh toán và cập nhật thanh toán'
        }
    },
    {
        key: 'email.notifications.marketing',
        value: {
            default: false
        },
        label: {
            en: 'Marketing and Promotional Emails',
            vi: 'Email tiếp thị và khuyến mãi'
        },
        category: SettingCategoryEnum.EMAIL,
        dataType: SettingDataType.BOOLEAN,
        isSystem: false,
        isActive: true,
        description: {
            en: 'Receive newsletters, product updates, and promotional offers',
            vi: 'Nhận bản tin, cập nhật sản phẩm và ưu đãi khuyến mãi'
        }
    }
];