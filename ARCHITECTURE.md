# Arquitectura

## Vista general

```text
Navegador ──> React (Vite) ──HTTP──> NestJS (/api/v1) ──Prisma 7──> PostgreSQL 16
                                              │
                                              └──> storage privado de documentos (a definir)
```

Monolito modular: un solo despliegue de API, separado por módulos de dominio. Es la opción
adecuada para el tamaño del equipo y el alcance del MVP; microservicios quedan descartados.

## Estructura del repositorio

```text
backend/
├── prisma/
│   ├── schema.prisma        Modelo de datos
│   ├── migrations/          Migraciones versionadas
│   └── seed.ts              Datos de desarrollo (admin desde env)
├── src/
│   ├── auth/                Registro, login y sesión
│   ├── users/               Datos de usuario y perfil
│   ├── owners/              Perfil del lanchero y verificación
│   ├── boats/               Embarcaciones y búsqueda admin
│   ├── zones/               Zonas de cobertura
│   ├── documents/           Carga de documentación privada
│   ├── verification/        Bandeja de revisión del admin
│   ├── trips/               Solicitudes, asignación y estados
│   ├── reviews/             Token de reseña y envío público
│   ├── empty-legs/          Tramos vacíos
│   ├── notifications/       Avisos internos
│   ├── health/              Estado de API y base
│   ├── common/              DTOs y utilidades compartidas
│   ├── config/              Validación de variables de entorno
│   ├── prisma/              PrismaService (global)
│   └── generated/prisma/    Cliente generado (no se versiona)
├── test/                    E2E con Supertest
└── prisma.config.ts         Configuración de Prisma CLI

frontend/src/
├── components/              Componentes reutilizables
├── layouts/                 Shell de la aplicación
├── pages/                   Landing, login, panel, estado
├── services/                Cliente HTTP y servicios por dominio
├── hooks/                   Lógica reutilizable (estado, sesión)
├── types/                   Tipos compartidos con la API
└── styles/                  Sistema visual base (CSS variables)
```

## Decisiones técnicas clave

- **Nest 12 sobre ESM** (`"type": "module"`, imports con `.js`). Es el scaffold actual del CLI.
- **Prisma 7 sin engine binario**: `prisma-client` + driver adapter `@prisma/adapter-pg`. El
  cliente se genera en `src/generated/prisma` y se ignora en Git; se regenera en build/start.
- **Un único `.env` en la raíz** para desarrollo local y Docker. Compose sobreescribe
  `DATABASE_URL` con el host `db` de su red interna.
- **Validación de entorno al arrancar** (`src/config/env.validation.ts`): la API falla rápido si
  falta una variable requerida.
- **Sin auth todavía**: el esqueleto deja los módulos listos y el login es la primera historia del
  Sprint 1.

## Seguridad

- Contraseñas con hash (bcrypt/bcryptjs) — a implementar en auth.
- JWT + Guards por rol (`ADMIN`, `OWNER`) y por recurso.
- Documentos privados: el backend autoriza, nunca se exponen rutas públicas permanentes. El
  proveedor de storage es una decisión pendiente (TECH-08).
- Validación de entradas con `class-validator` en backend; el frontend valida como refuerzo, no
  como garantía.
- Secretos solo por variables de entorno; `.env` está fuera de Git.

## API y documentación

- Prefijo global `/api/v1`.
- Swagger/OpenAPI en `/api/docs`, generado desde decoradores.
- DTOs de entrada y salida: no se exponen entidades Prisma.
- Códigos esperados: 200/201, 400, 401, 403, 404, 409, 422.
- Paginación en listados administrativos (`PaginationQueryDto`).

## Entornos

| Entorno | Cómo se levanta |
| --- | --- |
| Local | `docker compose up -d --build` (db + backend + frontend) |
| Local sin Docker | PostgreSQL en Docker + `npm run start:dev` / `npm run dev` |
| CI | GitHub Actions: lint, build y tests unitarios por proyecto |
| Producción | Render como primera opción a evaluar (TECH-09) |

Los Dockerfiles tienen etapas `development` y `production`. La etapa productiva del backend
compila y poda dependencias; la del frontend sirve el build con Nginx y fallback de SPA. Las
migraciones se ejecutan como paso explícito (`prisma migrate deploy`).

## Testing

| Nivel | Herramienta | Alcance |
| --- | --- | --- |
| Unitario backend | Vitest | Servicios y reglas de negocio |
| API | Supertest | E2E contra una base real (`npm run test:e2e`) |
| UI | Vitest + Testing Library | Componentes y hooks |
| E2E navegador | Playwright | Circuito vertical (QA-02) |

## Flujo de trabajo

- `main` protegida: solo entregas estables.
- `develop`: integración del sprint.
- Ramas `feature/<área>-<descripción>` y PR hacia `develop`.
- Un PR requiere Issue enlazada, descripción de cómo probar, al menos una aprobación de otra área
  y CI en verde.
- Commits con Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`...).

## Convenciones de código

- TypeScript `strict` en ambos proyectos.
- Comentarios breves y solo cuando aportan contexto que el código no muestra.
- Sin valores mágicos: configuración por entorno o constantes con nombre.
- Sin `any` explícito (regla de Oxlint activa).
