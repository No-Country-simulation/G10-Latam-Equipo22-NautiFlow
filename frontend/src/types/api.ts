export interface HealthResult {
  status: 'ok' | 'degraded';
  db: 'up' | 'down';
  uptime: number;
  latencyMs: number;
  timestamp: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}
