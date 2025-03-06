import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { CreateClientAppDto, RegenerateClientSecretDto, UpdateClientAppDto } from './client-app.dto';
import { ClientAppService } from './client-app.service';
import { AdminGuard } from '../auth/guard/admin.guard';

@ApiTags('Client Applications')
@Controller('admin/client-apps')
@ApiBearerAuth()
@UseGuards(AdminGuard)
export class ClientAppController {
    constructor(private readonly clientAppService: ClientAppService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new client application' })
    create(@Body() createClientAppDto: CreateClientAppDto) {
        return this.clientAppService.create(createClientAppDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all client applications' })
    @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
    findAll(@Query('includeInactive') includeInactive?: boolean) {
        return this.clientAppService.findAll(includeInactive === true);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a client application by ID' })
    findOne(@Param('id') id: string) {
        return this.clientAppService.findById(id);
    }

    @Get('client/:clientId')
    @ApiOperation({ summary: 'Get a client application by client ID' })
    findByClientId(@Param('clientId') clientId: string) {
        return this.clientAppService.findByClientId(clientId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a client application' })
    update(@Param('id') id: string, @Body() updateClientAppDto: UpdateClientAppDto) {
        return this.clientAppService.update(id, updateClientAppDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a client application' })
    @HttpCode(HttpStatus.OK)
    remove(@Param('id') id: string) {
        return this.clientAppService.remove(id);
    }

    @Post('regenerate-secret')
    @ApiOperation({ summary: 'Regenerate client secret' })
    regenerateSecret(@Body() regenerateClientSecretDto: RegenerateClientSecretDto) {
        return this.clientAppService.regenerateClientSecret(regenerateClientSecretDto.clientId);
    }
}