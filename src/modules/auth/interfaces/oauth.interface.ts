export interface GoogleUser {
    email: string;
    fullName: string;
    picture: string;
    accessToken: string;
    refreshToken: string;
    redirectUri?: string;
    clientId?: string;
}