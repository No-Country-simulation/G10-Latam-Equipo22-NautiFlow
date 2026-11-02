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

interface SlotOptions {
  excludeTripId?: string;
  excludeTramoId?: string;
  excludeSalidaId?: string;
}

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
    await this.assertSlotsAvailable(boatId, [scheduledAt], {
      excludeTripId,
      excludeSalidaId,
    });
  }

  async assertSlotsAvailable(
    boatId: string,
    dates: Date[],
    options: SlotOptions = {},
  ): Promise<void> {
    if (!dates.length) return;

    const hours = this.config.get<number>('TRIP_SLOT_HOURS') ?? 2;
    const margin = hours * 60 * 60 * 1000;

    for (const date of dates) {
      const from = new Date(date.getTime() - margin);
      const to = new Date(date.getTime() + margin);

      const [tripConflict, salidaConflict] = await Promise.all([
        this.prisma.trip.findFirst({
          where: {
            embarcacionId: boatId,
            ...(options.excludeTripId ? { id: { not: options.excludeTripId } } : {}),
            ...(options.excludeTramoId
              ? { tramoId: { not: options.excludeTramoId } }
              : {}),
            status: { in: TRIP_ESTADOS_ACTIVOS },
            scheduledAt: { gte: from, lte: to },
          },
          select: { id: true },
        }),
        this.prisma.salida.findFirst({
          where: {
            embarcacionId: boatId,
            ...(options.excludeSalidaId ? { id: { not: options.excludeSalidaId } } : {}),
            estado: { in: SALIDA_ESTADOS_ACTIVOS },
            OR: [{ fechaSalida: { gte: from, lte: to } }, { tramos: { some: { fechaHora: { gte: from, lte: to } } } }],
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
}
