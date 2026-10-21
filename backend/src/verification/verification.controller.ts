import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Bandeja del admin para aprobar o rechazar documentación (US-05).
@ApiTags('verification')
@Controller('admin/documents')
export class VerificationController {}
