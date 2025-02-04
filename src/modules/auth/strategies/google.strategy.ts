import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import { GoogleUser } from '../interfaces/oauth.interface';

// @Injectable()
// export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
//   constructor(
//     private configService: ConfigService,
//     private authService: AuthService,
//   ) {
//     super({
//       clientID: configService.get('GOOGLE_CLIENT_ID'),
//       clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
//       callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
//       scope: ['email', 'profile'],
//       state: true,
//       passReqToCallback: true 
//     });
//   }

//   async validate(
//     request: Request,
//     accessToken: string,
//     refreshToken: string,
//     profile: any,
//     done: VerifyCallback,
//   ): Promise<any> {
//     console.log('Query Parameters:', request.query);
//     const { name, emails, photos } = profile;
//     const user = {
//       email: emails[0].value,
//       fullName: name.givenName + ' ' + name.familyName,
//       picture: photos[0].value,
//       accessToken,
//       refreshToken,
//     };

//     done(null, user);
//   }
// }

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      state: true,
      passReqToCallback: true
    });
  }

  authenticate(req: Request, options?: any) {
    // Nếu có redirect_uri trong query, thêm vào state
    if (req.query.redirect_uri) {
      const state = encodeURIComponent(JSON.stringify({
        redirectUri: req.query.redirect_uri
      }));
      options = { ...options, state };
    }
    super.authenticate(req, options);
  }

  async validate(
    request: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    // Parse state để lấy redirect_uri
    let redirectUri = null;
    if (request.query.state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(request.query.state as string));
        redirectUri = stateData.redirectUri;
      } catch (error) {
        console.error('Error parsing state:', error);
      }
    }

    const user: GoogleUser = {
      email: emails[0].value,
      fullName: name.givenName + ' ' + name.familyName,
      picture: photos[0].value,
      accessToken,
      refreshToken,
      redirectUri
    };

    done(null, user);
  }
}