export interface ISettingValue {
    value: any;
    isActive: boolean;
    isCustomized: boolean;
}

export interface IUserSetting {
    _id?: string;
    user: string;
    settings: Record<string, ISettingValue>;
    createdAt?: Date;
    updatedAt?: Date;
}

export type NestedSettingValue = ISettingValue | Record<string, ISettingValue | Record<string, any>>;