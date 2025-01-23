import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { getLangFromRequest } from 'src/helpers/get-lang';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
    constructor(private readonly i18n: I18nService) { }

    async catch(exception: BadRequestException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const exceptionResponse: any = exception.getResponse();

        const lang = getLangFromRequest(request) || 'vi';
        const translatedMessage = await this.getTranslatedMessage(exceptionResponse, lang);

        response.status(status).json({
            success: false,
            statusCode: status,
            message: translatedMessage,
            error: exceptionResponse.error || 'Bad Request',
        });
    }

    private async getTranslatedMessage(exceptionResponse: any, lang: string): Promise<string> {
        if (typeof exceptionResponse.message === 'string') {
            return this.translateSimpleMessage(exceptionResponse.message, lang);
        }

        if (Array.isArray(exceptionResponse.message)) {
            return this.translateArrayMessage(exceptionResponse.message, lang);
        }

        return 'An unknown error occurred';
    }

    private async translateSimpleMessage(message: string, lang: string): Promise<string> {
        if (typeof message === 'string') {
            try {
                const [translationKey, args] = message.split('|');
                const parsedArgs = args ? JSON.parse(args) : undefined;

                return this.i18n.translate(translationKey, {
                    lang,
                    args: parsedArgs,
                });
            } catch (e) {
                console.error('Error parsing message for translation:', e);
                return message;
            }
        }

        return message;
    }

    private async translateArrayMessage(messages: any[], lang: string): Promise<string> {
        const firstError = messages[0];
        if (firstError && firstError.constraints) {
            // Trường hợp có các constraints
            return this.translateConstraintMessage(firstError, lang);
        }

        return this.translateSimpleMessage(firstError, lang);
    }

    private async translateConstraintMessage(error: any, lang: string): Promise<string> {
        const firstConstraintKey = Object.keys(error.constraints)[0];
        const firstConstraintMessage = error.constraints[firstConstraintKey];

        if (typeof firstConstraintMessage === 'string') {
            const [translationKey, args] = firstConstraintMessage.split('|');
            const parsedArgs = args ? JSON.parse(args) : undefined;

            return this.i18n.translate(translationKey, {
                lang,
                args: parsedArgs,
            });
        }

        return `Invalid constraint: ${firstConstraintKey}`;
    }
}