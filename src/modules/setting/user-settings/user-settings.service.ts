import {
    BadRequestException,
    Injectable,
    Inject,
    Logger,
    NotFoundException,
    InternalServerErrorException
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
import { Connection, FilterQuery, Model } from 'mongoose';
import { SettingsService } from '../settings/settings.service';
import { CreateUserSettingDto } from './dto/create-user-settings.dto';
import { QueryUserSettingDto } from './dto/query-user-settings.dto';
import { IUserSetting } from './user-settings.interface';
import { UserSetting, UserSettingDocument } from './user-settings.schema';
import { UpdateUserSettingDto } from './dto/update-user-settins.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ResponseType } from 'src/interfaces/response.interface';

@Injectable()
export class UserSettingsService {
    private readonly logger = new Logger(UserSettingsService.name);
    private readonly CACHE_TTL = 300000; // 5 minutes in milliseconds
    private readonly BATCH_SIZE = 100; // Batch size for bulk operations

    constructor(
        @InjectModel(UserSetting.name)
        private userSettingModel: Model<UserSettingDocument>,
        @InjectConnection() private connection: Connection,
        private readonly settingsService: SettingsService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }

    private getCacheKey(userId: string, settingId: string): string {
        return `user_setting:${userId}:${settingId}`;
    }

    async createOrUpdate(
        userId: string,
        createDto: CreateUserSettingDto
    ): Promise<UserSettingDocument> {
        try {
            // Verify setting exists and validate value
            const setting = await this.settingsService.findOne(createDto.setting);
            if (!setting) {
                throw new NotFoundException(`Setting ${createDto.setting} not found`);
            }

            await this.validateSettingValue(setting, createDto.value);

            // Start transaction
            const session = await this.connection.startSession();
            let result;

            try {
                await session.withTransaction(async () => {
                    // Find or create setting
                    const userSetting = await this.userSettingModel.findOneAndUpdate(
                        {
                            user: userId,
                            setting: createDto.setting
                        },
                        {
                            $set: {
                                value: createDto.value,
                                isActive: createDto.isActive ?? true
                            }
                        },
                        {
                            new: true,
                            upsert: true,
                            session,
                            populate: 'setting'
                        }
                    );

                    result = userSetting;
                });
            } finally {
                await session.endSession();
            }

            // Update cache
            await this.cacheManager.set(
                this.getCacheKey(userId, createDto.setting),
                result.toObject(),
                this.CACHE_TTL
            );

            return result;
        } catch (error) {
            this.logger.error(
                `Error in createOrUpdate for user ${userId}: ${error.message}`,
                error.stack
            );
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Error creating/updating user setting');
        }
    }

    async bulkUpdate(
        userId: string,
        settings: CreateUserSettingDto[]
    ): Promise<UserSettingDocument[]> {
        const session = await this.connection.startSession();
        try {
            let results: UserSettingDocument[] = [];

            await session.withTransaction(async () => {
                // Process in batches to avoid memory issues
                for (let i = 0; i < settings.length; i += this.BATCH_SIZE) {
                    const batch = settings.slice(i, i + this.BATCH_SIZE);

                    // Validate all settings in batch
                    await Promise.all(
                        batch.map(async (setting) => {
                            const settingConfig = await this.settingsService.findOne(setting.setting);
                            if (!settingConfig) {
                                throw new NotFoundException(`Setting ${setting.setting} not found`);
                            }
                            await this.validateSettingValue(settingConfig, setting.value);
                        })
                    );

                    const operations = batch.map(setting => ({
                        updateOne: {
                            filter: {
                                user: userId,
                                setting: setting.setting
                            },
                            update: {
                                $set: {
                                    value: setting.value,
                                    isActive: setting.isActive ?? true
                                }
                            },
                            upsert: true
                        }
                    }));

                    await this.userSettingModel.bulkWrite(operations, { session });
                }

                // Fetch updated documents
                results = await this.userSettingModel
                    .find({
                        user: userId,
                        setting: { $in: settings.map(s => s.setting) }
                    })
                    .populate('setting')
                    .session(session)
                    .exec();
            });

            // Update cache for all settings
            await Promise.all(
                results.map(setting =>
                    this.cacheManager.set(
                        this.getCacheKey(userId, setting.setting.toString()),
                        setting.toObject(),
                        this.CACHE_TTL
                    )
                )
            );

            return results;
        } catch (error) {
            this.logger.error(
                `Error in bulkUpdate for user ${userId}: ${error.message}`,
                error.stack
            );
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Error performing bulk update');
        } finally {
            await session.endSession();
        }
    }

    async findAll(
        userId: string,
        query: QueryUserSettingDto
    ): Promise<{ items: UserSettingDocument[]; total: number }> {
        try {
            const { setting, isActive, page = 0, pageSize = 10 } = query;
            const filter: FilterQuery<UserSetting> = { user: userId };

            if (setting) {
                filter.setting = setting;
            }

            if (typeof isActive === 'boolean') {
                filter.isActive = isActive;
            }

            const [items, total] = await Promise.all([
                this.userSettingModel
                    .find(filter)
                    .populate('setting')
                    .sort({ createdAt: -1 })
                    .skip(page * pageSize)
                    .limit(pageSize)
                    .exec(),
                this.userSettingModel.countDocuments(filter)
            ]);

            return { items, total };
        } catch (error) {
            this.logger.error(
                `Error in findAll for user ${userId}: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException('Error retrieving user settings');
        }
    }

    async update(
        userId: string,
        settingId: string,
        updateDto: UpdateUserSettingDto
    ): Promise<UserSettingDocument> {
        const session = await this.connection.startSession();
        try {
            let result;

            await session.withTransaction(async () => {
                const setting = await this.settingsService.findOne(settingId);
                if (!setting) {
                    throw new NotFoundException(`Setting ${settingId} not found`);
                }

                if (updateDto.value !== undefined) {
                    await this.validateSettingValue(setting, updateDto.value);
                }

                result = await this.userSettingModel.findOneAndUpdate(
                    { user: userId, setting: settingId },
                    { $set: updateDto },
                    { new: true, session, populate: 'setting' }
                );

                if (!result) {
                    throw new NotFoundException('User setting not found');
                }

                // Update cache
                await this.cacheManager.set(
                    this.getCacheKey(userId, settingId),
                    result.toObject(),
                    this.CACHE_TTL
                );
            });

            return result;
        } catch (error) {
            this.logger.error(
                `Error in update for user ${userId}, setting ${settingId}: ${error.message}`,
                error.stack
            );
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Error updating user setting');
        } finally {
            await session.endSession();
        }
    }

    async resetToDefault(
        userId: string,
        settingId: string
    ): Promise<UserSettingDocument> {
        try {
            const setting = await this.settingsService.findOne(settingId);
            if (!setting) {
                throw new NotFoundException(`Setting ${settingId} not found`);
            }

            return this.createOrUpdate(userId, {
                setting: settingId,
                value: setting.value.default
            });
        } catch (error) {
            this.logger.error(
                `Error in resetToDefault for user ${userId}, setting ${settingId}: ${error.message}`,
                error.stack
            );
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Error resetting user setting');
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

    async findAllUserSettings(userId: string, query: QueryUserSettingDto): Promise<ResponseType<any>> {
        // Get all available system settings with filters
        const availableSettings = await this.settingsService.findAllAvailable(query);

        // Build filter for user settings
        const userFilter: FilterQuery<UserSetting> = { user: userId };
        if (typeof query.isActive === 'boolean') {
            userFilter.isActive = query.isActive;
        }

        // Get all user settings
        const userSettings = await this.userSettingModel
            .find(userFilter)
            .populate({
                path: 'setting',
                populate: {
                    path: 'category'
                }
            })
            .lean()
            .exec();

        // Create a map of user settings for quick lookup
        const userSettingsMap = new Map(
            userSettings.map(userSetting => {
                const settingId = (userSetting.setting as any)?._id?.toString();
                return [settingId, userSetting];
            })
        );

        // Merge system settings with user settings
        const mergedSettings = availableSettings.map(systemSetting => {
            const systemSettingId = (systemSetting as any)?._id?.toString();
            const userSetting = userSettingsMap.get(systemSettingId);

            // If user has customized this setting, return user's value
            if (userSetting) {
                return {
                    _id: (userSetting as any)?._id,
                    setting: systemSetting,
                    value: userSetting.value,
                    isActive: userSetting.isActive,
                    isCustomized: true
                };
            }

            // If no user setting exists, return system default
            return {
                setting: systemSetting,
                value: systemSetting.value?.default,
                isActive: true,
                isCustomized: false
            };
        });

        // Group settings by category
        const groupedSettings = mergedSettings.reduce((acc, setting) => {
            const categoryId = (setting.setting.category as any)?._id?.toString();
            if (!acc[categoryId]) {
                acc[categoryId] = {
                    category: setting.setting.category,
                    settings: []
                };
            }
            acc[categoryId].settings.push(setting);
            return acc;
        }, {} as Record<string, any>);

        // Convert to array and sort by category order
        let settingResult = Object.values(groupedSettings).sort(
            (a, b) => (a.category?.order || 0) - (b.category?.order || 0)
        );

        // Calculate total items
        const total = mergedSettings.length;

        // Apply pagination if needed
        if (query.page !== undefined && query.pageSize !== undefined) {
            const startIdx = query.page * query.pageSize;
            let count = 0;
            let itemsToSkip = startIdx;

            settingResult = settingResult.reduce((acc: any[], group) => {
                const groupCopy = { ...group };

                if (count < query.pageSize) {
                    if (itemsToSkip >= group.settings.length) {
                        itemsToSkip -= group.settings.length;
                    } else {
                        groupCopy.settings = group.settings.slice(itemsToSkip, itemsToSkip + (query.pageSize - count));
                        count += groupCopy.settings.length;
                        itemsToSkip = 0;
                        if (groupCopy.settings.length > 0) {
                            acc.push(groupCopy);
                        }
                    }
                }

                return acc;
            }, []);
        }

        return {
            result: {
                items: settingResult,
                total
            },
            message: "User settings retrieved successfully"
        };
    }
}