import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Solicitudes, asignación manual y transiciones de estado del viaje (US-07, US-08).
@ApiTags('trips')
@Controller('admin/trips')
export class TripsController {}
