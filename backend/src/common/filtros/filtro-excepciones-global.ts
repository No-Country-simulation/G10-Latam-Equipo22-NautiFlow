import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

export interface CuerpoError {
  codigo: string;
  mensaje: string;
  detalles?: unknown;
}

const CODIGOS_POR_ESTADO: Record<number, string> = {
  400: 'DATOS_INVALIDOS',
  401: 'NO_AUTENTICADO',
  403: 'NO_AUTORIZADO',
  404: 'NO_ENCONTRADO',
  405: 'METODO_NO_PERMITIDO',
  409: 'CONFLICTO',
  413: 'ARCHIVO_GRANDE',
  415: 'TIPO_NO_SOPORTADO',
  422: 'REGLA_DE_NEGOCIO',
  429: 'DEMASIADAS_PETICIONES',
};

const MENSAJES_POR_ESTADO: Record<number, string> = {
  400: 'Parámetros inválidos',
  401: 'Debe iniciar sesión',
  403: 'No tiene permisos para esta operación',
  404: 'Recurso no encontrado',
  405: 'Método no permitido',
  409: 'Conflicto con el estado actual del recurso',
  413: 'El archivo supera el tamaño permitido',
  415: 'Tipo de archivo no soportado',
  422: 'Regla de negocio incumplida',
  429: 'Demasiadas peticiones',
};

function desdePrisma(codigo: unknown): CuerpoError | null {
  if (codigo === 'P2002') {
    return { codigo: 'CONFLICTO', mensaje: 'El valor indicado ya existe' };
  }
  if (codigo === 'P2025') {
    return { codigo: 'NO_ENCONTRADO', mensaje: 'El recurso no existe' };
  }
  return null;
}

@Catch()
export class FiltroExcepcionesGlobal implements ExceptionFilter {
  private readonly logger = new Logger(FiltroExcepcionesGlobal.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, cuerpo } = this.resolver(exception);

    if (status >= 500) {
      const detalle = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`Error no controlado: ${detalle}`);
    }

    response.status(status).json(cuerpo);
  }

  private resolver(exception: unknown): { status: number; cuerpo: CuerpoError } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const codigo = CODIGOS_POR_ESTADO[status] ?? 'ERROR';
      const mensajePorDefecto = MENSAJES_POR_ESTADO[status] ?? 'Error';
      const respuesta = exception.getResponse();

      if (typeof respuesta === 'string') {
        return { status, cuerpo: { codigo, mensaje: respuesta } };
      }

      const detalle = respuesta as { message?: unknown };
      if (Array.isArray(detalle.message)) {
        return {
          status,
          cuerpo: { codigo, mensaje: mensajePorDefecto, detalles: detalle.message },
        };
      }

      const mensaje =
        typeof detalle.message === 'string' && detalle.message
          ? detalle.message
          : exception.message || mensajePorDefecto;
      return { status, cuerpo: { codigo, mensaje } };
    }

    const codigo = typeof exception === 'object' && exception !== null ? (exception as { code?: unknown }).code : undefined;
    const cuerpoPrisma = desdePrisma(codigo);
    if (cuerpoPrisma) {
      const status =
        cuerpoPrisma.codigo === 'CONFLICTO' ? HttpStatus.CONFLICT : HttpStatus.NOT_FOUND;
      return { status, cuerpo: cuerpoPrisma };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      cuerpo: { codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor' },
    };
  }
}
