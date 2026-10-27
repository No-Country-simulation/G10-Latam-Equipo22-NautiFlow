import { Module } from '@nestjs/common';
import { OwnersController } from './owners.controller.js';
import { OwnersService } from './owners.service.js';
import { VerificationController } from './verification.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  controllers: [OwnersController, VerificationController],
  imports: [AuthModule],
  providers: [OwnersService],
  exports: [OwnersService],
})
export class OwnersModule {}
