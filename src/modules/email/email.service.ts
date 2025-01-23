import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor(
        private readonly configService: ConfigService,
        private readonly emailTemplateService: EmailTemplateService,
    ) {
        this.initializeTransporter();
    }

    private async initializeTransporter() {
        // Cấu hình cụ thể cho Gmail
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASSWORD'),
            },
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        });

        try {
            await this.transporter.verify();
            this.logger.log('SMTP connection established successfully');
        } catch (error) {
            this.logger.error('Failed to establish SMTP connection:', error);
            // Log thêm thông tin để debug
            this.logger.error('SMTP Configuration:', {
                host: this.configService.get<string>('SMTP_HOST'),
                port: this.configService.get<number>('SMTP_PORT'),
                user: this.configService.get<string>('SMTP_USER')
            });
            throw error;
        }
    }

    async sendEmail(options: {
        to: string;
        subject: string;
        html: string;
        attachments?: any[];
    }): Promise<boolean> {
        try {
            const mailOptions = {
                from: `"${this.configService.get<string>('MAIL_FROM_NAME')}" <${this.configService.get<string>('MAIL_FROM_ADDRESS')}>`,
                ...options,
            };

            const info = await this.transporter.sendMail(mailOptions);

            this.logger.log(`Email sent successfully to: ${options.to}`);
            return true;
        } catch (error) {
            this.logger.error('Failed to send email:', error);
            throw error;
        }
    }

    async sendPasswordResetOtp(email: string, otp: string): Promise<boolean> {
        const html = await this.emailTemplateService.getPasswordResetTemplate({
            otp,
            expiryMinutes: 5,
        });

        return this.sendEmail({
            to: email,
            subject: 'Reset Your Password',
            html,
        });
    }

    async sendEmailVerificationOtp(email: string, otp: string): Promise<boolean> {
        const html = await this.emailTemplateService.getEmailVerificationTemplate({
            otp,
            expiryMinutes: 5,
        });

        return this.sendEmail({
            to: email,
            subject: 'Verify Your Email',
            html,
        });
    }

    async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
        const html = await this.emailTemplateService.getWelcomeTemplate({
            name,
        });

        return this.sendEmail({
            to: email,
            subject: 'Welcome to 1ai.one',
            html,
        });
    }
}