export function parseCorsOrigins(value: string): string[] {
  const origins = value.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (origins.length === 0) throw new Error('CORS_ORIGIN debe incluir al menos un origen.');
  return origins;
}