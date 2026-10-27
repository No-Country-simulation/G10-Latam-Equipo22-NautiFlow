import { parseCorsOrigins } from './cors-origins.js';

describe('parseCorsOrigins', () => {
  it('parsea una allowlist sin espacios sobrantes', () => {
    expect(parseCorsOrigins('http://localhost:5173, http://localhost:5174')).toEqual([
      'http://localhost:5173',
      'http://localhost:5174',
    ]);
  });

  it('rechaza una allowlist vacía', () => {
    expect(() => parseCorsOrigins(' , ')).toThrow('CORS_ORIGIN debe incluir al menos un origen.');
  });
});