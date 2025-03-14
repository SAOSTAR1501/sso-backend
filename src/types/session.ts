import 'express-session';

declare module 'express-session' {
  interface Session {
    authState: {
        redirectUri: string;
        timestamp: string;
        clientId: string;
        scope: string;
        state: string;
        userId?: string;
    }
  }
}
