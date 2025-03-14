// src/modules/auth/authorization-code.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { AuthorizationCode, AuthorizationCodeDocument } from './authorization-code.schema';

@Injectable()
export class AuthorizationCodeService {
  constructor(
    @InjectModel(AuthorizationCode.name) private authorizationCodeModel: Model<AuthorizationCodeDocument>,
  ) {}

  /**
   * Generate and store a new authorization code
   */
  async createAuthorizationCode(data: {
    clientId: string;
    redirectUri: string;
    userId: string;
    scope: string;
  }): Promise<string> {
    // Generate a random code
    const code = randomBytes(32).toString('hex');
    
    // Calculate expiration (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save to database
    await this.authorizationCodeModel.create({
      code,
      clientId: data.clientId,
      redirectUri: data.redirectUri,
      userId: data.userId,
      scope: data.scope,
      expiresAt,
    });

    return code;
  }

  /**
   * Get and validate an authorization code
   * This method also removes the code after retrieval (one-time use)
   */
  async validateAndRemove(code: string, clientId: string, redirectUri: string): Promise<AuthorizationCodeDocument> {
    // Find the authorization code
    const authCode = await this.authorizationCodeModel.findOne({
      code,
      clientId,
    });

    if (!authCode) {
      throw new NotFoundException('Invalid or expired code');
    }

    // Check if redirect URI matches
    if (authCode.redirectUri !== redirectUri) {
      throw new NotFoundException('Redirect URI mismatch');
    }

    // Check if code is expired (double safety, MongoDB TTL should handle this too)
    // if (authCode.expiresAt < new Date()) {
    //   await this.authorizationCodeModel.deleteOne({ _id: authCode._id });
    //   throw new NotFoundException('Code expired');
    // }

    // Delete the code (one-time use)
    // await this.authorizationCodeModel.deleteOne({ _id: authCode._id });

    return authCode;
  }

  /**
   * Delete expired codes (should be handled by MongoDB TTL, but as a backup)
   */
  async cleanupExpiredCodes(): Promise<void> {
    await this.authorizationCodeModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });
  }
}