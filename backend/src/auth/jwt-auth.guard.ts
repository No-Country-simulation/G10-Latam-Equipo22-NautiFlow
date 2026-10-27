import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from './types.js';
import { AuthService } from './auth.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookieToken = request.headers.cookie
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('nautiflow_session='))
      ?.slice('nautiflow_session='.length);
    const bearerToken = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const user = await this.authService.authenticateToken(cookieToken || bearerToken || '');

    if (!user) throw new UnauthorizedException('La sesión no es válida o expiró.');
    request.user = user;
    return true;
  }
}