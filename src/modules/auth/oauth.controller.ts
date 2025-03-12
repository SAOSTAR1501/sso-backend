// src/modules/auth/oauth.controller.ts
import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Post,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UseGuards
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../../decorators/public.decorator';
import { ClientAppValidator } from '../client-app/client-app.validator';
import { ClientAppService } from '../client-app/client-app.service';
import { AuthService } from './auth.service';
import { LocalGuard } from './guard/local.guard';
import { randomBytes } from 'crypto';
import { IUser } from 'src/interfaces/user.interface';

@ApiTags('OAuth')
@Controller('oauth')
export class OAuthController {
    // Lưu trữ tạm thời các authorization codes (trong production nên lưu vào Redis/DB)
    private authorizationCodes = new Map<string, {
        code: string,
        clientId: string,
        redirectUri: string,
        userId: string,
        scope: string,
        expiresAt: Date
    }>();

    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly clientAppValidator: ClientAppValidator,
        private readonly clientAppService: ClientAppService
    ) { }

    @Public()
    @Get('authorize')
    @ApiOperation({ summary: 'OAuth 2.0 authorization endpoint' })
    @ApiQuery({ name: 'response_type', required: true })
    @ApiQuery({ name: 'client_id', required: true })
    @ApiQuery({ name: 'redirect_uri', required: true })
    @ApiQuery({ name: 'scope', required: false })
    @ApiQuery({ name: 'state', required: false })
    async authorize(
        @Req() req: Request,
        @Res() res: Response,
        @Query('response_type') responseType: string,
        @Query('client_id') clientId: string,
        @Query('redirect_uri') redirectUri: string,
        @Query('scope') scope?: string,
        @Query('state') state?: string,
    ) {
        try {
            // Validate request parameters
            if (responseType !== 'code') {
                throw new BadRequestException('Invalid response_type, only "code" is supported');
            }

            // Validate client credentials
            const clientApp = await this.clientAppService.findByClientId(clientId);
            if (!clientApp) {
                throw new BadRequestException('Invalid client_id');
            }

            // Validate redirect URI
            const isValidRedirect = await this.clientAppValidator.validateRedirectUrl(
                clientId,
                redirectUri
            );

            if (!isValidRedirect) {
                throw new BadRequestException('Invalid redirect_uri');
            }

            // Validate scopes
            const requestedScopes = scope ? scope.split(' ') : ['profile', 'email'];
            const allowedScopes = clientApp.result.allowedScopes;

            // Check if all requested scopes are allowed
            const invalidScopes = requestedScopes.filter(s => !allowedScopes.includes(s));
            if (invalidScopes.length > 0) {
                throw new BadRequestException(`Invalid scopes: ${invalidScopes.join(', ')}`);
            }

            // Check if user is authenticated
            if (!req.cookies['accessToken']) {
                // Store current request in session
                req.session.authState = {
                    clientId: clientId,
                    redirectUri: redirectUri,
                    scope: scope,
                    state: state,
                    timestamp: new Date().toISOString()
                };

                // Redirect to login page
                return res.redirect(`/auth/login?redirect=${encodeURIComponent('/oauth/authorize')}`);
            }

            // Get user from token
            const token = req.cookies['accessToken'];
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });

            // Nếu client app không phải trusted app, hiển thị màn hình consent
            if (!clientApp.result.trusted) {
                // Store authorization data in session for consent form
                req.session.authState = {
                    clientId: clientId,
                    redirectUri: redirectUri,
                    scope: scope,
                    state: state,
                    userId: payload._id,
                    timestamp: new Date().toISOString()
                };

                // Redirect to consent page
                return res.redirect(`/auth/consent?scopes=${encodeURIComponent(scope || 'profile email')}`);
            }

            // Generate authorization code for trusted apps (bypass consent)
            const code = randomBytes(32).toString('hex');

            // Store authorization code
            this.authorizationCodes.set(code, {
                code,
                clientId: clientId,
                redirectUri: redirectUri,
                userId: payload._id,
                scope: requestedScopes.join(' '),
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            });

            // Prepare redirect URL
            const redirectUrl = new URL(redirectUri);
            redirectUrl.searchParams.append('code', code);

            // Add state if provided
            if (state) {
                redirectUrl.searchParams.append('state', state);
            }

            // Redirect to client app
            return res.redirect(redirectUrl.toString());

        } catch (error) {
            // Handle errors - redirect to error page for invalid requests
            const errorRedirectUrl = this.configService.get('ERROR_REDIRECT_URL');
            return res.redirect(`${errorRedirectUrl}?error=${encodeURIComponent(error.message)}`);
        }
    }

    @Public()
    @Post('consent')
    @ApiOperation({ summary: 'Handle user consent for OAuth authorization' })
    async handleConsent(
        @Body('approved') approved: boolean,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const authState = req.session.authState;

        if (!authState) {
            throw new BadRequestException('No authorization request found');
        }

        const { clientId, redirectUri, scope, state, userId } = authState;

        // Delete the session state
        delete req.session.authState;

        // If user denied the consent
        if (!approved) {
            const redirectUrl = new URL(redirectUri);
            redirectUrl.searchParams.append('error', 'access_denied');
            redirectUrl.searchParams.append('error_description', 'User denied the request');

            if (state) {
                redirectUrl.searchParams.append('state', state);
            }

            return res.redirect(redirectUrl.toString());
        }

        // If user approved, generate authorization code
        const code = randomBytes(32).toString('hex');
        const requestedScopes = scope ? scope.split(' ') : ['profile', 'email'];

        // Store authorization code
        this.authorizationCodes.set(code, {
            code,
            clientId,
            redirectUri,
            userId,
            scope: requestedScopes.join(' '),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        // Prepare redirect URL
        const redirectUrl = new URL(redirectUri);
        redirectUrl.searchParams.append('code', code);

        // Add state if provided
        if (state) {
            redirectUrl.searchParams.append('state', state);
        }

        // Redirect to client app
        return res.redirect(redirectUrl.toString());
    }

    @Public()
    @Post('token')
    @ApiOperation({ summary: 'OAuth 2.0 token endpoint' })
    async token(
        @Body('grant_type') grantType: string,
        @Body('code') code: string,
        @Body('redirect_uri') redirectUri: string,
        @Body('client_id') clientId: string,
        @Body('client_secret') clientSecret: string,
        @Body('refresh_token') refreshToken: string,
        @Res() res: Response
    ) {
        try {
            // Validate grant type
            if (grantType !== 'authorization_code' && grantType !== 'refresh_token') {
                throw new BadRequestException('Invalid grant_type');
            }

            // Validate client credentials
            const isValidClient = await this.clientAppValidator.verifyClientCredentials(
                clientId,
                clientSecret
            );

            if (!isValidClient) {
                throw new UnauthorizedException('Invalid client credentials');
            }

            // Handle authorization_code grant type
            if (grantType === 'authorization_code') {
                if (!code) {
                    throw new BadRequestException('Code is required');
                }

                // Validate code
                const codeData = this.authorizationCodes.get(code);
                if (!codeData) {
                    throw new BadRequestException('Invalid code');
                }

                // Check if code is expired
                if (codeData.expiresAt < new Date()) {
                    this.authorizationCodes.delete(code);
                    throw new BadRequestException('Code expired');
                }

                // Check if redirect_uri matches
                if (codeData.redirectUri !== redirectUri) {
                    throw new BadRequestException('Redirect URI mismatch');
                }

                // Check if client_id matches
                if (codeData.clientId !== clientId) {
                    throw new BadRequestException('Client ID mismatch');
                }

                // Get user from code
                const user = await this.authService.getCurrentUser(codeData.userId);
                if (!user) {
                    throw new BadRequestException('User not found');
                }

                // Generate tokens
                const tokens = await this.authService.generateOAuthTokens(
                    user,
                    clientId,
                    codeData.scope.split(' ')
                );

                // Delete used code
                this.authorizationCodes.delete(code);

                // Return tokens
                return {
                    result: {
                        access_token: tokens.accessToken,
                        token_type: 'Bearer',
                        expires_in: this.configService.get('JWT_ACCESS_EXPIRES_SECONDS', 3600),
                        refresh_token: tokens.refreshToken,
                        scope: codeData.scope
                    }
                };
            }

            // Handle refresh_token grant type
            if (grantType === 'refresh_token') {
                if (!refreshToken) {
                    throw new BadRequestException('Refresh token is required');
                }

                const tokens = await this.authService.refreshOAuthToken(
                    refreshToken,
                    clientId
                );

                return {
                    rssult: {
                        access_token: tokens.accessToken,
                        token_type: 'Bearer',
                        expires_in: this.configService.get('JWT_ACCESS_EXPIRES_SECONDS', 3600),
                        refresh_token: tokens.refreshToken
                    }
                };
            }

        } catch (error) {
            return res.status(error.status || 400).json({
                error: error.name || 'invalid_request',
                error_description: error.message
            });
        }
    }

    @Get('account')
    @UseGuards(LocalGuard)
    @ApiOperation({ summary: 'OAuth 2.0 userinfo endpoint' })
    async userinfo(@Req() req: Request) {
        const user = req['user'] as IUser;

        if (!user) {
            throw new UnauthorizedException('Invalid token');
        }

        // Format response according to OpenID Connect spec
        return {
            result:
            {
                sub: user.id, // Subject identifier
                email: user.email,
                email_verified: true, // Assuming all emails are verified
                name: user.fullName,
                picture: user.avatarUrl,
                // Other standard claims can be added here based on the requested scope
            }
        };
    }

    // Endpoint để kiểm tra trạng thái session
    @Get('check-session')
    @UseGuards(LocalGuard)
    @ApiOperation({ summary: 'Check session status across applications' })
    async checkSession(@Req() req: Request) {
        const user = req['user'] as IUser;

        if (!user) {
            throw new UnauthorizedException('Invalid token');
        }

        const sessionStatus = await this.authService.checkSessionStatus(user.id);

        return {
            result: {
                active: true,
                clientApps: sessionStatus
            }
        };
    }
}