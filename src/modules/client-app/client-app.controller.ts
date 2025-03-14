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
import { CreateClientAppDto, UpdateClientAppDto } from './client-app.dto';
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
    async create(@Body() createClientAppDto: CreateClientAppDto) {
        return await this.clientAppService.create(createClientAppDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all client applications with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'sort', required: false, type: String })
    @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
    async findAll(
        @Query('page') page?: number,
        @Query('pageSize') pageSize?: number,
        @Query('search') search?: string,
        @Query('sort') sort?: string,
        @Query('includeInactive') includeInactive?: boolean
    ) {
        return await this.clientAppService.findAll({
            page: page ? Number(page) : 1,
            pageSize: pageSize ? Number(pageSize) : 10,
            search,
            sort,
            includeInactive: includeInactive === true
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a client application by ID' })
    async findOne(@Param('id') id: string) {
        return await this.clientAppService.findById(id);
    }

    @Get('client/:clientId')
    @ApiOperation({ summary: 'Get a client application by client ID' })
    async findByClientId(@Param('clientId') clientId: string) {
        return await this.clientAppService.findByClientId(clientId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a client application' })
    async update(@Param('id') id: string, @Body() updateClientAppDto: UpdateClientAppDto) {
        return await this.clientAppService.update(id, updateClientAppDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a client application' })
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string) {
        return await this.clientAppService.remove(id);
    }

    @Post('regenerate-secret')
    @ApiOperation({ summary: 'Regenerate client secret' })
    async regenerateSecret(@Body() regenerateClientSecretDto: any) {
        return await this.clientAppService.regenerateClientSecret(regenerateClientSecretDto.clientId);
    }
}