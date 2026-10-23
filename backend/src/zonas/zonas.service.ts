import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface DatosZona {
  nombre: string;
  descripcion?: string;
  activa?: boolean;
}

@Injectable()
export class ZonasService {
  constructor(private readonly prisma: PrismaService) {}

  listar(soloActivas = true) {
    return this.prisma.zona.findMany({
      where: soloActivas ? { activa: true } : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    const zona = await this.prisma.zona.findUnique({ where: { id } });
    if (!zona) {
      throw new NotFoundException('Zona no encontrada');
    }
    return zona;
  }

  async crear(datos: DatosZona) {
    const existente = await this.prisma.zona.findUnique({
      where: { nombre: datos.nombre },
    });
    if (existente) {
      throw new ConflictException('Ya existe una zona con ese nombre');
    }
    return this.prisma.zona.create({
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        activa: datos.activa ?? true,
      },
    });
  }

  async actualizar(id: string, datos: Partial<DatosZona>) {
    const zona = await this.buscarPorId(id);
    if (datos.nombre && datos.nombre !== zona.nombre) {
      const duplicada = await this.prisma.zona.findUnique({
        where: { nombre: datos.nombre },
      });
      if (duplicada) {
        throw new ConflictException('Ya existe una zona con ese nombre');
      }
    }
    return this.prisma.zona.update({ where: { id }, data: { ...datos } });
  }

  async desactivar(id: string) {
    await this.buscarPorId(id);
    return this.prisma.zona.update({ where: { id }, data: { activa: false } });
  }
}
