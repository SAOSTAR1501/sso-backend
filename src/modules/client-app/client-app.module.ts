import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientAppService } from './client-app.service';
import { ClientAppController } from './client-app.controller';
import { ClientApp, ClientAppSchema } from './client-app.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ClientApp.name, schema: ClientAppSchema }
        ]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get('JWT_ACCESS_EXPIRES'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [ClientAppController],
    providers: [ClientAppService],
    exports: [ClientAppService],
})
export class ClientAppModule { }