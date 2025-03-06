import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClientAppService } from 'src/modules/client-app/client-app.service';

@Injectable()
export class DynamicCorsMiddleware implements NestMiddleware {
    constructor(private clientAppService: ClientAppService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const origin = req.headers.origin;

        if (!origin) {
            return next();
        }

        try {
            // Get all allowed origins from registered client applications
            const allowedOrigins = await this.clientAppService.getAllowedOrigins();

            // Check if the origin is allowed
            const isAllowed = this.checkIfOriginIsAllowed(origin, allowedOrigins);

            if (isAllowed) {
                // Set CORS headers
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            }

            // Handle preflight requests
            if (req.method === 'OPTIONS') {
                return res.sendStatus(200);
            }

            return next();
        } catch (error) {
            return next();
        }
    }

    private checkIfOriginIsAllowed(origin: string, allowedOrigins: string[]): boolean {
        // Exact match
        if (allowedOrigins.includes(origin)) {
            return true;
        }

        // Wildcard subdomain match
        return allowedOrigins.some(allowedOrigin => {
            if (allowedOrigin.startsWith('*.')) {
                const domain = allowedOrigin.substring(2);
                return origin.endsWith(domain) && origin.includes('.');
            }
            return false;
        });
    }
}