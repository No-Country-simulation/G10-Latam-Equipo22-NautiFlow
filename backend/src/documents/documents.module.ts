import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { AdminDocumentsController } from './verification.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [DocumentsController, AdminDocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
