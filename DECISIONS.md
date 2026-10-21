# Registro de decisiones

Cada decisión se registra con contexto, alternativas, motivo, responsable y fecha. Las decisiones
marcadas como **pendientes** requieren acuerdo del equipo.

## D-001 · Arquitectura: monolito modular

- **Fecha:** 2026-10-21
- **Decisión:** API NestJS única con módulos por dominio.
- **Alternativas:** microservicios, serverless.
- **Motivo:** tamaño del equipo, alcance del MVP y velocidad de integración.
- **Estado:** aprobada.

## D-002 · Backend con Nest 12 sobre ESM, Vitest y Oxlint

- **Fecha:** 2026-10-21
- **Decisión:** se mantiene el scaffold actual del CLI: `"type": "module"`, imports con `.js`,
  Vitest para tests y Oxlint para lint.
- **Alternativas:** Nest 11 con CommonJS, Jest y ESLint (lo que sugiere el plan técnico original).
- **Motivo:** es el default del CLI vigente, evita configurar Jest sobre ESM y mantiene paridad de
  herramientas con el frontend. Supertest se conserva para las pruebas de API.
- **Responsable:** equipo Full Stack.
- **Estado:** aprobada; revisar si aparece fricción con librerías que sólo soportan CommonJS.

## D-003 · Prisma 7 con driver adapter

- **Fecha:** 2026-10-21
- **Decisión:** generador `prisma-client` en `src/generated/prisma`, `@prisma/adapter-pg` y
  `prisma.config.ts` en `backend/`.
- **Alternativas:** fijar Prisma 6 con engine binario.
- **Motivo:** Prisma 7 eliminó el engine binario y exige adapters; es la versión vigente y encaja
  con ESM. El cliente generado no se versiona: se regenera en build y al iniciar.
- **Estado:** aprobada.

## D-004 · Un único `.env` en la raíz

- **Fecha:** 2026-10-21
- **Decisión:** backend y frontend leen el `.env` de la raíz; Compose sobreescribe `DATABASE_URL`
  con el host `db`.
- **Motivo:** una sola fuente de configuración para local y Docker, sin duplicar variables.
- **Estado:** aprobada.

## D-005 · Cliente HTTP propio en el frontend

- **Fecha:** 2026-10-21
- **Decisión:** wrapper tipado sobre `fetch` en `services/api.ts`, sin Axios.
- **Motivo:** menos dependencias, mismo comportamiento y control de errores explícito.
- **Estado:** aprobada.

## D-006 · `legacy-peer-deps` en el frontend

- **Fecha:** 2026-10-21
- **Decisión:** `.npmrc` con `legacy-peer-deps=true`.
- **Motivo:** `@hookform/resolvers@6` declara peers opcionales incompatibles entre sí (`effect`
  v3/v4) que hacen fallar `npm install`. El flag evita el ERESOLVE sin relajar el resto.
- **Consecuencia:** hay que instalar explícitamente peers que npm ya no resuelve, como
  `@testing-library/dom`.
- **Estado:** aprobada; revisar cuando `@hookform/resolvers` publique una versión compatible.

## D-007 · Seed sin credenciales hardcodeadas

- **Fecha:** 2026-10-21
- **Decisión:** el seed crea el admin desde `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`. Si faltan,
  se omite con un aviso.
- **Motivo:** evitar usuarios con contraseña conocida fuera de desarrollo.
- **Estado:** aprobada.

## D-008 · Semántica del endpoint de salud

- **Fecha:** 2026-10-21
- **Decisión:** `GET /api/v1/health` devuelve `200` si la base responde y `503` con
  `status: "degraded"` si no.
- **Motivo:** permite healthchecks de Docker y monitoreo con códigos estándar.
- **Estado:** aprobada.

## D-009 · Flujo de ramas durante el esqueleto

- **Fecha:** 2026-10-21
- **Decisión:** el esqueleto inicial se integra directo a `develop`. Desde el Sprint 1 rige
  PR obligatorio hacia `develop` y `main` protegida.
- **Motivo:** agilizar la puesta en marcha sin perder la convención a futuro.
- **Estado:** transitoria.

## Decisiones pendientes

| Tema | Propuesta inicial | Pregunta |
| --- | --- | --- |
| Verificación | Aprobar documentos y embarcación | ¿Propietario, embarcación, cada documento o combinación? |
| Disponibilidad | Filtro admin por fecha y horario | ¿Cómo se registra y actualiza? |
| Datos del viaje | Capacidad, zona, fecha y hora | ¿Campos obligatorios? ¿Cómo se representa origen/destino? |
| WhatsApp | `wa.me` con texto prearmado | ¿Hace falta automatización real para la simulación? |
| Almacenamiento | Storage privado externo | ¿Qué proveedor ofrece demo con persistencia y costo aceptable? |
| Hosting | Render primero | ¿Servicio siempre activo o demo temporal? |
| Autenticación | JWT; roles admin y owner; turista sin cuenta | ¿Registro abierto o invitación? |
| Reseñas | Token por viaje completado, uso único | ¿Vencimiento? ¿Se permite editar? |
| Frontend CSS | CSS con variables (actual) | ¿Tailwind, CSS Modules u otra opción? |
| Planificación | Sprints según capacidad real | ¿Duración total de la simulación y fecha de demo? |
| Roles | Responsabilidad principal por persona | ¿Se confirma la propuesta del plan técnico? |
