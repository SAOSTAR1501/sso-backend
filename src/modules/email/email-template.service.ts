import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class EmailTemplateService {
    private templates: { [key: string]: HandlebarsTemplateDelegate } = {};

    constructor(private readonly configService: ConfigService) {
        this.initializeTemplates();
    }

    private async initializeTemplates() {
        // Register partials
        const headerPartial = await this.loadTemplate('header.partial.hbs');
        const footerPartial = await this.loadTemplate('footer.partial.hbs');
        Handlebars.registerPartial('header', headerPartial);
        Handlebars.registerPartial('footer', footerPartial);

        // Compile templates
        this.templates.passwordReset = Handlebars.compile(
            await this.loadTemplate('password-reset.hbs')
        );
        this.templates.emailVerification = Handlebars.compile(
            await this.loadTemplate('email-verification.hbs')
        );
        this.templates.welcome = Handlebars.compile(
            await this.loadTemplate('welcome.hbs')
        );
    }

    private async loadTemplate(templateName: string): Promise<string> {
        const templatePath = path.join(
            process.cwd(),
            'src',
            'modules',
            'email',
            'templates',
            templateName
        );
        return fs.readFile(templatePath, 'utf8');
    }

    async getPasswordResetTemplate(data: {
        otp: string;
        expiryMinutes: number;
    }): Promise<string> {
        const appName = this.configService.get<string>('APP_NAME', '1ai.one');
        const appUrl = this.configService.get<string>('APP_URL', 'https://1ai.one');

        return this.templates.passwordReset({
            ...data,
            appName,
            appUrl,
            year: new Date().getFullYear(),
        });
    }

    async getEmailVerificationTemplate(data: {
        otp: string;
        expiryMinutes: number;
    }): Promise<string> {
        const appName = this.configService.get<string>('APP_NAME', '1ai.one');
        const appUrl = this.configService.get<string>('APP_URL', 'https://1ai.one');

        return this.templates.emailVerification({
            ...data,
            appName,
            appUrl,
            year: new Date().getFullYear(),
        });
    }

    async getWelcomeTemplate(data: { name: string }): Promise<string> {
        const appName = this.configService.get<string>('APP_NAME', '1ai.one');
        const appUrl = this.configService.get<string>('APP_URL', 'https://1ai.one');

        return this.templates.welcome({
            ...data,
            appName,
            appUrl,
            year: new Date().getFullYear(),
        });
    }
}