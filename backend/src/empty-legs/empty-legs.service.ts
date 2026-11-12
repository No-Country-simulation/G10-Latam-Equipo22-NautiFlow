import {
  BadRequestException,
  ConflictException,
  Inject,
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
import { NotificationsService } from '../notifications/notifications.service.js';
import type { CreateEmptyLegDto } from './create-empty-leg.dto.js';
import type { CreateOwnerEmptyLegDto } from './create-owner-empty-leg.dto.js';
import type { ListEmptyLegsQueryDto } from './list-empty-legs-query.dto.js';
import type { ListOwnerEmptyLegsQueryDto } from './list-owner-empty-legs-query.dto.js';
import type { UpdateOwnerEmptyLegDto } from './update-owner-empty-leg.dto.js';

const TRAMOS_DE_ORIGEN: TripStatus[] = [TripStatus.ASSIGNED, TripStatus.CONFIRMED];

const ESTADO_RETORNO_TEXTO: Record<EmptyLegStatus, string> = {
  [EmptyLegStatus.AVAILABLE]: 'Disponible',
  [EmptyLegStatus.OFFERED]: 'Ofrecido',
  [EmptyLegStatus.ASSIGNED]: 'Asignado',
  [EmptyLegStatus.CLOSED]: 'Cerrado',
};

const ESTADOS_EDITABLES_POR_LANCHERO: EmptyLegStatus[] = [
  EmptyLegStatus.AVAILABLE,
  EmptyLegStatus.CLOSED,
];

function fechaTexto(fecha: Date) {
  return fecha.toISOString().slice(0, 16).replace('T', ' ');
}

const LIST_SELECT = {
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
} satisfies Prisma.EmptyLegSelect;

const DETALLE_SELECT = {
  id: true,
  tripId: true,
  embarcacionId: true,
  origin: true,
  destination: true,
  scheduledAt: true,
  status: true,
} satisfies Prisma.EmptyLegSelect;

@Injectable()
export class EmptyLegsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

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
      select: DETALLE_SELECT,
    });
  }

  async list(query: ListEmptyLegsQueryDto) {
    const where: Prisma.EmptyLegWhereInput = {
      status: query.status ?? EmptyLegStatus.AVAILABLE,
    };
    return this.paginatedList(where, query);
  }

  async listMine(userId: string, query: ListOwnerEmptyLegsQueryDto) {
    const propietarioId = await this.resolveOwnerId(userId);
    const where: Prisma.EmptyLegWhereInput = { embarcacion: { propietarioId } };
    if (query.status) where.status = query.status;
    return this.paginatedList(where, query);
  }

  private async paginatedList(where: Prisma.EmptyLegWhereInput, query: ListEmptyLegsQueryDto | ListOwnerEmptyLegsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const [data, total] = await Promise.all([
      this.prisma.emptyLeg.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: LIST_SELECT,
      }),
      this.prisma.emptyLeg.count({ where }),
    ]);

    return buildPaginated(data, total, page, limit);
  }

  async createMine(userId: string, actorName: string, dto: CreateOwnerEmptyLegDto) {
    const propietarioId = await this.resolveOwnerId(userId);
    const boat = await this.prisma.embarcacion.findFirst({
      where: { id: dto.embarcacionId, propietarioId },
      select: { id: true },
    });
    if (!boat) {
      throw new NotFoundException('No se encontró la embarcación.');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('La fecha del retorno debe ser futura.');
    }

    const created = await this.prisma.emptyLeg.create({
      data: {
        embarcacionId: boat.id,
        origin: dto.origin.trim(),
        destination: dto.destination.trim(),
        scheduledAt,
        status: EmptyLegStatus.AVAILABLE,
      },
      select: DETALLE_SELECT,
    });

    await this.notifications.notifyAdmins(
      'Retorno publicado',
      `"${actorName}" publicó un retorno de ${created.origin} a ${created.destination} para el ${fechaTexto(created.scheduledAt)}.`,
    );
    return created;
  }

  async updateMine(userId: string, actorName: string, id: string, dto: UpdateOwnerEmptyLegDto) {
    const propietarioId = await this.resolveOwnerId(userId);
    const emptyLeg = await this.prisma.emptyLeg.findFirst({
      where: { id, embarcacion: { propietarioId } },
      select: { id: true, origin: true, destination: true, status: true },
    });
    if (!emptyLeg) {
      throw new NotFoundException('No se encontró el tramo vacío.');
    }
    if (!ESTADOS_EDITABLES_POR_LANCHERO.includes(emptyLeg.status)) {
      throw new BadRequestException('Solo podés modificar retornos disponibles o cerrados.');
    }
    if (dto.status !== undefined && !ESTADOS_EDITABLES_POR_LANCHERO.includes(dto.status)) {
      throw new BadRequestException('Solo podés marcar el retorno como disponible o cerrado.');
    }

    const data: Prisma.EmptyLegUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.scheduledAt !== undefined) {
      const nuevaFecha = new Date(dto.scheduledAt);
      if (nuevaFecha <= new Date()) {
        throw new BadRequestException('La fecha del retorno debe ser futura.');
      }
      data.scheduledAt = nuevaFecha;
    }

    const updated = await this.prisma.emptyLeg.update({
      where: { id },
      data,
      select: DETALLE_SELECT,
    });

    if (dto.status !== undefined || dto.scheduledAt !== undefined) {
      await this.notifications.notifyAdmins(
        'Retorno actualizado',
        `"${actorName}" modificó el retorno de ${updated.origin} a ${updated.destination} ` +
          `(estado: ${ESTADO_RETORNO_TEXTO[updated.status]}, fecha: ${fechaTexto(updated.scheduledAt)}).`,
      );
    }
    return updated;
  }

  async updateStatus(id: string, status: EmptyLegStatus) {
    const emptyLeg = await this.prisma.emptyLeg.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        origin: true,
        destination: true,
        embarcacion: { select: { propietario: { select: { userId: true } } } },
      },
    });
    if (!emptyLeg) {
      throw new NotFoundException('No se encontró el tramo vacío.');
    }

    const updated = await this.prisma.emptyLeg.update({
      where: { id },
      data: { status },
      select: { id: true, status: true, scheduledAt: true },
    });

    await this.notifications.notify(
      emptyLeg.embarcacion.propietario.userId,
      'Estado de retorno actualizado',
      `Tu retorno de ${emptyLeg.origin} a ${emptyLeg.destination} pasó a ${ESTADO_RETORNO_TEXTO[status]}.`,
    );
    return updated;
  }

  private async resolveOwnerId(userId: string) {
    const owner = await this.prisma.owner.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!owner) {
      throw new NotFoundException('No se encontró la ficha del propietario.');
    }
    return owner.id;
  }
}
