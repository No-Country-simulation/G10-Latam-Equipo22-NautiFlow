import { ArgumentsHost, BadRequestException, ForbiddenException, HttpException, Logger, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { FiltroExcepcionesGlobal } from './filtro-excepciones-global.js';

function crearHost() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const getResponse = vi.fn().mockReturnValue({ status });
  const host = {
    switchToHttp: () => ({ getResponse, getRequest: () => ({}) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

function cuerpo(json: ReturnType<typeof vi.fn>) {
  return json.mock.calls[0]?.[0] as { codigo: string; mensaje: string; detalles?: unknown };
}

describe('FiltroExcepcionesGlobal', () => {
  it('mapea un 404 con su mensaje', () => {
    const filtro = new FiltroExcepcionesGlobal();
    const { host, status, json } = crearHost();

    filtro.catch(new NotFoundException('Zona no encontrada'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(cuerpo(json)).toEqual({ codigo: 'NO_ENCONTRADO', mensaje: 'Zona no encontrada' });
  });

  it('convierte errores de validación en 400 con detalles', () => {
    const filtro = new FiltroExcepcionesGlobal();
    const { host, status, json } = crearHost();

    filtro.catch(
      new BadRequestException({ message: ['nombre debe ser un string'] }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(cuerpo(json)).toEqual({
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'Parámetros inválidos',
      detalles: ['nombre debe ser un string'],
    });
  });

  it('mapea un 403 con mensaje propio', () => {
    const filtro = new FiltroExcepcionesGlobal();
    const { host, status, json } = crearHost();

    filtro.catch(new ForbiddenException('Solo administración'), host);

    expect(status).toHaveBeenCalledWith(403);
    expect(cuerpo(json)).toEqual({ codigo: 'NO_AUTORIZADO', mensaje: 'Solo administración' });
  });

  it('traduce unicidad violada de Prisma a 409', () => {
    const filtro = new FiltroExcepcionesGlobal();
    const { host, status, json } = crearHost();

    filtro.catch({ code: 'P2002' }, host);

    expect(status).toHaveBeenCalledWith(409);
    expect(cuerpo(json)).toEqual({ codigo: 'CONFLICTO', mensaje: 'El valor indicado ya existe' });
  });

  it('traduce recurso inexistente de Prisma a 404', () => {
    const filtro = new FiltroExcepcionesGlobal();
    const { host, status, json } = crearHost();

    filtro.catch({ code: 'P2025' }, host);

    expect(status).toHaveBeenCalledWith(404);
    expect(cuerpo(json)).toEqual({ codigo: 'NO_ENCONTRADO', mensaje: 'El recurso no existe' });
  });

  it('responde 500 genérico sin exponer el detalle', () => {
    const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const filtro = new FiltroExcepcionesGlobal();
    const { host, status, json } = crearHost();

    filtro.catch(new Error('falla interna con secretos'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(cuerpo(json)).toEqual({ codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor' });
    expect(JSON.stringify(cuerpo(json))).not.toContain('secretos');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('usa un código genérico para estados sin mapear', () => {
    const filtro = new FiltroExcepcionesGlobal();
    const { host, status, json } = crearHost();

    filtro.catch(new HttpException('Teapot', 418), host);

    expect(status).toHaveBeenCalledWith(418);
    expect(cuerpo(json).codigo).toBe('ERROR');
  });
});
