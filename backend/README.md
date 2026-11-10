# Backend · NautiFlow

API REST en NestJS 12 (ESM) con PostgreSQL y Prisma 7.

## Comandos

```bash
npm install
npm run start:dev        # regenera el cliente Prisma y levanta en modo watch
npm run lint
npm run build
npm test                 # unitarios (Vitest)
npm run test:e2e         # requiere DATABASE_URL con base disponible
npm run prisma:migrate -- --name mi_cambio
npm run prisma:deploy
npm run prisma:seed
npm run prisma:studio
```

Configuración: las variables se leen de `backend/.env` o del `.env` de la raíz (ver
`.env.example`). La API falla al arrancar si falta una variable requerida.

Rutas: prefijo global `/api/v1`, Swagger en `/api/docs`, salud en `/api/v1/health`.

## Módulos

`auth`, `owners`, `boats`, `zones`, `documents`, `trips`, `reviews`, `empty-legs`, `salidas`,
`reservas`, `dashboard`, `notifications`, `health`, `prisma`, `config`.

Cada módulo de dominio está registrado en `AppModule` con su controlador y servicio. El detalle de
arquitectura y convenciones está en [../ARCHITECTURE.md](../ARCHITECTURE.md).

## Despliegue (Render)

- El Blueprint `render.yaml` en la raíz del repositorio crea la base PostgreSQL y el servicio web
  Node.js, rama `develop`.
- `buildCommand` corre `npm ci --include=dev`, el build, `prisma:deploy` y `prisma:seed` (los dos
  últimos idempotentes). Render free no soporta `preDeployCommand`, por eso van en el build; el
  `--include=dev` es obligatorio porque `nest`, el CLI de Prisma y `tsx` (seed) son
  devDependencies.
- Variables mínimas: `DATABASE_URL` (inyectada desde la base del Blueprint), `JWT_SECRET`
  (generado), `NODE_ENV=production`, `PORT=10000`, `CORS_ORIGIN`, `PUBLIC_APP_URL`,
  `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` (≥ 16 caracteres; si faltan, el seed omite el admin).
- Salud en `/api/v1/health`. El plan free se duerme a los 15 min sin tráfico.

## Almacenamiento de Documentos
- Para el MVP, la documentación de lancheros y embarcaciones se almacena en PostgreSQL en columnas `BYTEA` (`content Bytes` en Prisma).
- El tamaño máximo permitido por archivo es de **5 MiB** (validado en `file-validation.ts`), admitiendo formatos PDF, JPEG, PNG y WebP.
