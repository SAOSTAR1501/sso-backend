import { Injectable } from "@nestjs/common";
import { Client } from "./client.interface";

// client.service.ts
@Injectable()
export class ClientService {
  private readonly clients: Client[] = [
    {
      id: 'client_id_1',
      secret: 'client_secret_1',
      name: 'Web App 1',
      redirectUris: ['http://localhost:5173/callback'],
      allowedScopes: ['openid', 'profile', 'email']
    }
  ];

  async findById(id: string): Promise<Client | undefined> {
    return this.clients.find(c => c.id === id);
  }
}