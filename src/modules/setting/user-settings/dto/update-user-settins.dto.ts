import { PickType } from '@nestjs/swagger';
import { CreateUserSettingDto } from './create-user-settings.dto';

export class UpdateUserSettingDto extends PickType(CreateUserSettingDto, [
    'value',
    'isActive'
] as const) { }