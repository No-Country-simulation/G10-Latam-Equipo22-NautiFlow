# API

REST versionada bajo `/api/v1`. Documentación interactiva: `http://localhost:3000/api/docs`.

## Convenciones

- DTOs de entrada y salida: nunca se exponen entidades Prisma.
- Validación en backend con `class-validator`; el frontend valida como refuerzo.
- Guards por rol (`ADMIN`, `OWNER`, `CLIENT`) y por recurso.
- Códigos: `200/201`, `400`, `401`, `403`, `404`, `409`, `422`.
- Paginación en listados administrativos: `?page=1&limit=20` (máx. 100).
- Respuestas de error con mensaje claro, sin trazas internas.
- Documentos privados: no se devuelven URLs públicas permanentes.

## Formato de error

Toda respuesta 4xx o 5xx usa el mismo cuerpo, generado por el filtro global
(`src/common/filtros/filtro-excepciones-global.ts`):

```json
{
  "codigo": "NO_ENCONTRADO",
  "mensaje": "Zona no encontrada"
}
```

En validaciones de entrada, `detalles` lista los errores por campo:

```json
{
  "codigo": "DATOS_INVALIDOS",
  "mensaje": "Parámetros inválidos",
  "detalles": ["capacidad debe ser un número entero positivo"]
}
```

| codigo | HTTP | Cuándo |
| --- | --- | --- |
| `DATOS_INVALIDOS` | 400 | Cuerpo o query inválidos |
| `NO_AUTENTICADO` | 401 | Token ausente o inválido |
| `NO_AUTORIZADO` | 403 | Rol sin permiso |
| `NO_ENCONTRADO` | 404 | Recurso inexistente |
| `CONFLICTO` | 409 | Valor repetido, token ya usado |
| `ARCHIVO_GRANDE` / `TIPO_NO_SOPORTADO` | 413 / 415 | Carga de documentos |
| `REGLA_DE_NEGOCIO` | 422 | Regla de negocio incumplida |
| `DEMASIADAS_PETICIONES` | 429 | Rate limit |
| `ERROR_INTERNO` | 500 | Error no controlado; el detalle solo va al log |

Los errores de Prisma `P2002` (unicidad) y `P2025` (recurso inexistente) se traducen
automáticamente a `CONFLICTO` y `NO_ENCONTRADO`.

## Implementado

| Método | Ruta | Rol | Descripción |
| --- | --- | --- | --- |
| GET | `/health` | Público | Estado de la API y conexión a PostgreSQL. `200` si la base responde, `503` si está caída |
| POST | `/auth/register/lanchero` | Público | Registro multipart de lanchero, primera lancha y documentos |
| POST | `/auth/register` | Público | Alias multipart legado de registro de lanchero |
| POST | `/auth/register/cliente` | Público | Alta de cuenta CLIENT asociada a Cliente |
| POST | `/auth/login` | Público | Login y emisión de JWT en cookie HttpOnly |
| POST | `/auth/logout` | Público | Expirar la cookie de sesión |
| GET | `/auth/me` | Autenticado | Usuario actual de la sesión |
| GET | `/owners/me/solicitud` | OWNER | Perfil, embarcaciones y documentos propios |
| GET | `/zones` | Público | Zonas de cobertura activas |
| GET | `/zones/admin` | ADMIN | Todas las zonas, activas e inactivas |
| POST | `/zones` | ADMIN | Crear zona de cobertura |
| PATCH | `/zones/:id` | ADMIN | Editar zona de cobertura |
| DELETE | `/zones/:id` | ADMIN | Desactivar zona de cobertura |
| GET | `/admin/solicitudes?status=PENDING` | ADMIN | Bandeja de solicitudes |
| PATCH | `/admin/solicitudes/:id/aprobar` | ADMIN | Aprobar perfil y embarcaciones tras revisar documentos |
| PATCH | `/admin/solicitudes/:id/rechazar` | ADMIN | Rechazar solicitud con nota |
| GET | `/admin/documents` | ADMIN | Listar documentos pendientes sin sus bytes |
| PATCH | `/admin/documents/:id/review` | ADMIN | Aprobar o rechazar un documento |
| GET | `/documents/:id/file` | Propietario o ADMIN | Descargar documento privado |
| GET | `/boats/admin/approved` | ADMIN | Listar embarcaciones elegibles para asignación |
| GET | `/boats/mine` | OWNER | Embarcaciones propias con su cobertura |
| GET | `/boats/:id` | OWNER | Detalle de una embarcación propia |
| POST | `/boats` | OWNER | Alta de embarcación propia |
| PATCH | `/boats/:id` | OWNER | Editar embarcación propia y su cobertura |
| POST | `/admin/trips` | ADMIN | Registrar solicitud de viaje |
| GET | `/admin/trips` | ADMIN | Listar viajes y clientes |
| PATCH | `/admin/trips/:id/assign` | ADMIN | Asignar embarcación |
| PATCH | `/admin/trips/:id/status` | ADMIN | Cambiar estado |
| POST | `/admin/trips/:id/review-link` | ADMIN | Generar enlace único de reseña |
| GET | `/public/reviews/:token` | Público | Validar token y contexto |
| POST | `/public/reviews/:token` | Público | Enviar calificación |

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
| Empty legs | `POST /admin/empty-legs` | Admin | Registrar tramo vacío |
| Empty legs | `GET /admin/empty-legs` | Admin | Listar tramos disponibles |
| Notifications | `GET /notifications` | Autenticado | Consultar notificaciones |

El registro/login escriben `nautiflow_session` como cookie `HttpOnly`, `SameSite=Lax`, con
`Path=/api/v1` y expiración configurada por `JWT_EXPIRES_IN`; en producción también lleva `Secure`.
`GET /auth/me` devuelve `{ "user": { "id", "name", "email", "role", "ownerStatus" } }`.
El logout expira la cookie en el cliente; el JWT stateless no se revoca en el servidor y sigue
siendo válido hasta su vencimiento si fue copiado fuera del navegador.

## Ejemplo de revisión de documento

```http
PATCH /api/v1/admin/documents/{documentId}/review
Authorization: Bearer <jwt>

{ "decision": "APPROVED", "comment": "Documentación legible y vigente" }
```

## Contratos de registro y operación

`POST /api/v1/auth/register/lanchero` recibe `multipart/form-data`: `name`, `email`, `password`,
`phone`, `whatsappPhone` opcional, `boatName`, `matricula`, `capacidad`, `descripcion` opcional,
`zonaIds` como JSON array y archivos `license`, `insurance`, `backgroundCheck` (obligatorios),
`photos` (opcional, máximo cinco). Se aceptan PDF/JPEG/PNG/WebP de hasta 5 MB por archivo. El
backend asigna `OWNER`, perfil/documentos/lancha en estado pendiente y crea todo en una transacción.

`POST /api/v1/auth/register/cliente` recibe JSON con `firstName`, `lastName`, `email`, `phone` y
`password`. El servidor asigna exclusivamente el rol `CLIENT`, hashea la contraseña y enlaza la
cuenta con el modelo `Cliente` existente. El alta de ambos tipos responde `202` con un mensaje
genérico y no inicia sesión automáticamente para evitar enumerar correos duplicados. Después del
alta, ambos pueden utilizar `POST /auth/login`; el admin inicial se crea solo con el seed.

Las decisiones admin reciben `{ "decision": "APPROVED" | "REJECTED", "note": "..." }`. Aprobar
un perfil requiere que licencia, seguro y antecedentes estén aprobados. Las operaciones de viaje
crean o reutilizan cliente por email opcional; solo asignan lanchas y lancheros aprobados con
capacidad suficiente. No hay endpoint ni formulario público de alta ADMIN: el primer administrador
se crea con el seed.

Los enlaces de reseña contienen 32 bytes aleatorios codificados en base64url. En la base solo se
guarda SHA-256, tienen validez de 14 días y `POST /public/reviews/:token` los consume atómicamente.
`PUBLIC_APP_URL` configura el origen que devuelve el enlace.

## Autenticación

- JWT en cookie HttpOnly (también se acepta `Authorization: Bearer <token>` para clientes API).
- `ADMIN` accede a revisión, documentos y viajes; `OWNER` a su estado, sus documentos y sus embarcaciones.
- `CLIENT` solo puede acceder a su dashboard y a enlaces públicos de reseña; no hay reservas públicas.
- El turista no tiene cuenta: entra por un enlace con token de reseña de uso único.
