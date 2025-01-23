import 'express-session';

declare module 'express-session' {
  interface Session {
    authState: {
        redirectUri: string;
        timestamp: string;
    }
  }
}
