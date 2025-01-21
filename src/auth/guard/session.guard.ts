// import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
// import { AuthService } from "../auth.service";

// @Injectable()
// export class SessionGuard implements CanActivate {
//     constructor(private authService: AuthService) { }

//     async canActivate(context: ExecutionContext): Promise<boolean> {
//         const request = context.switchToHttp().getRequest();
//         try {
//             await this.authService.validateSession(request.session);
//             return true;
//         } catch {
//             throw new UnauthorizedException();
//         }
//     }
// }