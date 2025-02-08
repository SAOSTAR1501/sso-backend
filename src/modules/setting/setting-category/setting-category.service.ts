import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SettingCategory, CategoryDocument } from './setting-category.schema';
import { FilterQuery, Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-setting-cateogory.dto';
import { UpdateCategoryDto } from './dto/update-setting-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(SettingCategory.name)
        private categoryModel: Model<CategoryDocument>,
    ) { }

    async create(createCategoryDto: CreateCategoryDto): Promise<SettingCategory> {
        const created = new this.categoryModel(createCategoryDto);
        return created.save();
    }

    async findOne(id: string): Promise<SettingCategory> {
        const category = await this.categoryModel.findById(id).exec();
        if (!category) {
            throw new NotFoundException(`SettingCategory with ID ${id} not found`);
        }
        return category;
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<SettingCategory> {
        const updated = await this.categoryModel
            .findByIdAndUpdate(id, updateCategoryDto, { new: true })
            .exec();
        if (!updated) {
            throw new NotFoundException(`SettingCategory with ID ${id} not found`);
        }
        return updated;
    }

    async remove(id: string): Promise<SettingCategory> {
        const deleted = await this.categoryModel.findByIdAndDelete(id).exec();
        if (!deleted) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return deleted;
    }

    async findAll(query: QueryCategoryDto): Promise<{ items: SettingCategory[]; total: number }> {
        const { search, code, isActive, isSystem, page = 0, pageSize = 10 } = query;

        const filter: FilterQuery<SettingCategory> = {};

        if (code) {
            filter.code = code;
        }

        if (typeof isActive === 'boolean') {
            filter.isActive = isActive;
        }

        if (typeof isSystem === 'boolean') {
            filter.isSystem = isSystem;
        }

        if (search) {
            filter.$or = [
                { code: new RegExp(search, 'i') },
                { 'name.en': new RegExp(search, 'i') },
                { 'name.vi': new RegExp(search, 'i') }
            ];
        }

        const [items, total] = await Promise.all([
            this.categoryModel
                .find(filter)
                .sort({ order: 1 })
                .skip(page * pageSize)
                .limit(pageSize)
                .exec(),
            this.categoryModel.countDocuments(filter)
        ]);

        return { items, total };
    }
}
