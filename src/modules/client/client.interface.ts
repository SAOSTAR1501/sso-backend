// client.interface.ts
export interface Client {
    id: string;
    secret: string;
    name: string;
    redirectUris: string[];
    allowedScopes: string[];
  }