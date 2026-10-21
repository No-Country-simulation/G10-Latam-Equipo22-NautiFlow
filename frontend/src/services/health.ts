import { api } from './api';
import type { HealthResult } from '../types/api';

export function fetchHealth(): Promise<HealthResult> {
  return api.get<HealthResult>('/health');
}
