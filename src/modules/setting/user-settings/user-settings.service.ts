import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    BadRequestException,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
import { Connection, Model } from 'mongoose';
import { ResponseType } from 'src/interfaces/response.interface';
import { SettingsService } from '../settings/settings.service';
import { QueryUserSettingDto } from './dto/query-user-settings.dto';
import { UpdateUserSettingDto } from './dto/update-user-settings.dto';
import { ISettingValue } from './user-settings.interface';
import { UserSetting, UserSettingDocument } from './user-settings.schema';

@Injectable()
export class UserSettingsService {
    private readonly logger = new Logger(UserSettingsService.name);
    private readonly CACHE_TTL = 300000; // 5 minutes in milliseconds

    constructor(
        @InjectModel(UserSetting.name)
        private userSettingModel: Model<UserSettingDocument>,
        @InjectConnection() private connection: Connection,
        private readonly settingsService: SettingsService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }

    private getCacheKey(userId: string): string {
        return `user_settings:${userId}`;
    }

    async update(
        userId: string,
        updateDto: UpdateUserSettingDto
    ): Promise<UserSettingDocument> {
        try {
            // Verify setting exists and validate value
            const setting = await this.settingsService.findByKey(updateDto.settingKey);
            if (!setting) {
                throw new NotFoundException(`Setting ${updateDto.settingKey} not found`);
            }

            await this.validateSettingValue(setting, updateDto.value);

            // Start transaction
            const session = await this.connection.startSession();
            let result;

            try {
                await session.withTransaction(async () => {
                    // Find or create user settings document
                    const settingValue: ISettingValue = {
                        value: updateDto.value,
                        isActive: updateDto.isActive ?? true,
                        isCustomized: true
                    };

                    result = await this.userSettingModel.findOneAndUpdate(
                        { user: userId },
                        {
                            $set: {
                                [`settings.${updateDto.settingKey}`]: settingValue
                            }
                        },
                        {
                            new: true,
                            upsert: true,
                            session
                        }
                    );
                });
            } finally {
                await session.endSession();
            }

            // Update cache
            await this.cacheManager.set(
                this.getCacheKey(userId),
                result.toObject(),
                this.CACHE_TTL
            );

            return result;
        } catch (error) {
            this.logger.error(
                `Error in update for user ${userId}: ${error.message}`,
                error.stack
            );
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Error updating user setting');
        }
    }

    async findAllUserSettings(userId: string, query: QueryUserSettingDto): Promise<ResponseType<any>> {
        try {
            // Get all available system settings with filters
            const availableSettings = await this.settingsService.findAllAvailable(query);

            // Get user's settings document
            const userSettingsDoc = await this.userSettingModel
                .findOne({ user: userId })
                .lean()
                .exec();

            // Helper function to get user setting value
            const getUserSetting = (settingKey: string): ISettingValue | undefined => {
                // First try direct key match
                const directSetting = userSettingsDoc?.settings?.[settingKey];
                if (directSetting && 'value' in directSetting) {
                    return directSetting as ISettingValue;
                }

                // Try hierarchical path
                const parts = settingKey.split('.');
                let current: any = userSettingsDoc?.settings;

                for (const part of parts) {
                    current = current?.[part];
                    if (!current) break;
                }

                // Check if the final value matches ISettingValue structure
                if (current && typeof current === 'object' && 'value' in current) {
                    return {
                        value: current.value,
                        isActive: current.isActive ?? true,
                        isCustomized: true
                    };
                }

                return undefined;
            };

            // Merge system settings with user settings
            const mergedSettings = availableSettings.map(systemSetting => {
                const settingKey = systemSetting.key;
                const userSetting = getUserSetting(settingKey);

                // Create flattened setting object
                const flattenedSetting = {
                    key: settingKey,
                    value: userSetting?.value ?? systemSetting.value?.default,
                    defaultValue: systemSetting.value?.default,
                    label: systemSetting.label,
                    category: systemSetting.category.toString(),
                    dataType: systemSetting.dataType,
                    isSystem: systemSetting.isSystem,
                    isActive: userSetting?.isActive ?? true,
                    isCustomized: !!userSetting,
                    options: systemSetting.options
                };

                return flattenedSetting;
            });

            // Apply setting key filter if provided
            const filteredSettings = query.settingKey
                ? mergedSettings.filter(setting => setting.key === query.settingKey)
                : mergedSettings;

            // Group settings by category
            const groupedSettings = filteredSettings.reduce((acc, setting) => {
                const categoryId = setting.category;
                if (!acc[categoryId]) {
                    acc[categoryId] = {
                        category: categoryId,
                        settings: []
                    };
                }
                acc[categoryId].settings.push(setting);
                return acc;
            }, {} as Record<string, { category: string; settings: any[] }>);

            // Convert grouped settings to array
            const settingResult = Object.values(groupedSettings);

            return {
                result: {
                    items: settingResult,
                    total: filteredSettings.length
                },
                message: "User settings retrieved successfully"
            };
        } catch (error) {
            this.logger.error(
                `Error in findAllUserSettings for user ${userId}: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException('Error retrieving user settings');
        }
    }

    async resetAllSettings(userId: string): Promise<ResponseType<any>> {
        try {
            // Start transaction
            const session = await this.connection.startSession();
            let result;

            try {
                await session.withTransaction(async () => {
                    // Delete all user settings by setting empty settings object
                    result = await this.userSettingModel.findOneAndUpdate(
                        { user: userId },
                        { $set: { settings: {} } },
                        {
                            new: true,
                            session
                        }
                    );

                    // If no document exists, create one with empty settings
                    if (!result) {
                        result = await this.userSettingModel.create([{
                            user: userId,
                            settings: {}
                        }], { session });
                        result = result[0];
                    }
                });
            } finally {
                await session.endSession();
            }

            // Clear cache
            await this.cacheManager.del(this.getCacheKey(userId));

            // Get default settings to return in response
            const defaultSettings = await this.findAllUserSettings(userId, {});

            return {
                result: defaultSettings.result,
                message: "All settings have been reset to default values"
            };
        } catch (error) {
            this.logger.error(
                `Error in resetAllSettings for user ${userId}: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException('Error resetting user settings');
        }
    }

    async getUserSettingsSystem(userId: string) {
        try {
            // Find user's settings document
            const userSettingsDoc = await this.userSettingModel
                .findOne({ user: userId })
                .lean()
                .exec();
    
            // Helper function to get user setting value (same as in findAllUserSettings method)
            const getUserSetting = (settingKey: string): ISettingValue | undefined => {
                // First try direct key match
                const directSetting = userSettingsDoc?.settings?.[settingKey];
                if (directSetting && 'value' in directSetting) {
                    return directSetting as ISettingValue;
                }
    
                // Try hierarchical path
                const parts = settingKey.split('.');
                let current: any = userSettingsDoc?.settings;
    
                for (const part of parts) {
                    current = current?.[part];
                    if (!current) break;
                }
    
                // Check if the final value matches ISettingValue structure
                if (current && typeof current === 'object' && 'value' in current) {
                    return {
                        value: current.value,
                        isActive: current.isActive ?? true,
                        isCustomized: true
                    };
                }
    
                return undefined;
            };
    
            // Retrieve specific settings using the system settings service
            const languageSetting = await this.settingsService.findByKey('language.user_interface');
            const themeSetting = await this.settingsService.findByKey('appearance.theme');
    
            // Get user's specific settings or use default values
            const userLanguage = getUserSetting('language.user_interface')?.value ?? 
                                 languageSetting?.value?.default ?? 'vi';
            const userTheme = getUserSetting('appearance.theme')?.value ?? 
                              themeSetting?.value?.default ?? 'light';
    
            return {
                language: userLanguage,
                theme: userTheme
            };
        } catch (error) {
            return {
                language: 'vi',
                theme: 'light'
            };
        }
    }

    private async validateSettingValue(setting: any, value: any): Promise<void> {
        try {
            // Basic type validation
            switch (setting.dataType) {
                case 'NUMBER':
                    if (typeof value !== 'number') {
                        throw new BadRequestException('Value must be a number');
                    }
                    if (setting.options?.min !== undefined && value < setting.options.min) {
                        throw new BadRequestException(
                            `Value must be greater than or equal to ${setting.options.min}`
                        );
                    }
                    if (setting.options?.max !== undefined && value > setting.options.max) {
                        throw new BadRequestException(
                            `Value must be less than or equal to ${setting.options.max}`
                        );
                    }
                    break;

                case 'BOOLEAN':
                    if (typeof value !== 'boolean') {
                        throw new BadRequestException('Value must be a boolean');
                    }
                    break;

                case 'STRING':
                    if (typeof value !== 'string') {
                        throw new BadRequestException('Value must be a string');
                    }
                    if (setting.options?.minLength && value.length < setting.options.minLength) {
                        throw new BadRequestException(
                            `Value must be at least ${setting.options.minLength} characters long`
                        );
                    }
                    if (setting.options?.maxLength && value.length > setting.options.maxLength) {
                        throw new BadRequestException(
                            `Value must be no more than ${setting.options.maxLength} characters long`
                        );
                    }
                    if (setting.options?.pattern) {
                        const regex = new RegExp(setting.options.pattern);
                        if (!regex.test(value)) {
                            throw new BadRequestException('Value does not match required pattern');
                        }
                    }
                    break;

                case 'ARRAY':
                    if (!Array.isArray(value)) {
                        throw new BadRequestException('Value must be an array');
                    }
                    if (setting.options?.minItems && value.length < setting.options.minItems) {
                        throw new BadRequestException(
                            `Array must contain at least ${setting.options.minItems} items`
                        );
                    }
                    if (setting.options?.maxItems && value.length > setting.options.maxItems) {
                        throw new BadRequestException(
                            `Array must contain no more than ${setting.options.maxItems} items`
                        );
                    }
                    // Validate array items if itemType is specified
                    if (setting.options?.itemType) {
                        for (const item of value) {
                            await this.validateSettingValue(
                                { dataType: setting.options.itemType },
                                item
                            );
                        }
                    }
                    break;

                case 'OBJECT':
                    if (typeof value !== 'object' || Array.isArray(value) || value === null) {
                        throw new BadRequestException('Value must be an object');
                    }
                    // Validate required fields
                    if (setting.options?.required) {
                        for (const field of setting.options.required) {
                            if (!(field in value)) {
                                throw new BadRequestException(`Missing required field: ${field}`);
                            }
                        }
                    }
                    // Validate field types if specified
                    if (setting.options?.properties) {
                        for (const [key, fieldType] of Object.entries(setting.options.properties)) {
                            if (key in value) {
                                await this.validateSettingValue(
                                    { dataType: fieldType },
                                    value[key]
                                );
                            }
                        }
                    }
                    break;

                case 'ENUM':
                    if (!setting.options?.enum || !Array.isArray(setting.options.enum)) {
                        throw new BadRequestException('Invalid enum configuration');
                    }
                    if (!setting.options.enum.includes(value)) {
                        throw new BadRequestException(
                            `Value must be one of: ${setting.options.enum.join(', ')}`
                        );
                    }
                    break;

                case 'DATE':
                    const date = new Date(value);
                    if (isNaN(date.getTime())) {
                        throw new BadRequestException('Value must be a valid date');
                    }
                    if (setting.options?.minDate) {
                        const minDate = new Date(setting.options.minDate);
                        if (date < minDate) {
                            throw new BadRequestException(
                                `Date must be after ${minDate.toISOString()}`
                            );
                        }
                    }
                    if (setting.options?.maxDate) {
                        const maxDate = new Date(setting.options.maxDate);
                        if (date > maxDate) {
                            throw new BadRequestException(
                                `Date must be before ${maxDate.toISOString()}`
                            );
                        }
                    }
                    break;

                case 'EMAIL':
                    if (typeof value !== 'string') {
                        throw new BadRequestException('Value must be a string');
                    }
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        throw new BadRequestException('Value must be a valid email address');
                    }
                    break;

                case 'URL':
                    if (typeof value !== 'string') {
                        throw new BadRequestException('Value must be a string');
                    }
                    try {
                        new URL(value);
                    } catch {
                        throw new BadRequestException('Value must be a valid URL');
                    }
                    break;
                case 'SELECT':
                    if (typeof value !== 'string') {
                        throw new BadRequestException('Value must be a string for SELECT type');
                    }

                    // Check if options array exists
                    if (!setting.options || !Array.isArray(setting.options)) {
                        throw new BadRequestException('SELECT type requires an array of options');
                    }

                    // Validate that the value is one of the available options
                    if (!setting.options.includes(value)) {
                        throw new BadRequestException(
                            `Value must be one of: ${setting.options.join(', ')}`
                        );
                    }
                    break;
                default:
                    throw new BadRequestException(`Unsupported data type: ${setting.dataType}`);
            }

            // Validate against available values if specified
            if (setting.options?.availableValues && !setting.options.availableValues.includes(value)) {
                throw new BadRequestException(
                    `Value must be one of: ${setting.options.availableValues.join(', ')}`
                );
            }

            // Custom validation if specified
            if (setting.options?.validate) {
                try {
                    const customValidation = new Function('value', setting.options.validate);
                    const isValid = customValidation(value);

                    if (!isValid) {
                        throw new BadRequestException('Value failed custom validation');
                    }
                } catch (error) {
                    throw new BadRequestException(
                        `Custom validation error: ${error.message}`
                    );
                }
            }

        } catch (error) {
            this.logger.error(
                `Validation error for setting type ${setting.dataType}: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

}