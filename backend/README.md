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
