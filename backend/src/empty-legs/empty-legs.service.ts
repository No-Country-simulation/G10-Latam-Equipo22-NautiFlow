import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { buildPaginated } from '../common/dto/paginated-response.js';
import {
  EmptyLegStatus,
  TripStatus,
  type Prisma,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateEmptyLegDto } from './create-empty-leg.dto.js';
import type { ListEmptyLegsQueryDto } from './list-empty-legs-query.dto.js';

const TRAMOS_DE_ORIGEN: TripStatus[] = [TripStatus.ASSIGNED, TripStatus.CONFIRMED];

@Injectable()
export class EmptyLegsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmptyLegDto) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
      select: {
        id: true,
        status: true,
        origin: true,
        destination: true,
        scheduledAt: true,
        embarcacionId: true,
      },
    });
    if (!trip) {
      throw new NotFoundException('No se encontró el viaje.');
    }
    if (!trip.embarcacionId) {
      throw new BadRequestException('El viaje todavía no tiene embarcación asignada.');
    }
    if (!TRAMOS_DE_ORIGEN.includes(trip.status)) {
      throw new BadRequestException('Solo se registran tramos de viajes asignados o confirmados.');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= trip.scheduledAt) {
      throw new BadRequestException('El regreso debe ser posterior a la salida del viaje.');
    }

    const active = await this.prisma.emptyLeg.findFirst({
      where: { tripId: trip.id, status: { not: EmptyLegStatus.CLOSED } },
      select: { id: true },
    });
    if (active) {
      throw new ConflictException('El viaje ya tiene un tramo vacío activo.');
    }

    return this.prisma.emptyLeg.create({
      data: {
        tripId: trip.id,
        embarcacionId: trip.embarcacionId,
        origin: trip.destination,
        destination: trip.origin,
        scheduledAt,
        status: EmptyLegStatus.AVAILABLE,
      },
      select: {
        id: true,
        tripId: true,
        embarcacionId: true,
        origin: true,
        destination: true,
        scheduledAt: true,
        status: true,
      },
    });
  }

  async list(query: ListEmptyLegsQueryDto) {
    const where: Prisma.EmptyLegWhereInput = {
      status: query.status ?? EmptyLegStatus.AVAILABLE,
    };

    const [data, total] = await Promise.all([
      this.prisma.emptyLeg.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          origin: true,
          destination: true,
          scheduledAt: true,
          status: true,
          embarcacion: {
            select: {
              id: true,
              nombre: true,
              matricula: true,
              capacidad: true,
              propietario: {
                select: {
                  phone: true,
                  whatsappPhone: true,
                  user: { select: { name: true } },
                },
              },
            },
          },
          trip: {
            select: {
              id: true,
              scheduledAt: true,
              passengerCount: true,
              cliente: { select: { nombre: true, telefono: true } },
            },
          },
        },
      }),
      this.prisma.emptyLeg.count({ where }),
    ]);

    return buildPaginated(data, total, query.page, query.limit);
  }
}
