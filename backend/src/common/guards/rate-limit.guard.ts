import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

interface RateWindow {
  hits: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly windows = new Map<string, RateWindow>();

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const max = this.config.get<number>('AUTH_RATE_LIMIT_MAX') ?? 10;
    const windowMs = (this.config.get<number>('AUTH_RATE_LIMIT_WINDOW_SECONDS') ?? 60) * 1000;
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.ip ?? 'unknown';
    const now = Date.now();

    if (this.windows.size > 5000) {
      this.sweep(now);
    }

    const current = this.windows.get(key);
    if (!current || current.resetAt <= now) {
      this.windows.set(key, { hits: 1, resetAt: now + windowMs });
      return true;
    }

    current.hits += 1;
    if (current.hits > max) {
      throw new HttpException(
        'Demasiadas solicitudes. Intentá de nuevo en unos segundos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private sweep(now: number) {
    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) {
        this.windows.delete(key);
      }
    }
  }
}
