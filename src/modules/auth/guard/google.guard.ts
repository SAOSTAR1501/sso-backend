// src/modules/auth/guards/google.guard.ts

import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable()
export class GoogleGuard extends AuthGuard('google') {
  constructor(private authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const redirectUri = request.query.redirect_uri;

    // Validate redirect_uri if present
    if (redirectUri && !this.authService.validateRedirectUrl(redirectUri)) {
      throw new UnauthorizedException('Invalid redirect URL');
    }

    // Store redirect URI in session if valid
    if (redirectUri) {
      request.session.authState = {
        redirectUri,
        timestamp: new Date().toISOString()
      };
    }

    // Call parent canActivate which handles Google authentication
    const result = (await super.canActivate(context)) as boolean | Promise<boolean> | Observable<boolean>;
    
    // Handle the result based on its type
    if (result instanceof Observable) {
      return await firstValueFrom(result);
    }
    
    return result as boolean;
  }

  // Override handleRequest to match the base class signature
  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Google authentication failed');
    }

    const request = context.switchToHttp().getRequest();
    
    // Check if this is the callback route
    if (request.url.includes('/auth/google/callback')) {
      // Restore redirect URI from session if available
      if (request.session?.authState?.redirectUri) {
        // Add redirectUri to the user object instead of request
        user.redirectUri = request.session.authState.redirectUri;
        
        // Clear the session state after use
        delete request.session.authState;
      }
    }

    return user;
  }
}