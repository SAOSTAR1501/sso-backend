import { Injectable } from '@nestjs/common';
import { ClientAppService } from './client-app.service';

@Injectable()
export class ClientAppValidator {
    constructor(private readonly clientAppService: ClientAppService) { }

    async validateRedirectUrl(clientId: string, redirectUrl: string): Promise<boolean> {
        return await this.clientAppService.validateRedirectUrl(clientId, redirectUrl);
    }

    async isOriginAllowed(clientId: string, origin: string): Promise<boolean> {
        return await this.clientAppService.isOriginAllowed(clientId, origin);
    }

    async verifyClientCredentials(clientId: string, clientSecret: string): Promise<boolean> {
        return await this.clientAppService.verifyClientCredentials(clientId, clientSecret);
    }

    async getAllowedRedirectUrls(clientId: string): Promise<string[]> {
        const client = await this.clientAppService.findByClientId(clientId);
        return client.redirectUrls;
    }

    async findClientIdFromOrigin(origin: string): Promise<string | null> {
        if (!origin) {
            return null;
        }

        // Remove protocol
        const hostname = new URL(origin).hostname;

        // Find all active clients
        const clients = await this.clientAppService.findAll(false);

        // Find a client that matches this origin
        for (const client of clients) {
            // Check exact match on frontend URL
            const frontendHostname = new URL(client.frontendUrl).hostname;
            if (frontendHostname === hostname) {
                return client.clientId;
            }

            // Check allowed origins
            const isAllowed = client.allowedOrigins.some(allowedOrigin => {
                if (allowedOrigin.startsWith('*.')) {
                    const domain = allowedOrigin.substring(2);
                    return hostname.endsWith(domain) && hostname.includes('.');
                }
                return new URL(allowedOrigin).hostname === hostname;
            });

            if (isAllowed) {
                return client.clientId;
            }
        }

        return null;
    }
}