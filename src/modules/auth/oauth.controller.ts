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
import { AuthorizationCodeService } from './authorization-code/authorization-code.service';
import { OauthTokenDto } from './dto/oauth-token.dto';

@ApiTags('OAuth')
@Controller('oauth')
export class OAuthController {

    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly clientAppValidator: ClientAppValidator,
        private readonly clientAppService: ClientAppService,
        private readonly authorizationCodeService: AuthorizationCodeService
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
            console.log({ responseType, clientId, redirectUri, scope, state })
            // Validate request parameters
            if (responseType !== 'code') {
                throw new BadRequestException('Invalid response_type, only "code" is supported');
            }

            // Validate client credentials
            const clientApp = await this.clientAppService.findByClientId(clientId);
            if (!clientApp.result) {
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
                return res.redirect(`/api/auth/login?redirect=${encodeURIComponent('/oauth/authorize')}&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`);
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
            const code = await this.authorizationCodeService.createAuthorizationCode({
                clientId: clientId,
                redirectUri: redirectUri,
                userId: payload._id,
                scope: requestedScopes.join(' ')
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
            console.log({ error })
            // Handle errors - redirect to error page for invalid requests
            const errorRedirectUrl = this.configService.get('FRONTEND_SSO_URL');
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
        const requestedScopes = scope ? scope.split(' ') : ['profile', 'email'];

        // Store authorization code
        const code = await this.authorizationCodeService.createAuthorizationCode({
            clientId,
            redirectUri,
            userId,
            scope: requestedScopes.join(' ')
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
        @Body() body: OauthTokenDto,
        @Res() res: Response
    ) {
        try {
            // Validate grant type
            if (body.grantType !== 'authorization_code' && body.grantType !== 'refresh_token') {
                throw new BadRequestException('Invalid grant_type');
            }

            // Validate client credentials
            const isValidClient = await this.clientAppValidator.verifyClientCredentials(
                body.clientId,
                body.clientSecret
            );

            if (!isValidClient) {
                throw new UnauthorizedException('Invalid client credentials');
            }

            // Handle authorization_code grant type
            if (body.grantType === 'authorization_code') {
                if (!body.code) {
                    throw new BadRequestException('Code is required');
                }

                // Validate code
                const codeData = await this.authorizationCodeService.validateAndRemove(
                    body.code,
                    body.clientId,
                    body.redirectUri
                );

                // Get user from code
                const user = await this.authService.getCurrentUser(codeData.userId);
                if (!user) {
                    throw new BadRequestException('User not found');
                }
                // Generate tokens
                const tokens = await this.authService.generateOAuthTokens(
                    user,
                    body.clientId,
                    codeData.scope.split(' ')
                );

                // Return tokens
                return res.status(200).json({
                        access_token: tokens.accessToken,
                        refresh_token: tokens.refreshToken,
                })
            }

            // Handle refresh_token grant type
            if (body.grantType === 'refresh_token') {
                if (!body.refreshToken) {
                    throw new BadRequestException('Refresh token is required');
                }

                console.log({ body })

                const tokens = await this.authService.refreshOAuthToken(
                    body.refreshToken,
                    body.clientId
                );

                return res.status(200).json({
                    data: {
                        access_token: tokens.accessToken,
                        token_type: 'Bearer',
                        expires_in: this.configService.get('JWT_ACCESS_EXPIRES_SECONDS', 3600),
                        refresh_token: tokens.refreshToken
                    }
                })
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