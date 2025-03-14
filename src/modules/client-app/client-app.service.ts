import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ClientAppPaginationQueryDto, CreateClientAppDto, UpdateClientAppDto } from './client-app.dto';
import { ClientApp } from './client-app.schema';

@Injectable()
export class ClientAppService {
  constructor(
    @InjectModel(ClientApp.name) private clientAppModel: Model<ClientApp>,
  ) { }

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
  async create(createClientAppDto: CreateClientAppDto) {
    const clientId = this.generateClientId();
    const clientSecret = this.generateClientSecret();

    const newClient = new this.clientAppModel({
      ...createClientAppDto,
      clientId,
      clientSecret,
    });
    await newClient.save();

    return { result: newClient };
  }

  /**
   * Find all client applications
   */
  async findAll(options: ClientAppPaginationQueryDto) {
    const { page = 1, pageSize = 10, search, sort, includeInactive = false } = options;
    
    // Build the query
    const query: any = {};
    
    // Add active status filter
    if (!includeInactive) {
      query.active = true;
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { clientId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Build sort criteria
    const sortCriteria: any = {};
    if (sort) {
      if (sort.startsWith('-')) {
        sortCriteria[sort.substring(1)] = -1;
      } else {
        sortCriteria[sort] = 1;
      }
    } else {
      // Default sort by createdAt descending
      sortCriteria.createdAt = -1;
    }
    
    // Execute the query with pagination
    const items = await this.clientAppModel
      .find(query)
      .sort(sortCriteria)
      .skip(skip)
      .limit(pageSize)
      .exec();
    
    // Get total count for pagination
    const total = await this.clientAppModel.countDocuments(query).exec();
    
    // Calculate total pages
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      result: {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages
        }
      }
    };
  }


  /**
   * Find a client application by ID
   */
  async findById(id: string) {
    const client = await this.clientAppModel.findById(id).exec();
    if (!client) {
      throw new NotFoundException(`Client application with ID ${id} not found`);
    }
    return { result: client };
  }

  /**
   * Find a client application by clientId
   */
  async findByClientId(clientId: string) {
    console.log({ clientId, a: clientId })
    const client = await this.clientAppModel.findOne({ clientId }).exec();
    if (!client) {
      throw new NotFoundException(`Client application with client ID ${clientId} not found`);
    }
    return { result: client };
  }

  /**
   * Update a client application
   */
  async update(id: string, updateClientAppDto: UpdateClientAppDto) {
    const existingClient = await this.clientAppModel
      .findByIdAndUpdate(id, updateClientAppDto, { new: true })
      .exec();

    if (!existingClient) {
      throw new NotFoundException(`Client application with ID ${id} not found`);
    }

    return { result: existingClient };
  }

  /**
   * Delete a client application
   */
  async remove(id: string) {
    const result = await this.clientAppModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Client application with ID ${id} not found`);
    }

    return { success: true }
  }

  /**
   * Regenerate client secret
   */
  async regenerateClientSecret(clientId: string) {
    const client = await this.clientAppModel.findOne({ clientId }).exec();
    if (!client) {
      throw new NotFoundException(`Client application with client ID ${clientId} not found`);
    }

    const clientSecret = this.generateClientSecret();
    client.clientSecret = clientSecret;
    await client.save();

    return { result: clientSecret };
  }
}