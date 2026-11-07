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

`auth`, `users`, `owners`, `boats`, `zones`, `documents`, `verification`, `trips`, `reviews`,
`empty-legs`, `notifications`, `health`, `common`, `prisma`, `config`.

Cada módulo de dominio ya está registrado en `AppModule` con su controlador y servicio como punto
de partida. El detalle de arquitectura y convenciones está en [../ARCHITECTURE.md](../ARCHITECTURE.md).

## Despliegue

### Vercel
- **Root Directory**: `backend`
- **Framework Preset**: `NestJS`
- **Build Command**: automático (`prisma generate` + `nest build`)
- El archivo `vercel.json` en `backend/` define las reglas de reescritura (`rewrites`) para canalizar todas las peticiones entrantes a la función compilada.
- Las variables de entorno mínimas en Vercel son: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PUBLIC_APP_URL` y `NODE_ENV=production`. `PORT` es opcional (fallback `3000`).

### Render
- El archivo `render.yaml` en la raíz del repositorio configura el servicio web Node.js.
- Se ejecuta `preDeployCommand: npm run prisma:deploy && npm run prisma:seed` para aplicar migraciones e idempotencia de datos iniciales.

## Almacenamiento de Documentos
- Para el MVP, la documentación de lancheros y embarcaciones se almacena en PostgreSQL en columnas `BYTEA` (`content Bytes` en Prisma).
- El tamaño máximo permitido por archivo es de **5 MiB** (validado en `file-validation.ts`), admitiendo formatos PDF, JPEG, PNG y WebP.
