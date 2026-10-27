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
# Editar .env: usar un JWT_SECRET aleatorio y una clave personal para el admin de desarrollo.
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run prisma:seed
```

URLs:

- Frontend: http://localhost:5173
- API: http://localhost:3000/api/v1 → estado en `/health`
- Swagger: http://localhost:3000/api/docs

> En Windows/PowerShell, `cp` equivale a `Copy-Item .env.example .env`.

### Autenticación

Los roles son `OWNER` (lanchero), `CLIENT` (cliente con cuenta) y `ADMIN` (back-office). El login
es común y redirige según el rol devuelto por la API. Las sesiones usan cookie `HttpOnly`,
`SameSite=Lax` y expiración `JWT_EXPIRES_IN`; en producción también `Secure`. El navegador no
puede leer ni persistir el JWT. `POST /api/v1/auth/logout` borra la cookie del navegador; un token
copiado manualmente sigue válido hasta expirar.

`POST /api/v1/auth/register/lanchero` crea cuenta, solicitud pendiente, primera embarcación y
documentos en una transacción. Adjunta licencia, seguro y antecedentes (PDF/JPEG/PNG/WebP, máximo
5 MiB por archivo). Para probar el rol `ADMIN`, personalizá `SEED_ADMIN_EMAIL` y
`SEED_ADMIN_PASSWORD` en `.env` antes de correr `docker compose exec backend npm run prisma:seed`.
El seed también carga las zonas iniciales. En producción configurá secretos propios y
`PUBLIC_APP_URL`; nunca uses las claves de ejemplo.

`POST /api/v1/auth/register/cliente` recibe nombre, apellido, email, teléfono y contraseña; el
servidor asigna `CLIENT` y asocia la cuenta al modelo `Cliente`. Ambos registros responden de forma
genérica y requieren iniciar sesión después. Ejecutá `docker compose exec backend npx prisma migrate
deploy` para aplicar también la migración `client_account_role`.

El alta ADMIN es solo por seed controlado (no hay autorregistro/invitación). La agencia revisa
documentos en `ADMIN → Solicitudes`, aprueba el perfil y luego gestiona viajes/clientes desde
`ADMIN → Viajes`. Los clientes con cuenta usan el rol `CLIENT`; el turista también puede reseñar
sin crear cuenta. Al completar un viaje, el admin genera un enlace válido por 14 días y de un solo
uso. Documentos se guardan como bytes privados en
PostgreSQL y se descargan únicamente con sesión del propietario o admin.

Rutas protegidas: `/owner/dashboard`, `/owner/solicitud`, `/client/dashboard`, `/admin/dashboard`,
`/admin/solicitudes` y `/admin/viajes`; `/dashboard` redirige según el rol. `/reviews/:token` es
pública y no requiere cuenta.

#### Cuentas demo locales

Solo para desarrollo, con los contenedores arriba, ejecutá en PowerShell. El seed requiere el flag
explícito, `NODE_ENV=development`, genera hashes bcrypt y usa `upsert` sin actualizar cuentas
existentes. Las contraseñas se pasan al proceso, no se guardan en `.env` ni en el repositorio.

```powershell
docker compose exec -e NODE_ENV=development -e SEED_DEMO_USERS=true -e SEED_ADMIN_EMAIL= -e SEED_ADMIN_PASSWORD= -e "SEED_DEMO_OWNER_PASSWORD=LanchaDev2026!" -e "SEED_DEMO_CLIENT_PASSWORD=ClienteDev2026!" -e "SEED_DEMO_ADMIN_PASSWORD=AdminDev2026!" backend npm run prisma:seed
```

| Cuenta | Email | Rol | Dashboard |
| --- | --- | --- | --- |
| Carlos Ramírez | `lanchero@nautiflow.test` | `OWNER` (pendiente) | `/owner/dashboard` |
| María González | `cliente@nautiflow.test` | `CLIENT` | `/client/dashboard` |
| Admin NautiFlow | `admin@nautiflow.test` | `ADMIN` | `/admin/dashboard` |

Después del seed, iniciar sesión en `/login` con el email y contraseña de cada cuenta. El OWNER
demo tiene solo el perfil pendiente, sin documentación ni embarcación, para acceder al panel; la
aprobación normal requiere documentos revisados. Para probar ese circuito, enviá una solicitud
real desde `/registro/lanchero` y revisala con el ADMIN demo. El seed nunca cambia contraseñas,
roles o relaciones de cuentas que ya existan. No ejecutes estas credenciales en producción.

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
