export interface IUserSetting {
    _id?: string;
    user: string;
    setting: string;
    value: any;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}