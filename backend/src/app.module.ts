import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BoatsModule } from './boats/boats.module.js';
import { DocumentsModule } from './documents/documents.module.js';
import { EmptyLegsModule } from './empty-legs/empty-legs.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { OwnersModule } from './owners/owners.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { TripsModule } from './trips/trips.module.js';
import { UsersModule } from './users/users.module.js';
import { VerificationModule } from './verification/verification.module.js';
import { ZonesModule } from './zones/zones.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    OwnersModule,
    BoatsModule,
    ZonesModule,
    DocumentsModule,
    VerificationModule,
    TripsModule,
    ReviewsModule,
    EmptyLegsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
