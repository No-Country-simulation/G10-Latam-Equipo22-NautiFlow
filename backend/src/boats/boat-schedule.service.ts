import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EstadoSalida, TripStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const TRIP_ESTADOS_ACTIVOS: TripStatus[] = [
  TripStatus.PENDING,
  TripStatus.ASSIGNED,
  TripStatus.CONFIRMED,
];

const SALIDA_ESTADOS_ACTIVOS: EstadoSalida[] = [EstadoSalida.PROGRAMADA];

@Injectable()
export class BoatScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async assertSlotAvailable(
    boatId: string,
    scheduledAt: Date,
    excludeTripId?: string,
    excludeSalidaId?: string,
  ): Promise<void> {
    const hours = this.config.get<number>('TRIP_SLOT_HOURS') ?? 2;
    const margin = hours * 60 * 60 * 1000;
    const from = new Date(scheduledAt.getTime() - margin);
    const to = new Date(scheduledAt.getTime() + margin);

    const [tripConflict, salidaConflict] = await Promise.all([
      this.prisma.trip.findFirst({
        where: {
          embarcacionId: boatId,
          ...(excludeTripId ? { id: { not: excludeTripId } } : {}),
          status: { in: TRIP_ESTADOS_ACTIVOS },
          scheduledAt: { gte: from, lte: to },
        },
        select: { id: true },
      }),
      this.prisma.salida.findFirst({
        where: {
          embarcacionId: boatId,
          ...(excludeSalidaId ? { id: { not: excludeSalidaId } } : {}),
          estado: { in: SALIDA_ESTADOS_ACTIVOS },
          fechaSalida: { gte: from, lte: to },
        },
        select: { id: true },
      }),
    ]);

    if (tripConflict || salidaConflict) {
      throw new ConflictException(
        'La embarcación ya tiene un viaje o salida asignado en esa franja horaria.',
      );
    }
  }
}
