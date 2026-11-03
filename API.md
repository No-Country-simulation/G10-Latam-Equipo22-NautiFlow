# API

REST versionada bajo `/api/v1`. Documentación interactiva: `http://localhost:3000/api/docs`.

## Convenciones

- DTOs de entrada y salida: nunca se exponen entidades Prisma.
- Validación en backend con `class-validator`; el frontend valida como refuerzo.
- Guards por rol (`ADMIN`, `OWNER`) y por recurso.
- Códigos: `200/201`, `400`, `401`, `403`, `404`, `409`, `422`.
- Paginación en listados administrativos y públicos: `?page=1&limit=20` (máx. 100).
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
| POST | `/auth/login` | Público | Login y emisión de JWT en cookie HttpOnly |
| POST | `/auth/logout` | Público | Expirar la cookie de sesión |
| GET | `/auth/me` | Autenticado | Usuario actual de la sesión |
| PATCH | `/auth/me/password` | Autenticado | Cambiar la contraseña con la actual verificada |
| GET | `/owners/me/solicitud` | OWNER | Usuario, teléfonos, embarcaciones y documentos propios |
| PATCH | `/owners/me` | OWNER | Actualizar nombre, teléfono o WhatsApp propios |
| POST | `/owners/me/documents` | OWNER | Reenviar documentación y volver la solicitud a pendiente |
| POST | `/owners/me/solicitud/reabrir` | OWNER | Reabrir una solicitud rechazada |
| GET | `/zones` | Público | Zonas de cobertura activas |
| GET | `/zones/admin` | ADMIN | Todas las zonas, activas e inactivas |
| POST | `/zones` | ADMIN | Crear zona de cobertura |
| PATCH | `/zones/:id` | ADMIN | Editar zona de cobertura |
| DELETE | `/zones/:id` | ADMIN | Desactivar zona de cobertura |
| GET | `/admin/solicitudes?status=PENDING` | ADMIN | Bandeja de solicitudes paginada |
| PATCH | `/admin/solicitudes/:id/aprobar` | ADMIN | Aprobar perfil y embarcaciones tras revisar documentos |
| PATCH | `/admin/solicitudes/:id/rechazar` | ADMIN | Rechazar solicitud con nota |
| GET | `/admin/documents` | ADMIN | Listar documentos paginados (default pendientes) sin sus bytes |
| PATCH | `/admin/documents/:id/review` | ADMIN | Aprobar o rechazar un documento |
| GET | `/documents/:id/file` | Propietario o ADMIN | Descargar documento privado |
| GET | `/boats` | ADMIN | Buscar embarcaciones elegibles con filtros y paginación |
| GET | `/boats/admin/approved` | ADMIN | Listar embarcaciones elegibles para asignación |
| GET | `/boats/mine` | OWNER | Embarcaciones propias con su cobertura |
| GET | `/boats/:id` | OWNER | Detalle de una embarcación propia |
| POST | `/boats` | OWNER | Alta de embarcación propia |
| PATCH | `/boats/:id` | OWNER | Editar embarcación propia y su cobertura |
| POST | `/admin/trips` | ADMIN | Registrar solicitud de viaje |
| GET | `/admin/trips` | ADMIN | Listar viajes paginados con filtros de estado, texto y fechas |
| PATCH | `/admin/trips/:id/assign` | ADMIN | Asignar embarcación |
| PATCH | `/admin/trips/:id/status` | ADMIN | Cambiar estado |
| POST | `/admin/empty-legs` | ADMIN | Registrar tramo vacío de regreso |
| GET | `/admin/empty-legs` | ADMIN | Listar tramos vacíos con filtros y paginación |
| POST | `/admin/salidas` | ADMIN | Crear salida con tramos (ida/vuelta) |
| GET | `/admin/salidas` | ADMIN | Listar salidas con filtros y paginación |
| GET | `/admin/salidas/:id` | ADMIN | Detalle de salida con tramos |
| PATCH | `/admin/salidas/:id` | ADMIN | Actualizar estado o fecha de salida |
| PATCH | `/admin/salidas/:salidaId/tramos/:tramoId` | ADMIN | Actualizar cupo, precio, fecha o estado de un tramo |
| GET | `/public/salidas` | Público | Catálogo de salidas disponibles con filtros |
| GET | `/public/salidas/:id` | Público | Detalle público de salida con tramos y rating |
| POST | `/admin/trips/:id/review-link` | ADMIN | Generar enlace único de reseña |
| GET | `/public/reviews/:token` | Público | Validar token y contexto |
| POST | `/public/reviews/:token` | Público | Enviar calificación |
| GET | `/public/boats` | Público | Catálogo de embarcaciones verificadas con su reputación |
| GET | `/public/boats/:id` | Público | Detalle público con promedio y últimas reseñas |
| GET | `/public/boats/:id/reviews` | Público | Reseñas públicas de una embarcación |
| POST | `/public/reservas` | Público | Crear solicitud de reserva sin cuenta (rate limit) |
| GET | `/admin/reservas` | ADMIN | Listar reservas con filtros y paginación |
| GET | `/admin/reservas/:id` | ADMIN | Detalle de una reserva |
| POST | `/admin/reservas/:id/confirmar` | ADMIN | Confirmar reserva, descontar cupo y crear viaje |
| PATCH | `/admin/reservas/:id/estado` | ADMIN | Rechazar o cancelar reserva (restaura cupo) |
| GET | `/admin/dashboard/resumen` | ADMIN | Contadores del panel administrativo |

> **Nombres del plan técnico alineados a la implementación:** `/boats/mine` (el plan decía
> `/boats/me`), `POST /owners/me/documents` (el plan decía `POST /boats/:id/documents`) y
> `GET /boats` con rol ADMIN (el plan decía `GET /admin/boats/search`). No hay alias: se
> documentan las rutas reales que ya consume el front.

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

### `GET /api/v1/boats` (ADMIN)

Búsqueda paginada de embarcaciones elegibles: propietario aprobado y usuario activo.
Por defecto solo devuelve embarcaciones en estado `VERIFICADA`.

| Query | Tipo | Descripción |
| --- | --- | --- |
| `zonaId` | UUID | Zona que debe cubrir la embarcación |
| `capacidadMin` | entero ≥ 1 | Capacidad mínima de pasajeros |
| `estado` | `PENDIENTE`, `VERIFICADA`, `RECHAZADA`, `INACTIVA` | Default `VERIFICADA` |
| `q` | texto | Busca en nombre y matrícula sin distinguir mayúsculas |
| `fechaHora` | fecha ISO | Excluye lanchas con viaje `PENDING`/`ASSIGNED`/`CONFIRMED` o salida `PROGRAMADA` en esa franja (± `TRIP_SLOT_HOURS`); si es solo fecha se usa 00:00 UTC |
| `page` / `limit` | entero | `page` desde 1; `limit` de 1 a 100 (default 20) |

```json
{
  "data": [
    {
      "id": "uuid",
      "nombre": "Lancha Delta 1",
      "matricula": "ABC-123",
      "capacidad": 8,
      "estado": "VERIFICADA",
      "descripcion": null,
      "propietario": {
        "phone": "+5491100000000",
        "whatsappPhone": "+5491100000000",
        "user": { "name": "Nombre del propietario" }
      },
      "zonas": [{ "zona": { "id": "uuid", "nombre": "Delta del Tigre" } }]
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

`GET /boats/admin/approved` se mantiene como listado simple (`id`, `nombre`, `matricula`,
`capacidad`) para la asignación de viajes desde el panel admin.

### `GET /api/v1/public/boats`

Catálogo público de embarcaciones elegibles (verificadas, con propietario aprobado y usuario
activo) junto con su reputación agregada. Acepta `zonaId`, `page` y `limit`.

```json
{
  "data": [
    {
      "id": "uuid",
      "nombre": "Lancha Delta 1",
      "capacidad": 8,
      "descripcion": null,
      "propietario": {
        "whatsappPhone": "+5491100000000",
        "user": { "name": "Nombre del propietario" }
      },
      "zonas": [{ "zona": { "id": "uuid", "nombre": "Delta del Tigre" } }],
      "rating": { "average": 4.7, "total": 3 }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

`average` es `null` cuando la embarcación no tiene reseñas y se redondea a un decimal.
`GET /public/boats/:id` incluye las últimas cinco reseñas y `GET /public/boats/:id/reviews`
pagina todas las reseñas. Solo se exponen embarcaciones elegibles; el resto responde `404`.
No se exponen matrícula, teléfono ni email del propietario: solo el WhatsApp de contacto.

### `POST /api/v1/admin/empty-legs` (ADMIN)

```json
{ "tripId": "uuid", "scheduledAt": "2026-11-01T18:00:00.000Z" }
```

Registra el regreso en vacío de un viaje de ida. La embarcación, el origen y el destino se
derivan del viaje: el tramo sale del destino y vuelve al origen con la misma lancha. Solo se
aceptan viajes `ASSIGNED` o `CONFIRMED` con embarcación asignada, y `scheduledAt` debe ser
posterior a la salida del viaje. Un viaje admite un solo tramo activo (todo lo que no esté
`CLOSED`); repetirlo responde `409`.

### `GET /api/v1/admin/empty-legs` (ADMIN)

Lista paginada ordenada por hora de regreso. `status` filtra por estado (por defecto
`AVAILABLE`); `page` y `limit` siguen la convención general. Cada fila incluye la lancha, el
lanchero y los datos del viaje de origen.

## Catálogo de salidas

`POST /api/v1/admin/salidas` crea una salida con sus tramos en una transacción. Recibe JSON:

```json
{
  "embarcacionId": "uuid",
  "fechaSalida": "2026-11-01T10:00:00.000Z",
  "tramos": [
    { "tipo": "IDA", "origen": "Delta del Tigre", "destino": "Tigre Centro", "fechaHora": "2026-11-01T10:00:00.000Z", "precioCentavos": 50000 },
    { "tipo": "VUELTA", "origen": "Tigre Centro", "destino": "Delta del Tigre", "fechaHora": "2026-11-01T18:00:00.000Z", "precioCentavos": 40000, "sinTuristas": true, "cupo": 8 }
  ]
}
```

Reglas:
- La lancha debe estar `VERIFICADA`, el lanchero `APPROVED` y el usuario `ACTIVE`.
- `fechaSalida` debe ser futura.
- Exactamente un tramo `IDA` y como máximo uno `VUELTA`.
- El tramo de IDA no puede ser anterior a la salida; el de VUELTA debe ser posterior.
- `cupo` por defecto igual a la capacidad de la lancha (0 a 100).
- `precioCentavos` en centavos, mínimo 0.
- `sinTuristas` marca un tramo de regreso vacío (default `false`).
- No puede superponerse con otros viajes o salidas de la misma lancha en `TRIP_SLOT_HOURS`. La
  validación cubre `fechaSalida` y cada `fechaHora` de los tramos.

`GET /api/v1/public/salidas` lista salidas `PROGRAMADA` futuras de lanchas elegibles. Filtros:

| Query | Tipo | Descripción |
| --- | --- | --- |
| `zonaId` | UUID | Zona que debe cubrir la lancha |
| `fechaDesde` / `fechaHasta` | fecha ISO | Rango de fecha de salida |
| `origen` / `destino` | texto | Filtra por el tramo IDA |
| `page` / `limit` | entero | Convención general |

Cada item incluye lancha pública, rating de la embarcación, tramos con precio/cupo y un campo
`disponible` que indica si algún tramo está `DISPONIBLE` con cupo > 0.

`GET /api/v1/public/salidas/:id` devuelve el detalle con las últimas 5 reseñas de la lancha.

`PATCH /api/v1/admin/salidas/:id` actualiza `estado` (`PROGRAMADA`, `CANCELADA`, `COMPLETADA`) o
`fechaSalida` (con re-validación de disponibilidad). Al cambiar `fechaSalida`, todos los tramos se
desplazan por el mismo delta y se re-validan sus fechas.

`PATCH /api/v1/admin/salidas/:salidaId/tramos/:tramoId` actualiza campos de un tramo:

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `estado` | `DISPONIBLE`, `RESERVADO`, `CERRADO`, `CANCELADO` | Estado del tramo |
| `cupo` | entero 0–100 | No puede superar la capacidad de la lancha |
| `precioCentavos` | entero ≥ 0 | Precio en centavos |
| `fechaHora` | fecha ISO | Debe ser futura; re-valida disponibilidad |
| `sinTuristas` | boolean | Marca el tramo como vacío |

Al cambiar `fechaHora`, se re-valida la disponibilidad contra otras salidas/viajes y entre los
tramos de la misma salida. El tramo IDA no puede quedar anterior a la salida; el VUELTA debe ser
posterior.

## Listados de viajes, solicitudes y documentos

Los tres listados de la bandeja de operación responden el formato paginado
`{ "data": [...], "meta": { "page", "limit", "total", "totalPages" } }`.

`GET /api/v1/admin/trips` (ADMIN), ordenado por `scheduledAt` descendente:

| Query | Tipo | Descripción |
| --- | --- | --- |
| `status` | `PENDING`, `ASSIGNED`, `CONFIRMED`, `COMPLETED`, `CANCELLED` | Estado del viaje |
| `q` | texto | Cliente (nombre, teléfono o email), origen o destino, sin distinguir mayúsculas |
| `fechaDesde` / `fechaHasta` | fecha ISO | Rango sobre `scheduledAt`; si es solo fecha se usa el día completo en UTC |
| `page` / `limit` | entero | Convención general |

`GET /api/v1/admin/solicitudes` (ADMIN), ordenado por `createdAt` ascendente, con `status`
opcional (`PENDING`, `APPROVED`, `REJECTED`) para filtrar por estado de la solicitud.

`GET /api/v1/admin/documents` (ADMIN), ordenado por `createdAt` ascendente: `status` por defecto
`PENDING` y `type` opcional (`LICENSE`, `INSURANCE`, `BACKGROUND_CHECK`, `PHOTO`) para recorrer el
resto de la bandeja.

## Reservas

`POST /api/v1/public/reservas` crea una solicitud de reserva sin cuenta de usuario:

```json
{
  "tramoId": "uuid",
  "nombre": "María Pérez",
  "telefono": "+5491100000000",
  "email": "maria@correo.com",
  "cantidadPasajeros": 2,
  "mensaje": "Llegamos 10 minutos antes"
}
```

Reglas:
- `nombre` (2–80), `telefono` (8–20) y `cantidadPasajeros` (1–50) son obligatorios; `email` y
  `mensaje` son opcionales.
- El tramo debe existir, estar `DISPONIBLE`, con salida `PROGRAMADA` futura y fecha futura.
- Debe haber cupo ≥ `cantidadPasajeros` y la cantidad no puede superar la capacidad de la lancha.
- La embarcación debe estar `VERIFICADA` con lanchero `APPROVED` y usuario `ACTIVE`.
- La reserva nace `PENDIENTE` **sin descontar cupo** y guarda un snapshot de `origen`, `destino`,
  `fechaHora` y `precioCentavos`.
- Responde `201` con la reserva; `404` si el tramo no existe, `409` si no está disponible y `429`
  por rate limit (`POST /public/reservas` usa el mismo contador que login y registro).

Gestión admin:

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/admin/reservas` | Listado paginado. Filtros: `estado`, `salidaId`, `tramoId`, `fechaDesde`/`fechaHasta` (sobre `createdAt`) y `q` (nombre, teléfono o email) |
| GET | `/admin/reservas/:id` | Detalle con tramo, salida, lancha, cliente y viaje vinculado |
| POST | `/admin/reservas/:id/confirmar` | Confirma la reserva `PENDIENTE` |
| PATCH | `/admin/reservas/:id/estado` | `{ "estado": "RECHAZADA" \| "CANCELADA", "nota": "..." }` |

`confirmar` corre en una transacción:
1. Re-valida la disponibilidad de la franja de la lancha excluyendo la salida y el tramo de la
   propia reserva.
2. Descuenta el cupo con un `updateMany` condicional (`estado = DISPONIBLE` y `cupo ≥ cantidad`);
   si nadie lo tomó responde `409`.
3. Si el cupo llega a 0, cierra el tramo (`CERRADO`); el admin lo reabre a mano.
4. Crea o reutiliza cliente por email y crea el `Trip` `CONFIRMED` vinculado (`salidaId`, `tramoId`).
5. Marca la reserva `CONFIRMADA` con `cupoDescontado: true`.

`PATCH /admin/reservas/:id/estado` admite solo transiciones desde `PENDIENTE` (a `RECHAZADA` o
`CANCELADA`) y desde `CONFIRMADA` (únicamente a `CANCELADA`). Cancelar
una reserva confirmada restaura el cupo (y reabre el tramo si estaba `CERRADO`), deja su viaje en
`CANCELLED` y limpia `cupoDescontado` para no restaurar dos veces. No se permite cancelar si el
viaje ya está `COMPLETED` (`409`).

Cancelar un viaje desde `PATCH /admin/trips/:id/status` anula automáticamente la reserva vinculada
con las mismas reglas de restauración.

### `GET /api/v1/admin/dashboard/resumen` (ADMIN)

```json
{
  "reservasPendientes": 3,
  "viajesPorOperar": 5,
  "solicitudesLancheroPendientes": 2,
  "documentosPendientes": 7,
  "salidasProgramadas": 4
}
```

## Rutas planificadas no implementadas

| Módulo | Método y ruta | Rol | Uso |
| --- | --- | --- | --- |
| Notifications | `GET /notifications` | Autenticado | Consultar notificaciones (módulo aún sin implementar) |

El registro/login escriben `nautiflow_session` como cookie `HttpOnly`, `SameSite=Lax`, con
`Path=/api/v1` y expiración configurada por `JWT_EXPIRES_IN`; en producción también lleva `Secure`.
`GET /auth/me` devuelve `{ "user": { "id", "name", "email", "role", "ownerStatus" } }`.
El logout expira la cookie en el cliente; el JWT stateless no se revoca en el servidor y sigue
siendo válido hasta su vencimiento si fue copiado fuera del navegador.

## Ejemplo de revisión de documento

```http
PATCH /api/v1/admin/documents/{documentId}/review
Authorization: Bearer <jwt>

{ "decision": "APPROVED", "note": "Documentación legible y vigente" }
```

## Reenvío de documentación

`POST /api/v1/owners/me/documents` recibe `multipart/form-data` con los mismos campos de archivo
del registro (`license`, `insurance`, `backgroundCheck`, `photos`), todos opcionales pero con al
menos uno presente. Para licencia, seguro y antecedentes reemplaza el último documento de ese tipo
y lo deja en `PENDING`, limpiando la observación previa; las fotos reemplazan el conjunto actual.
Solo se permite mientras la solicitud está `PENDING` o `REJECTED`; si ya está `APPROVED` responde
`409`. Si la solicitud estaba `REJECTED`, la vuelve a `PENDING` y devuelve sus lanchas `RECHAZADA`
a `PENDIENTE`.

`POST /api/v1/owners/me/solicitud/reabrir` vuelve a `PENDING` una solicitud rechazada sin subir
archivos (por ejemplo, cuando solo hay que corregir datos de la lancha). Responde `409` si la
solicitud no está `REJECTED`.

## Perfil y contraseña del lanchero

`GET /api/v1/owners/me/solicitud` incluye `user` (`id`, `name`, `email`), `phone` y
`whatsappPhone` además del estado de la solicitud, sus embarcaciones y sus documentos.

`PATCH /api/v1/owners/me` recibe JSON con campos opcionales `name` (2 a 100), `phone` (8 a 30) y
`whatsappPhone` (opcional; enviar vacío o `null` lo limpia). Actualiza el nombre en la cuenta y
los teléfonos en la ficha del propietario en una transacción, y devuelve la solicitud
actualizada. No se puede cambiar `email` porque es el identificador de login. Responde `404` si
el usuario no tiene ficha de propietario.

`PATCH /api/v1/owners/me` es solo para `OWNER` y `PATCH /api/v1/auth/me/password` recibe
`{ "currentPassword": "...", "newPassword": "..." }` con `newPassword` de 10 a 128 caracteres.
Verifica la contraseña actual con `bcrypt`, exige que la nueva sea distinta y reemplaza el hash;
responde `400` si la actual es incorrecta o la nueva es igual a la anterior. Comparte el rate
limit de login (`AUTH_RATE_LIMIT_MAX` intentos por IP). El JWT es stateless: al cambiar la
contraseña las sesiones ya emitidas siguen válidas hasta vencer.

## Contratos de registro y operación

`POST /api/v1/auth/register/lanchero` recibe `multipart/form-data`: `name`, `email`, `password`,
`phone`, `whatsappPhone` opcional, `boatName`, `matricula`, `capacidad`, `descripcion` opcional,
`zonaIds` como JSON array y archivos `license`, `insurance`, `backgroundCheck` (obligatorios),
`photos` (opcional, máximo cinco). Se aceptan PDF/JPEG/PNG/WebP de hasta 5 MB por archivo. El
backend asigna `OWNER`, perfil/documentos/lancha en estado pendiente y crea todo en una transacción.

No existe alta de cuentas de cliente. El registro de lanchero responde `202` con un mensaje
genérico y no inicia sesión automáticamente para evitar enumerar correos duplicados. Después del
alta, el lanchero puede utilizar `POST /auth/login`; el admin inicial se crea solo con el seed y
las cuentas `CLIENT` legadas ya no pueden iniciar sesión.

Las decisiones admin reciben `{ "decision": "APPROVED" | "REJECTED", "note": "..." }`. Aprobar
un perfil requiere que licencia, seguro y antecedentes estén aprobados. Las operaciones de viaje
crean o reutilizan cliente por email opcional; solo asignan lanchas y lancheros aprobados con
capacidad suficiente. Una lancha no puede quedar en dos viajes o salidas activos dentro de la
misma franja: se rechaza con `409` si hay otro viaje `PENDING`/`ASSIGNED`/`CONFIRMED` o salida
`PROGRAMADA` a menos de `TRIP_SLOT_HOURS` horas (2 por defecto), tanto al crear viajes o salidas
como al asignar embarcaciones. No hay endpoint ni formulario público de alta ADMIN: el primer
administrador se crea con el seed.

Los enlaces de reseña contienen 32 bytes aleatorios codificados en base64url. En la base solo se
guarda SHA-256, tienen validez de 14 días y `POST /public/reviews/:token` los consume atómicamente.
`PUBLIC_APP_URL` configura el origen que devuelve el enlace.

## Autenticación

- JWT en cookie HttpOnly (también se acepta `Authorization: Bearer <token>` para clientes API).
- `ADMIN` accede a revisión, documentos, viajes, reservas y dashboard; `OWNER` a su estado, sus
  documentos y sus embarcaciones.
- No existen cuentas de cliente ni dashboard de turista: el turista reserva sin cuenta
  (`POST /public/reservas`) y entra a la reseña por un enlace con token de uso único.

## Límites y cabeceras

- `POST /auth/login`, `POST /auth/register/lanchero` (y su alias `register`) y
  `POST /public/reservas` aceptan hasta `AUTH_RATE_LIMIT_MAX` intentos por IP cada
  `AUTH_RATE_LIMIT_WINDOW_SECONDS` segundos (10 por
  minuto por defecto). Al superarlo responden
  `429` con `codigo: "DEMASIADAS_PETICIONES"`. El contador es en memoria: con más de una instancia
  del backend hay que moverlo a un almacén compartido.
- Helmet agrega cabeceras de seguridad (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Strict-Transport-Security`, entre otras) y oculta `X-Powered-By`. La CSP se
  desactiva porque la API solo devuelve JSON y la UI de Swagger la necesita permisiva.
- CORS solo acepta los orígenes listados en `CORS_ORIGIN` y viaja con credenciales.
