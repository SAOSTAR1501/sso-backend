import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Setting, SettingDocument } from './settings.schema';
import { FilterQuery, Model } from 'mongoose';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { QuerySettingDto } from './dto/query-setting.dto';
import { CategoriesService } from '../setting-category/setting-category.service';
import { initialSettings } from './data';
import { QueryUserSettingDto } from '../user-settings/dto/query-user-settings.dto';

@Injectable()
export class SettingsService {
    constructor(
        @InjectModel(Setting.name)
        private settingModel: Model<SettingDocument>,
        private readonly categoriesService: CategoriesService,
    ) { }

    async createInitialSettings(): Promise<Setting[]> {
        const settings = [];
        for (const setting of initialSettings) {
            try {
                const created = await this.create(setting);
                settings.push(created);
            } catch (error) {
                console.error(`Error creating setting ${setting.key}:`, error.message);
            }
        }
        return settings;
    }

    async create(createSettingDto: CreateSettingDto): Promise<Setting> {
        // Verify category exists
        await this.categoriesService.findOne(createSettingDto.category.toString());

        const created = new this.settingModel(createSettingDto);
        return created.save();
    }

    async findOne(id: string): Promise<Setting> {
        const setting = await this.settingModel
            .findById(id)
            .populate('category')
            .exec();

        if (!setting) {
            throw new NotFoundException(`Setting with ID ${id} not found`);
        }
        return setting;
    }

    async findByKey(key: string): Promise<Setting> {
        const setting = await this.settingModel
            .findOne({ key })
            .populate('category')
            .exec();

        if (!setting) {
            throw new NotFoundException(`Setting with key ${key} not found`);
        }
        return setting;
    }

    async update(id: string, updateSettingDto: UpdateSettingDto): Promise<Setting> {
        if (updateSettingDto.category) {
            await this.categoriesService.findOne(updateSettingDto.category.toString());
        }

        const updated = await this.settingModel
            .findByIdAndUpdate(id, updateSettingDto, { new: true })
            .populate('category')
            .exec();

        if (!updated) {
            throw new NotFoundException(`Setting with ID ${id} not found`);
        }
        return updated;
    }

    async remove(id: string): Promise<Setting> {
        const deleted = await this.settingModel
            .findByIdAndDelete(id)
            .populate('category')
            .exec();

        if (!deleted) {
            throw new NotFoundException(`Setting with ID ${id} not found`);
        }
        return deleted;
    }

    async findAll(query: QuerySettingDto): Promise<{ items: Setting[]; total: number }> {
        const { search, key, category, isActive, isSystem, page = 0, pageSize = 10 } = query;

        const filter: FilterQuery<Setting> = {};

        if (key) {
            filter.key = key;
        }

        if (category) {
            filter.category = category;
        }

        if (typeof isActive === 'boolean') {
            filter.isActive = isActive;
        }

        if (typeof isSystem === 'boolean') {
            filter.isSystem = isSystem;
        }

        if (search) {
            filter.$or = [
                { key: new RegExp(search, 'i') },
                { 'label.en': new RegExp(search, 'i') },
                { 'label.vi': new RegExp(search, 'i') }
            ];
        }

        const [items, total] = await Promise.all([
            this.settingModel
                .find(filter)
                .populate('category')
                .skip(page * pageSize)
                .limit(pageSize)
                .exec(),
            this.settingModel.countDocuments(filter)
        ]);

        return { items, total };
    }

    async findAllAvailable(query?: QueryUserSettingDto): Promise<Setting[]> {
        // Build filter
        const filter: FilterQuery<Setting> = {
            isActive: true
        };

        if (query) {
            if (query.setting) {
                filter._id = query.setting;
            }

            if (query.category) {
                filter.category = query.category;
            }

            if (typeof query.isActive === 'boolean') {
                filter.isActive = query.isActive;
            }
        }

        // Fetch settings with filter
        const settings = await this.settingModel
            .find(filter)
            // .populate('category')
            .sort({ 'category.order': 1, key: 1 })
            .exec();

        return settings;
    }
}