import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export class EnvVars {
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN: string;

  @IsIn(['development', 'test', 'production'])
  NODE_ENV: string = 'development';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  AUTH_RATE_LIMIT_MAX: number = 10;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3600)
  AUTH_RATE_LIMIT_WINDOW_SECONDS: number = 60;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  TRIP_SLOT_HOURS: number = 2;
}

export function validateEnv(config: Record<string, unknown>): EnvVars {
  const parsed = plainToInstance(EnvVars, config, { enableImplicitConversion: true });
  const errors = validateSync(parsed, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors.map((error) => Object.values(error.constraints ?? {}).join(', ')).join(' | ');
    throw new Error(`Configuración de entorno inválida: ${details}`);
  }

  return parsed;
}
