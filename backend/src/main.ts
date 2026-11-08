import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { RequestHandler } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { FiltroExcepcionesGlobal } from './common/filtros/filtro-excepciones-global.js';
import { parseCorsOrigins } from './config/cors-origins.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  const helmetFn = helmet as unknown as (options?: unknown) => RequestHandler;
  app.use(helmetFn({ contentSecurityPolicy: false }));

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new FiltroExcepcionesGlobal());
  app.enableCors({
    origin: parseCorsOrigins(config.getOrThrow<string>('CORS_ORIGIN')),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NautiFlow API')
    .setDescription('Gestión de lanchas, viajes y reputación en el Delta del Tigre.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
    {
      customSiteTitle: 'NautiFlow API Docs',
      customCssUrl: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
      ],
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
      ],
    },
  );

  await app.listen(config.get<number>('PORT', 3000));
}

await bootstrap();
