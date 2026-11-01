# Backlog

Fuente de verdad: [GitHub Project #561](https://github.com/orgs/No-Country-simulation/projects/561).
Cada Issue debe incluir objetivo, alcance, criterios de aceptación, responsable y revisor.

Prioridades: **Alta**, **Media**, **Baja**. Milestones por etapa del [ROADMAP](./ROADMAP.md).

## Etapa 1 — Fundaciones

| ID | Historia | Prioridad | Labels |
| --- | --- | --- | --- |
| TECH-01 | Estructura, Docker y CI | Alta | infra |
| TECH-02 | Esquema Prisma inicial y migración User/Owner | Alta | infra |
| TECH-03 | Documentación del repo (ROADMAP, ARCHITECTURE, DATABASE, API, BACKLOG) | Alta | infra |
| TECH-04 | Convenciones Swagger: DTOs, errores y paginación | Alta | infra, backend |
| TECH-05 | Seed y fixtures de desarrollo | Media | infra, backend |
| TECH-06 | Ramas protegidas y reglas de PR | Media | infra |
| TECH-07 | Seguridad API: helmet, rate limit, CORS estricto | Media | backend |
| TECH-17 | Seed de admin idempotente: actualizar credenciales si el usuario existe | Baja | infra, backend |
| TECH-18 | Agilizar el watch del backend en Docker sobre Windows | Media | infra |
| DEC-01 | Resolver decisiones pendientes del plan técnico | Alta | infra |
| DOC-01 | Acta de decisiones en `DECISIONS.md` | Media | infra |
| US-01 | Registro e inicio de sesión del lanchero | Alta | historia-US-01, fullstack |
| US-01b | Sesión activa (`/auth/me`) y rutas protegidas | Alta | historia-US-01b, fullstack |
| QA-01 | Plan de pruebas trazado a historias | Alta | qa |

## Etapa 2 — Usuarios y flota

| ID | Historia | Prioridad | Labels |
| --- | --- | --- | --- |
| US-02 | Administrar perfil propio | Alta | historia-US-02, fullstack |
| US-03 | Registrar embarcación | Alta | historia-US-03, backend |
| US-04 | Cargar documentación con formato/tamaño validados | Alta | historia-US-04, backend |
| US-05 | Revisar documentación con revisor, fecha y observación | Alta | historia-US-05, backend |
| US-14 | CRUD de zonas de cobertura (M:N con Boat) | Alta | historia-US-14, backend |
| TECH-13 | Modelo de datos de flota (Zona, Embarcación, M:N) | Alta | infra, backend |
| TECH-08 | Elección de storage privado + POC de subida | Media | infra, backend |

## Etapa 3 — Operación admin

| ID | Historia | Prioridad | Labels |
| --- | --- | --- | --- |
| US-06 | Buscar embarcaciones elegibles con filtros | Alta | historia-US-06, fullstack |
| US-07 | Registrar y asignar viaje manualmente | Alta | historia-US-07, backend |
| US-08 | Completar viaje y habilitar reseña | Alta | historia-US-08, backend |
| US-15 | Dashboard admin: layout, tablas y navegación | Alta | historia-US-15, frontend |
| TECH-19 | Validar solapamiento de horarios al asignar lancha | Alta | backend |
| TECH-20 | Paginar listados admin de viajes, solicitudes y documentos | Media | backend, frontend |

## Etapa 4 — Reputación y retornos

| ID | Historia | Prioridad | Labels |
| --- | --- | --- | --- |
| US-09 | Generar enlace de reseña con token de uso único | Alta | historia-US-09, backend |
| US-10 | Enviar reseña sin registro (rating 1–5, token consumido) | Alta | historia-US-10, fullstack |
| US-11 | Consultar reputación pública | Alta | historia-US-11, frontend |
| US-16 | Landing pública con reputación | Media | historia-US-16, frontend |
| US-12 | Registrar tramo vacío | Media | historia-US-12, backend |
| US-13 | Contactar por WhatsApp (`wa.me` con mensaje prearmado) | Media | historia-US-13, frontend |

## Etapa 5 — Calidad y entrega

| ID | Historia | Prioridad | Labels |
| --- | --- | --- | --- |
| QA-02 | E2E con Playwright del circuito vertical | Alta | qa |
| QA-03 | Suite de regresión en CI | Media | qa, infra |
| QA-04 | Pruebas de permisos por rol | Alta | qa |
| QA-05 | Pruebas de archivos: formato, tamaño y privacidad | Media | qa |
| QA-06 | Pruebas del token de reseña: uso único y expiración | Alta | qa |
| TECH-09 | Deploy en Render (backend + PostgreSQL) con backups | Media | infra |
| TECH-14 | Unificar nomenclatura español en User/Owner/Role | Baja | infra, backend |

## Sprint 1 — Criterios de aceptación

Objetivo: entorno reproducible + login del lanchero de punta a punta.

| Historia | Criterios resumidos |
| --- | --- |
| TECH-01 | Los tres servicios levantan con `docker compose up`; CI corre en cada PR |
| TECH-02 | Migración aplicada con `User` y `Owner`; seed desde variables de entorno |
| US-01 | Registro validado; contraseñas hasheadas; login correcto; rutas privadas protegidas |
| US-01b | `/auth/me` devuelve el usuario del JWT; React muestra el nombre en una ruta protegida |
| QA-01 | Casos críticos trazados a historias, con positivos y negativos de login |

## Reglas de trabajo

- Toda Issue nace con criterios de aceptación y un responsable principal; QA participa en el
  refinamiento, no al final.
- Columnas: BACKLOG → READY → IN PROGRESS → CODE REVIEW → QA / TESTING → DONE.
- No se aceptan tareas ambiguas: cada una debe entregar un resultado demostrable.
