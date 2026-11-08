# Base de datos

PostgreSQL 16 + Prisma 7. El esquema vive en `backend/prisma/schema.prisma`; las migraciones se
versionan en `backend/prisma/migrations`.

> Implementado: `User`, `Owner`, flota, documentos privados, clientes, viajes y reseñas/token.
> La unificación de `User`/`Owner`/`Role` queda pendiente (TECH-14) hasta que mergee US-01.

## Nomenclatura (D-010)

Regla: **dominio en español, vocabulario técnico en inglés** (`id`, `email`, `passwordHash`,
`createdAt`, `updatedAt`, `mimeType`, `tokenHash`). Todas las tablas de la base de datos están en
español. El renombre de las tablas legadas se hizo en la migración
`20261107100000_nomenclatura_bd` **solo a nivel de base de datos** (modelos Prisma, DTOs, rutas y
JSON conservan sus nombres hasta TECH-14, así que no cambió ninguna API).

| Tabla (BD) | Modelo Prisma | Contenido |
| --- | --- | --- |
| `usuarios` | `User` | cuentas con acceso (ADMIN/OWNER) |
| `lancheros` | `Owner` | propietarios de lanchas y su revisión |
| `documentos_lanchero` | `OwnerDocument` | archivos privados (BYTEA) |
| `clientes` | `Cliente` | contactos sin cuenta |
| `viajes` | `Trip` | viajes operativos |
| `salidas` | `Salida` | salidas publicables del catálogo |
| `tramos` | `Tramo` | ida/vuelta de una salida (precio y cupo) |
| `tramos_vacios` | `EmptyLeg` | retornos sin pasajeros |
| `reservas` | `Reserva` | solicitudes de reserva de turistas |
| `zonas` | `Zona` | zonas de cobertura |
| `embarcaciones` | `Embarcacion` | lanchas del lanchero |
| `embarcaciones_zonas` | `EmbarcacionZona` | cobertura N:M |
| `tokens_resena` | `ReviewToken` | enlace único de reseña |
| `resenas` | `Review` | reseñas con puntaje |

Tipos de enum: `Rol`, `EstadoUsuario`, `EstadoLanchero`, `TipoDocumento`, `EstadoDocumento`,
`EstadoViaje`, `EstadoTramoVacio`, `EstadoEmbarcacion`, `EstadoSalida`, `EstadoTramo`,
`TipoTramo`, `EstadoReserva`.

Las tablas de abajo describen los **campos del modelo Prisma (código)**. En las tablas legadas la
columna de la base de datos puede tener otro nombre (español) y la equivalencia está en la tabla
anterior: el código no cambió, solo cambió el nombre físico vía `@map`.

Pendiente (TECH-14 / Fase 2): renombrar también modelos, campos, DTOs, rutas y JSON del código, y
alinear `Role`/`Owner`. Los **valores** de enum en inglés (`PENDING`, `APPROVED`, ...) quedan para
esa fase: Prisma 7 tiene un bug conocido con `@map` en valores de enum.

## Implementado

### User

| Campo | Tipo | Reglas |
| --- | --- | --- |
| id | UUID | PK, `uuid()` |
| name | string | obligatorio |
| email | string | único |
| passwordHash | string | hash, nunca texto plano |
| role | `Role` | `ADMIN` \| `OWNER` (default `OWNER`; `ADMIN` lo asigna el seed). `CLIENT` queda como valor legado sin altas nuevas |
| status | `UserStatus` | `ACTIVE` \| `INACTIVE` (default `ACTIVE`) |
| createdAt / updatedAt | timestamp | automáticos |

### Owner

| Campo | Tipo | Reglas |
| --- | --- | --- |
| id | UUID | PK |
| userId | UUID | único, FK a `User` con `onDelete: Cascade` |
| phone | string? | contacto |
| whatsappPhone | string? | contacto WhatsApp opcional |
| status | `OwnerStatus` | `PENDING` \| `APPROVED` \| `REJECTED` |
| reviewNote / reviewedAt / reviewedById | texto / timestamp / UUID? | auditoría de revisión |

### Cliente

Registro de contacto de la agencia: nombre, teléfono y email opcional único. No tiene cuenta ni
credenciales; el administrador lo crea o reutiliza al registrar viajes. `userId` se conserva como
vínculo legado con cuentas `CLIENT` anteriores, que ya no pueden iniciar sesión. Las reseñas usan
enlaces únicos y no requieren cuenta.

### EstadoEmbarcacion

`PENDIENTE` | `VERIFICADA` | `RECHAZADA` | `INACTIVA`

### Zona

| Campo | Tipo | Reglas |
| --- | --- | --- |
| id | UUID | PK, `uuid()` |
| nombre | string | único |
| descripcion | string? | opcional |
| activa | boolean | default `true`; la baja es lógica |
| createdAt / updatedAt | timestamp | automáticos |

### Embarcacion

| Campo | Tipo | Reglas |
| --- | --- | --- |
| id | UUID | PK, `uuid()` |
| propietarioId | UUID | FK a `Owner`, `onDelete: Restrict` |
| nombre | string | obligatorio |
| matricula | string | único |
| capacidad | int | pasajeros |
| descripcion | string? | opcional |
| estado | `EstadoEmbarcacion` | default `PENDIENTE` |
| createdAt / updatedAt | timestamp | automáticos |

### EmbarcacionZona

Relación M:N con PK compuesta (`embarcacionId`, `zonaId`) y cascada en ambas FK.

## Entidades operativas

| Entidad | Responsabilidad / campos orientativos |
| --- | --- |
| OwnerDocument | owner/boat, tipo, bytes privados, MIME/size, estado, observación, fechas y admin revisor |
| Cliente | nombre, teléfono, email opcional único; no tiene cuenta |
| Trip | cliente, admin creador, fecha/hora, pasajeros, origen/destino, estado, embarcación opcional, salida/tramo opcional |
| ReviewToken | trip único, hash SHA-256, expiración, uso y creación |
| Review | trip único, embarcación opcional, rating (1–5), comentario |
| EmptyLeg | `tripId` de origen, `embarcacionId`, origen/destino invertidos, fecha/hora estimada, estado (legacy) |
| Salida | embarcación, fecha/hora de salida, estado, admin creador; contiene tramos |
| Tramo | salida, tipo IDA/VUELTA, origen/destino, fecha/hora, cupo, precio en centavos, `sinTuristas`, estado |
| Reserva | tramo y salida, contacto del turista (nombre, teléfono, email opcional), pasajeros, mensaje, snapshot de origen/destino/fecha/precio, estado, `cupoDescontado`, viaje vinculado, admin revisor y nota |
| Notification | `userId`, tipo, canal, resumen, estado de envío, fecha |

## Relaciones previstas

- Un `Owner` registra varias `Embarcacion`.
- Una `Embarcacion` cubre varias `Zona` (M:N) y tendrá varios documentos.
- Una `Embarcacion` realizará varios `Trip` y podrá recibir varias reseñas.
- Un `Trip` completado habilita como máximo una `Review`.
- Un `EmptyLeg` se origina en un viaje de ida y se asocia a la embarcación que regresa (legacy).
- Una `Salida` tiene uno o más `Tramo` (ida y vuelta opcional).
- Un `Trip` puede vincularse opcionalmente a una `Salida` y `Tramo` cuando nace de una reserva.
- Una `Reserva` apunta a un `Tramo` y a su `Salida`; al confirmarse crea un `Trip` con
  `tripId` único en la reserva. Un `Tramo` puede tener varias reservas; solo una queda
  `CONFIRMADA` por el cupo descontado.
- Un `Trip` cancelado anula su `Reserva` vinculada y restaura el cupo del `Tramo`.

## Estados

| Objeto | Estados |
| --- | --- |
| Lanchero / perfil | Pendiente · Aprobado · Rechazado |
| Embarcación | Pendiente · Verificada · Rechazada · Inactiva |
| Documento | Pendiente · Aprobado · Rechazado |
| Viaje | Pendiente · Asignado · Confirmado · Completado · Cancelado |
| Tramo vacío | Disponible · Ofrecido · Asignado · Cerrado (legacy) |
| Salida | Programada · Cancelada · Completada |
| Tramo de salida | Disponible · Reservado · Cerrado · Cancelado |
| Reserva | Pendiente · Confirmada · Rechazada · Cancelada |

## Reglas de integridad

- `rating` entero entre 1 y 5 (constraint en base).
- Máximo una reseña por viaje; el token se invalida con `usedAt` tras el envío.
- El token es aleatorio y se guarda como hash, nunca en claro.
- Una embarcación con documentos rechazados no aparece como elegible.
- La asignación de viaje es una acción explícita del administrador.
- Una embarcación no puede tener dos viajes o salidas activos dentro de `TRIP_SLOT_HOURS` horas
  (2 por defecto); los viajes `CANCELLED`/`COMPLETED` y las salidas `CANCELADA`/`COMPLETADA` no
  bloquean la franja.
- Todo documento registra revisor, fecha y decisión.
- `Review.rating` tiene un CHECK SQL de 1 a 5 y una FK a `Embarcacion`.
- Documentos de máximo 5 MiB se guardan como `BYTEA`; APIs de listado no devuelven el contenido.
- El tramo vacío invierte el recorrido del viaje y reutiliza su embarcación; solo se registra
  para viajes `ASSIGNED`/`CONFIRMED`, con regreso posterior a la salida y un tramo activo por viaje.
- El cupo de un `Tramo` nunca baja de 0: el descuento es un `updateMany` condicional
  (`estado = DISPONIBLE` y `cupo ≥ cantidad`) dentro de la transacción de confirmación, y el
  descuento solo ocurre en reservas `CONFIRMADA` (`cupoDescontado = true`).
- `cupoDescontado` evita restaurar el cupo dos veces; se limpia al cancelar. Un tramo con cupo 0
  queda `CERRADO` y se reabre manualmente desde el admin.

## Trabajo con migraciones

```bash
cd backend
npm run prisma:migrate -- --name nombre_del_cambio   # desarrollo
npm run prisma:deploy                                # aplicar en entornos
npm run prisma:studio                                # explorar datos
npm run prisma:seed                                  # datos de demo
```

Prisma 7 no ejecuta el seed automáticamente tras `migrate dev`: hay que invocarlo.

El seed de zonas corre por separado (nombres de dominio en español, D-010):

```bash
cd backend
npx tsx prisma/seed-zonas.ts   # Delta del Tigre, San Fernando, Escobar
```

Se integrará al `seed.ts` principal durante la unificación de nomenclatura (TECH-14).

## Pendientes de decisión

- Cómo se modela disponibilidad por fecha y horario.
- Campos obligatorios y representación de origen/destino del viaje.
