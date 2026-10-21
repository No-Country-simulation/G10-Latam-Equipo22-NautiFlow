export interface HealthResult {
  status: 'ok' | 'degraded';
  db: 'up' | 'down';
  uptime: number;
  latencyMs: number;
  timestamp: string;
}
