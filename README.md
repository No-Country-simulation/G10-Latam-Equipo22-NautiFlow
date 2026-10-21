# NautiFlow

Sistema de gestión interna para una agencia de transporte privado de lanchas en el Delta del
Tigre: flota, documentación, viajes, reputación y tramos vacíos en un solo lugar.

> Simulación laboral abierta · NoCountry · Equipo 22 · G10 Latam

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite + React Router |
| Backend | NestJS 12 (ESM) + TypeScript |
| Base de datos | PostgreSQL 16 + Prisma 7 (driver adapter `pg`) |
| API | REST versionada en `/api/v1` + Swagger en `/api/docs` |
| Tests | Vitest (unitarios) + Testing Library (UI) + Supertest (e2e) |
| Infra | Docker + Docker Compose, GitHub Actions |

Arquitectura: **monolito modular**. El detalle está en [ARCHITECTURE.md](./ARCHITECTURE.md).

## Puesta en marcha

Requisitos: Docker Desktop y Git.

```bash
git clone https://github.com/No-Country-simulation/G10-Latam-Equipo22-NautiFlow.git
cd G10-Latam-Equipo22-NautiFlow
cp .env.example .env
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run prisma:seed
```

URLs:

- Frontend: http://localhost:5173
- API: http://localhost:3000/api/v1 → estado en `/health`
- Swagger: http://localhost:3000/api/docs

> En Windows/PowerShell, `cp` equivale a `Copy-Item .env.example .env`.

## Trabajo sin Docker (opcional)

Con PostgreSQL corriendo (por ejemplo `docker compose up -d db`):

```bash
cd backend
npm install
npm run prisma:migrate     # aplica migraciones en desarrollo
npm run prisma:seed
npm run start:dev
```

```bash
cd frontend
npm install
npm run dev
```

Ambos leen el `.env` de la raíz del repositorio.

## Comandos útiles

| Dónde | Comando | Qué hace |
| --- | --- | --- |
| raíz | `docker compose up -d` | Levanta base, API y frontend |
| raíz | `docker compose logs -f backend` | Sigue los logs de la API |
| backend | `npm run lint` / `npm run build` / `npm test` | Calidad y pruebas unitarias |
| backend | `npm run test:e2e` | E2E contra la base local (requiere Docker) |
| backend | `npm run prisma:migrate` | Crea y aplica una migración |
| backend | `npm run prisma:studio` | Explorador de datos |
| frontend | `npm run lint` / `npm run build` / `npm test` | Calidad y pruebas |

## Estructura

```text
.
├── backend/            API NestJS (módulos por dominio, Prisma en prisma/)
├── frontend/           React + Vite (pages, layouts, services, hooks, types)
├── .github/workflows/  CI (lint, build y tests en cada PR)
├── docker-compose.yml  PostgreSQL + backend + frontend
└── docs: ROADMAP, ARCHITECTURE, DATABASE, API, BACKLOG, DECISIONS
```

## Documentación

- [ROADMAP.md](./ROADMAP.md) — etapas y alcance del MVP
- [ARCHITECTURE.md](./ARCHITECTURE.md) — diseño técnico y convenciones
- [DATABASE.md](./DATABASE.md) — entidades, enums y reglas de integridad
- [API.md](./API.md) — contrato REST
- [BACKLOG.md](./BACKLOG.md) — historias y criterios de aceptación
- [DECISIONS.md](./DECISIONS.md) — registro de decisiones técnicas

## Flujo de trabajo

`main` es la rama estable; `develop` integra el sprint. Cada cambio entra por Pull Request con
al menos una revisión de otra área y los checks de CI en verde. Detalle en
[ARCHITECTURE.md](./ARCHITECTURE.md#flujo-de-trabajo).
