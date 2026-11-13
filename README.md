# NautiFlow

Sistema de gestión para agencias de transporte privado de lanchas en el Delta del Tigre: flota, documentación, solicitudes de lancheros, viajes, retornos, reservas y reputación en una sola plataforma.

**Aplicación en producción:** https://nautiflow-weld.vercel.app/

> Simulación laboral abierta · NoCountry · Equipo 22 · G10 Latam

## Guía rápida para el cliente

No necesitás instalar nada: ingresá desde tu navegador a [NautiFlow](https://nautiflow-weld.vercel.app).

| Paso | Qué hacer |
| --- | --- |
| **1. Ingresar** | Abrí la aplicación; desde la landing podés explorar el catálogo público de salidas y embarcaciones. |
| **2. Elegir perfil** | **Lanchero (OWNER)** se registra y gestiona su actividad; **Administrador (ADMIN)** opera el panel interno; los turistas navegan sin cuenta. |
| **3. Registrarse como lanchero** | Completá tus datos, la información de la embarcación y adjuntá licencia, seguro y antecedentes (PDF/JPEG/PNG/WebP, máx. 5 MiB por archivo). |
| **4. Esperar aprobación** | La agencia revisa la documentación; una vez aprobada, accedés a tu panel. |
| **5. Operar desde el panel** | El lanchero gestiona flota, salidas y retornos; el admin aprueba solicitudes y administra viajes, clientes y reservas. |
| **6. Dejar una reseña** | Al completarse un viaje, el admin genera un enlace único: válido 14 días, de un solo uso y sin registro. |

> El acceso **ADMIN no es público**: las credenciales las provee la agencia.

## Funcionalidades

### Público (sin cuenta)

- Landing con catálogo de embarcaciones verificadas, rating y **próximos viajes por lanchero**.
- Salidas con filtros (zona, fechas, origen/destino, estado) y detalle con tramos, precio y cupo.
- Contacto directo por WhatsApp con mensaje prearmado.
- Reseñas mediante enlace único.

### Lanchero (OWNER)

- Registro con documentación y seguimiento de la solicitud.
- Gestión de flota: embarcaciones, datos y cobertura.
- Publicación y edición de **retornos vacíos** (agenda de regresos en vacío).
- Gestión de **salidas y tramos**: estado, fecha, cupo y precio.
- Perfil propio y **campana de notificaciones** (aprobaciones y cambios de estado).

### Administrador (ADMIN)

- Bandeja de solicitudes: aprobar o rechazar lancheros con observaciones.
- Revisión de documentación con revisor, fecha y decisión.
- Embarcaciones, búsqueda elegible y verificación.
- Viajes: registro, asignación de lancha y estados; clientes asociados.
- Retornos: estados (disponible, ofrecido, asignado, cerrado) con aviso al lanchero.
- Reservas públicas: confirmar o cancelar con control de cupos.
- Enlaces de reseña y revisión de valoraciones.
- Dashboard con contadores operativos.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router |
| Backend | NestJS 12 (ESM), TypeScript |
| Base de datos | PostgreSQL 16, Prisma 7 |
| API | REST `/api/v1` + Swagger `/api/docs` |
| Tests | Vitest, Testing Library, Supertest |
| Infra | Docker, GitHub Actions, Render (backend), Vercel (frontend) |

Arquitectura: **monolito modular** → [ARCHITECTURE.md](./ARCHITECTURE.md).

## Entornos

### Producción

| Servicio | URL |
| --- | --- |
| Aplicación | https://nautiflow-weld.vercel.app |
| API | https://nautiflow-backend.onrender.com/api/v1 |
| Estado (health) | https://nautiflow-backend.onrender.com/api/v1/health |
| Swagger | https://nautiflow-backend.onrender.com/api/docs |

### Local

| Servicio | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/api/v1 |
| Health | http://localhost:3000/api/v1/health |
| Swagger | http://localhost:3000/api/docs |

## Para desarrolladores

### Requisitos

Git + Docker Desktop (o Node 20+ y PostgreSQL 16 para correr sin Docker).

### Instalación con Docker

```bash
git clone https://github.com/No-Country-simulation/G10-Latam-Equipo22-NautiFlow.git
cd G10-Latam-Equipo22-NautiFlow
cp .env.example .env        # Windows: Copy-Item .env.example .env
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run prisma:seed
```

Editá `.env` antes de levantar: usá un `JWT_SECRET` aleatorio y credenciales propias para el admin local. Nunca subas `.env` al repositorio.

### Sin Docker (opcional)

```bash
# Con PostgreSQL corriendo (ej.: docker compose up -d db)
cd backend && npm install && npm run prisma:migrate && npm run prisma:seed && npm run start:dev
cd frontend && npm install && npm run dev
```

Ambos leen el `.env` de la raíz del repositorio.

### Comandos útiles

| Dónde | Comando | Qué hace |
| --- | --- | --- |
| raíz | `docker compose up -d` | Levanta base, API y frontend |
| raíz | `docker compose logs -f backend` | Logs de la API |
| backend | `npm run lint` / `build` / `test` | Calidad y tests unitarios |
| backend | `npm run test:e2e` | E2E contra la base local |
| backend | `npm run prisma:migrate` / `studio` / `seed` | Migraciones, explorador y datos demo |
| frontend | `npm run lint` / `build` / `test` | Calidad y tests |

## Autenticación y roles

- Login común en `/login`; la app redirige según el rol (`OWNER` o `ADMIN`).
- JWT en cookie **HttpOnly** (el navegador no puede leerlo). `SameSite=Lax` en desarrollo y `None; Secure` en producción (cruce Vercel ↔ Render).
- `POST /api/v1/auth/logout` borra la cookie; un token copiado fuera del navegador sigue válido hasta expirar.
- `POST /api/v1/auth/register/lanchero` crea en una sola transacción: cuenta, solicitud pendiente, primera embarcación y documentos.
- El alta de **ADMIN es solo por seed controlado** (sin autorregistro ni invitaciones).
- Los **turistas no tienen cuenta**: son registros de contacto que crea el admin al registrar un viaje, y dejan reseñas con el enlace único.

### Rutas principales

| Ruta | Acceso |
| --- | --- |
| `/` | Landing pública |
| `/login`, `/registro/lanchero`, `/registro/confirmacion` | Público |
| `/reviews/:token` | Reseña pública (token de un solo uso) |
| `/dashboard` | Redirige según rol |
| `/owner/dashboard`, `/owner/solicitud`, `/owner/flota`, `/owner/retornos`, `/owner/salidas`, `/owner/perfil` | OWNER |
| `/admin/dashboard`, `/admin/solicitudes`, `/admin/verificacion`, `/admin/flota`, `/admin/busqueda`, `/admin/viajes`, `/admin/retornos`, `/admin/resenas` | ADMIN |
| `/estado` | Estado del servicio |

## Cuentas de prueba locales

Solo para **desarrollo local**; no representan accesos de producción. Con los contenedores arriba, ejecutá en PowerShell — reemplazá los valores por claves propias:

```powershell
docker compose exec -e NODE_ENV=development -e SEED_DEMO_USERS=true -e SEED_ADMIN_EMAIL= -e SEED_ADMIN_PASSWORD= -e "SEED_DEMO_OWNER_PASSWORD=REEMPLAZAR_POR_CLAVE_LOCAL" -e "SEED_DEMO_ADMIN_PASSWORD=REEMPLAZAR_POR_CLAVE_LOCAL" backend npm run prisma:seed
```

| Cuenta | Email | Rol | Panel |
| --- | --- | --- | --- |
| Carlos Ramírez | `lanchero@nautiflow.test` | OWNER (pendiente) | `/owner/dashboard` |
| Admin NautiFlow | `admin@nautiflow.test` | ADMIN | `/admin/dashboard` |

- Ingresá en `/login` con el email y la contraseña local que configuraste.
- El OWNER demo nace **pendiente**, sin documentación ni embarcación; para probar el circuito completo, enviá una solicitud desde `/registro/lanchero` y revisala con el ADMIN.
- El seed usa `upsert`: no modifica contraseñas, roles ni relaciones de cuentas existentes.
- **Nunca uses estas cuentas ni contraseñas en producción.**

## Testing y calidad

| Herramienta | Uso |
| --- | --- |
| Vitest | Unitarios (backend y frontend) |
| Testing Library | Componentes e interfaz |
| Supertest | Integración / E2E del backend |

```bash
# backend
npm run lint && npm run build && npm test && npm run test:e2e

# frontend
npm run lint && npm run build && npm test
```

Los E2E del backend requieren la base local (Docker). El CI corre en cada Pull Request.

## Despliegue en producción

| Servicio | Plataforma | Rama | Configuración |
| --- | --- | --- | --- |
| Backend + PostgreSQL | Render | `main` | Blueprint [`render.yaml`](./render.yaml) |
| Frontend | Vercel | `main` | Root Directory `frontend` |

- Cada merge a `main` sincroniza el Blueprint de Render y redeployea Vercel.
- Migraciones y seed corren en el build de Render (idempotentes).
- **Render**: `CORS_ORIGIN` y `PUBLIC_APP_URL` apuntan a la URL de la app; `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` configuran el admin; `DATABASE_URL` y `JWT_SECRET` se inyectan automáticamente.
- **Vercel**: `VITE_API_URL` define la base de la API en tiempo de build (cambiarla requiere
  redeploy). En producción usa `/api/v1`: el rewrite de `vercel.json` hace proxy hacia Render,
  así la API responde en el mismo dominio y la sesión funciona como cookie de primer nivel en
  cualquier navegador.

**Plan gratuito:** Render duerme el servicio a los 15 min sin tráfico (el primer request tarda ~1 min en despertarlo); PostgreSQL free expira a los 30 días (14 de gracia, sin backups). El rewrite de `frontend/vercel.json` (`/(.*) → /index.html`) permite rutas directas de React Router.

## Estructura

```text
.
├── backend/            API NestJS (módulos por dominio + Prisma)
├── frontend/           React + Vite (pages, layouts, services, hooks)
├── .github/workflows/  CI en cada PR
├── docker-compose.yml  PostgreSQL + backend + frontend
├── render.yaml         Blueprint de Render
├── frontend/vercel.json  Rewrites SPA para Vercel
└── docs/               ROADMAP · ARCHITECTURE · DATABASE · API · BACKLOG · DECISIONS
```

## Documentación

| Documento | Contenido |
| --- | --- |
| [ROADMAP.md](./ROADMAP.md) | Etapas y alcance del MVP |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Diseño técnico, convenciones y flujo de trabajo |
| [DATABASE.md](./DATABASE.md) | Entidades, enums y reglas de integridad |
| [API.md](./API.md) | Contrato REST |
| [BACKLOG.md](./BACKLOG.md) | Historias y criterios de aceptación |
| [DECISIONS.md](./DECISIONS.md) | Decisiones técnicas |

## Flujo de trabajo

- `main`: versión estable y rama de despliegue.
- `develop`: integración del sprint.
- `feature/*` y `fix/*`: desarrollo puntual, siempre desde `develop`.
- Todo cambio entra por **Pull Request** con revisión de otro integrante y CI en verde.

## Equipo

| Desarrollador | GitHub |
| --- | --- |
| Ivan Moreno | [@IvanMR94](https://github.com/IvanMR94) |
| Mary Jo | [@MaryJoP10](https://github.com/MaryJoP10) |

Organización: NoCountry · Equipo 22 · G10 Latam.

## Estado del proyecto

NautiFlow es parte de una simulación laboral abierta de NoCountry, con foco en buenas prácticas de ingeniería: control de versiones, revisión por PR, testing y despliegue continuo.

**Aplicación:** https://nautiflow-weld.vercel.app/ · **Repositorio:** [G10-Latam-Equipo22-NautiFlow](https://github.com/No-Country-simulation/G10-Latam-Equipo22-NautiFlow)
