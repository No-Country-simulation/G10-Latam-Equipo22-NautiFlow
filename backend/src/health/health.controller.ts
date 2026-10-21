import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { HealthResult, HealthService } from './health.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Estado de la API y de la base de datos' })
  @ApiOkResponse({ description: 'API y base de datos operativas' })
  @ApiServiceUnavailableResponse({ description: 'API arriba, base de datos caída' })
  async check(@Res({ passthrough: true }) res: Response): Promise<HealthResult> {
    const result = await this.health.check();
    res.status(result.db === 'up' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return result;
  }
}
