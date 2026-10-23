import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearEmbarcacionDto } from './dtos/crear-embarcacion.dto.js';
import { ActualizarEmbarcacionDto } from './dtos/actualizar-embarcacion.dto.js';

@Injectable()
export class EmbarcacionesService {
  constructor(private readonly prisma: PrismaService) {}

  listarPorPropietario(propietarioId: string) {
    return this.prisma.embarcacion.findMany({
      where: { propietarioId },
      include: { zonas: { include: { zona: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async buscarPropia(id: string, propietarioId: string) {
    const embarcacion = await this.prisma.embarcacion.findFirst({
      where: { id, propietarioId },
    });
    if (!embarcacion) {
      throw new NotFoundException('Embarcación no encontrada');
    }
    return embarcacion;
  }

  async crear(propietarioId: string, datos: CrearEmbarcacionDto) {
    await this.validarZonas(datos.zonaIds);

    try {
      return await this.prisma.embarcacion.create({
        data: {
          propietarioId,
          nombre: datos.nombre,
          matricula: datos.matricula,
          capacidad: datos.capacidad,
          descripcion: datos.descripcion,
          zonas: this.conectarZonas(datos.zonaIds),
        },
        include: { zonas: { include: { zona: true } } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe una embarcación con esa matrícula');
      }
      throw error;
    }
  }

  async actualizar(id: string, propietarioId: string, datos: ActualizarEmbarcacionDto) {
    const { zonaIds, ...campos } = datos;
    await this.buscarPropia(id, propietarioId);
    await this.validarZonas(zonaIds);

    try {
      return await this.prisma.embarcacion.update({
        where: { id },
        data: {
          ...campos,
          zonas: this.reemplazarZonas(zonaIds),
        },
        include: { zonas: { include: { zona: true } } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe una embarcación con esa matrícula');
      }
      throw error;
    }
  }

  private conectarZonas(zonaIds?: string[]): Prisma.EmbarcacionZonaCreateNestedManyWithoutEmbarcacionInput | undefined {
    if (!zonaIds?.length) {
      return undefined;
    }
    return { create: zonaIds.map((zonaId) => ({ zona: { connect: { id: zonaId } } })) };
  }

  private reemplazarZonas(zonaIds?: string[]): Prisma.EmbarcacionZonaUpdateManyWithoutEmbarcacionNestedInput | undefined {
    if (!zonaIds) {
      return undefined;
    }
    return { deleteMany: {}, create: zonaIds.map((zonaId) => ({ zona: { connect: { id: zonaId } } })) };
  }

  private async validarZonas(zonaIds?: string[]) {
    if (!zonaIds?.length) {
      return;
    }
    const encontradas = await this.prisma.zona.findMany({
      where: { id: { in: zonaIds }, activa: true },
      select: { id: true },
    });
    if (encontradas.length !== zonaIds.length) {
      throw new NotFoundException('Alguna zona indicada no existe o está inactiva');
    }
  }
}
