import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesController } from './setting-category.controller';
import { CategoriesService } from './setting-category.service';
import { SettingCategory, SettingCategorySchema } from './setting-category.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SettingCategory.name, schema: SettingCategorySchema }
        ])
    ],
    controllers: [CategoriesController],
    providers: [CategoriesService],
    exports: [CategoriesService]
})
export class SettingCategoryModule { }