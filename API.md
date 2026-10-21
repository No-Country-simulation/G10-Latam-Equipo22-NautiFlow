# API

REST versionada bajo `/api/v1`. Documentación interactiva: `http://localhost:3000/api/docs`.

## Convenciones

- DTOs de entrada y salida: nunca se exponen entidades Prisma.
- Validación en backend con `class-validator`; el frontend valida como refuerzo.
- Guards por rol (`ADMIN`, `OWNER`) y por recurso.
- Códigos: `200/201`, `400`, `401`, `403`, `404`, `409`, `422`.
- Paginación en listados administrativos: `?page=1&limit=20` (máx. 100).
- Respuestas de error con mensaje claro, sin trazas internas.
- Documentos privados: no se devuelven URLs públicas permanentes.

## Implementado

| Método | Ruta | Rol | Descripción |
| --- | --- | --- | --- |
| GET | `/health` | Público | Estado de la API y conexión a PostgreSQL. `200` si la base responde, `503` si está caída |

### `GET /api/v1/health`

```json
{
  "status": "ok",
  "db": "up",
  "uptime": 49,
  "latencyMs": 1,
  "timestamp": "2026-10-21T04:06:53.454Z"
}
```

## Contrato planificado

| Módulo | Método y ruta | Rol | Uso |
| --- | --- | --- | --- |
| Auth | `POST /auth/register` | Público | Registro de lanchero |
| Auth | `POST /auth/login` | Público | Login y emisión de JWT |
| Auth | `GET /auth/me` | Autenticado | Usuario actual |
| Boats | `POST /boats` | Lanchero | Crear embarcación |
| Boats | `GET /boats/me` | Lanchero | Listar embarcaciones propias |
| Boats | `PATCH /boats/:id` | Lanchero | Actualizar embarcación propia |
| Documents | `POST /boats/:id/documents` | Lanchero | Cargar documento |
| Verification | `GET /admin/documents?status=pending` | Admin | Bandeja de pendientes |
| Verification | `PATCH /admin/documents/:id/review` | Admin | Aprobar o rechazar |
| Boats | `GET /admin/boats/search` | Admin | Filtrar embarcaciones elegibles |
| Trips | `POST /admin/trips` | Admin | Registrar solicitud de viaje |
| Trips | `PATCH /admin/trips/:id/assign` | Admin | Asignar embarcación |
| Trips | `PATCH /admin/trips/:id/status` | Admin | Cambiar estado |
| Reviews | `POST /admin/trips/:id/review-link` | Admin | Generar enlace único |
| Reviews | `GET /public/reviews/:token` | Público | Validar token y contexto |
| Reviews | `POST /public/reviews/:token` | Público | Enviar calificación |
| Empty legs | `POST /admin/empty-legs` | Admin | Registrar tramo vacío |
| Empty legs | `GET /admin/empty-legs` | Admin | Listar tramos disponibles |
| Notifications | `GET /notifications` | Autenticado | Consultar notificaciones |

## Ejemplo de revisión de documento

```http
PATCH /api/v1/admin/documents/{documentId}/review
Authorization: Bearer <jwt>

{ "decision": "APPROVED", "comment": "Documentación legible y vigente" }
```

## Autenticación prevista

- JWT en `Authorization: Bearer <token>`.
- `ADMIN` accede al back-office completo; `OWNER` solo a su perfil, embarcaciones y documentos.
- El turista no tiene cuenta: entra por un enlace con token de reseña de uso único.

## Reglas de error sugeridas

| Caso | Código |
| --- | --- |
| Cuerpo inválido o campos faltantes | 400 |
| Token ausente o vencido | 401 |
| Rol sin permiso | 403 |
| Recurso inexistente | 404 |
| Conflicto (email repetido, token ya usado) | 409 |
| Regla de negocio incumplida | 422 |
