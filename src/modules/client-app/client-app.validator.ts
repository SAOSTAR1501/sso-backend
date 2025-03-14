// src/modules/client-app/client-app.validator.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientApp } from './client-app.schema';

@Injectable()
export class ClientAppValidator {
  constructor(
    @InjectModel(ClientApp.name) private clientAppModel: Model<ClientApp>
  ) {}

  /**
   * Verify client credentials (client_id and client_secret)
   * @param clientId The client ID
   * @param clientSecret The client secret
   */
  async verifyClientCredentials(clientId: string, clientSecret: string): Promise<boolean> {
    const clientApp = await this.clientAppModel.findOne({ 
      clientId,
      active: true
    }).exec();
    
    if (!clientApp) {
      return false;
    }
    
    return clientApp.clientSecret === clientSecret;
  }

  /**
   * Validate if a redirect URL is allowed for a specific client
   * @param clientId The client ID
   * @param redirectUrl The redirect URL to validate
   */
  async validateRedirectUrl(clientId: string, redirectUrl: string): Promise<boolean> {
    const clientApp = await this.clientAppModel.findOne({ 
      clientId,
      active: true
    }).exec();
    
    if (!clientApp) {
      return false;
    }
    
    try {
      const redirectUri = new URL(redirectUrl);
      
      // Check if the URL is in the allowed list
      return clientApp.redirectUris.some(uri => {
        try {
          const allowedUri = new URL(uri);
          
          // Check if the hostname and protocol match
          if (redirectUri.hostname !== allowedUri.hostname || 
              redirectUri.protocol !== allowedUri.protocol) {
            return false;
          }
          
          // If the allowed URI has a path, the redirect URI must start with it
          if (allowedUri.pathname !== '/' && !redirectUri.pathname.startsWith(allowedUri.pathname)) {
            return false;
          }
          
          return true;
        } catch (error) {
          return false;
        }
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a client app by client ID
   * @param clientId The client ID
   */
  async getClientApp(clientId: string): Promise<ClientApp | null> {
    return this.clientAppModel.findOne({ 
      clientId,
      active: true
    }).exec();
  }

  /**
   * Get all active client apps
   */
  async getAllActiveClients(): Promise<ClientApp[]> {
    return this.clientAppModel.find({ active: true }).exec();
  }
}