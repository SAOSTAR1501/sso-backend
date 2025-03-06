import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { ClientApp, ClientAppDocument } from './client-app.schema';
import { CreateClientAppDto, UpdateClientAppDto } from './client-app.dto';

@Injectable()
export class ClientAppService {
  constructor(
    @InjectModel(ClientApp.name) private clientAppModel: Model<ClientAppDocument>,
  ) {}

  /**
   * Generate a unique client ID
   */
  private generateClientId(): string {
    return `client_${uuidv4().replace(/-/g, '')}`;
  }

  /**
   * Generate a random client secret
   */
  private generateClientSecret(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create a new client application
   */
  async create(createClientAppDto: CreateClientAppDto): Promise<ClientApp> {
    const clientId = this.generateClientId();
    const clientSecret = this.generateClientSecret();

    const newClient = new this.clientAppModel({
      ...createClientAppDto,
      clientId,
      clientSecret,
    });

    return newClient.save();
  }

  /**
   * Find all client applications
   */
  async findAll(includeInactive = false): Promise<ClientApp[]> {
    const query = includeInactive ? {} : { isActive: true };
    return this.clientAppModel.find(query).exec();
  }

  /**
   * Find a client application by ID
   */
  async findById(id: string): Promise<ClientApp> {
    const client = await this.clientAppModel.findById(id).exec();
    if (!client) {
      throw new NotFoundException(`Client application with ID ${id} not found`);
    }
    return client;
  }

  /**
   * Find a client application by clientId
   */
  async findByClientId(clientId: string): Promise<ClientApp> {
    const client = await this.clientAppModel.findOne({ clientId }).exec();
    if (!client) {
      throw new NotFoundException(`Client application with client ID ${clientId} not found`);
    }
    return client;
  }

  /**
   * Update a client application
   */
  async update(id: string, updateClientAppDto: UpdateClientAppDto): Promise<ClientApp> {
    const existingClient = await this.clientAppModel
      .findByIdAndUpdate(id, updateClientAppDto, { new: true })
      .exec();
      
    if (!existingClient) {
      throw new NotFoundException(`Client application with ID ${id} not found`);
    }
    
    return existingClient;
  }

  /**
   * Delete a client application
   */
  async remove(id: string): Promise<void> {
    const result = await this.clientAppModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Client application with ID ${id} not found`);
    }
  }

  /**
   * Regenerate client secret
   */
  async regenerateClientSecret(clientId: string): Promise<{ clientSecret: string }> {
    const client = await this.clientAppModel.findOne({ clientId }).exec();
    if (!client) {
      throw new NotFoundException(`Client application with client ID ${clientId} not found`);
    }

    const clientSecret = this.generateClientSecret();
    client.clientSecret = clientSecret;
    await client.save();

    return { clientSecret };
  }

  /**
   * Validate if a redirect URL is allowed for a client
   */
  async validateRedirectUrl(clientId: string, redirectUrl: string): Promise<boolean> {
    try {
      const client = await this.findByClientId(clientId);
      
      if (!client.isActive) {
        return false;
      }
      
      return client.redirectUrls.some(url => redirectUrl.startsWith(url));
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if an origin is allowed for a client
   */
  async isOriginAllowed(clientId: string, origin: string): Promise<boolean> {
    try {
      const client = await this.findByClientId(clientId);
      
      if (!client.isActive) {
        return false;
      }
      
      return client.allowedOrigins.some(allowedOrigin => {
        // Exact match
        if (allowedOrigin === origin) {
          return true;
        }
        
        // Wildcard subdomain match
        if (allowedOrigin.startsWith('*.')) {
          const domain = allowedOrigin.substring(2);
          return origin.endsWith(domain) && origin.includes('.');
        }
        
        return false;
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify client credentials (for client_credentials grant type)
   */
  async verifyClientCredentials(clientId: string, clientSecret: string): Promise<boolean> {
    try {
      const client = await this.findByClientId(clientId);
      return client.isActive && client.clientSecret === clientSecret;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all registered frontend URLs (for CORS configuration)
   */
  async getAllowedOrigins(): Promise<string[]> {
    const clients = await this.clientAppModel.find({ isActive: true }).exec();
    return [...new Set(clients.flatMap(client => client.allowedOrigins))];
  }
}