// src/modules/auth/interfaces/oauth.interface.ts
// Mở rộng interface hiện tại

export interface GoogleUser {
    email: string;
    fullName: string;
    picture: string;
    accessToken: string;
    refreshToken: string;
    redirectUri?: string;
    clientId?: string;
}

export interface FacebookUser {
    email: string;
    fullName: string;
    picture: string;
    accessToken: string;
    refreshToken: string;
    facebookId: string;
    redirectUri?: string;
    clientId?: string;
}

export interface OAuthUser {
    id?: string;
    email: string;
    fullName: string;
    picture?: string;
    role?: string;
    provider: 'google' | 'facebook' | 'local';
    redirectUri?: string;
    clientId?: string;
}

export interface TokenPayload {
    _id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    role: string;
    clientId?: string;
    scope?: string;
    iss?: string; // Issuer - Identity Provider URL
    sub?: string; // Subject - User ID
    aud?: string; // Audience - Client ID
    exp?: number; // Expiration Time
    iat?: number; // Issued At
    jti?: string; // JWT ID - Unique identifier for the token
}