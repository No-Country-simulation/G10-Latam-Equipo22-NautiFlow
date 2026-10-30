# Base de datos

PostgreSQL 16 + Prisma 7. El esquema vive en `backend/prisma/schema.prisma`; las migraciones se
versionan en `backend/prisma/migrations`.

> Implementado: `User`, `Owner`, flota, documentos privados, clientes, viajes y reseñas/token.
> La unificación de `User`/`Owner`/`Role` queda pendiente (TECH-14) hasta que mergee US-01.

## Implementado

### User

| Campo | Tipo | Reglas |
| --- | --- | --- |
| id | UUID | PK, `uuid()` |
| name | string | obligatorio |
| email | string | único |
| passwordHash | string | hash, nunca texto plano |
| role | `Role` | `ADMIN` \| `OWNER` \| `CLIENT` (default `OWNER`; el cliente y admin los asigna el backend) |
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

Un cliente operativo puede no tener cuenta. Cuando crea una cuenta, `userId` enlaza el registro a
un `User` con rol `CLIENT`; el cliente no puede escoger su rol. Las reseñas usan enlaces únicos y
no requieren cuenta.
| createdAt / updatedAt | timestamp | automáticos |

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
| Trip | cliente, admin creador, fecha/hora, pasajeros, origen/destino, estado, embarcación opcional |
| ReviewToken | trip único, hash SHA-256, expiración, uso y creación |
| Review | trip único, embarcación opcional, rating (1–5), comentario |
| EmptyLeg | `tripId` de origen, `embarcacionId`, origen/destino invertidos, fecha/hora estimada, estado |
| Notification | `userId`, tipo, canal, resumen, estado de envío, fecha |

## Relaciones previstas

- Un `Owner` registra varias `Embarcacion`.
- Una `Embarcacion` cubre varias `Zona` (M:N) y tendrá varios documentos.
- Una `Embarcacion` realizará varios `Trip` y podrá recibir varias reseñas.
- Un `Trip` completado habilita como máximo una `Review`.
- Un `EmptyLeg` se origina en un viaje de ida y se asocia a la embarcación que regresa.

## Estados

| Objeto | Estados |
| --- | --- |
| Lanchero / perfil | Pendiente · Aprobado · Rechazado |
| Embarcación | Pendiente · Verificada · Rechazada · Inactiva |
| Documento | Pendiente · Aprobado · Rechazado |
| Viaje | Pendiente · Asignado · Confirmado · Completado · Cancelado |
| Tramo vacío | Disponible · Ofrecido · Asignado · Cerrado |

## Reglas de integridad

- `rating` entero entre 1 y 5 (constraint en base).
- Máximo una reseña por viaje; el token se invalida con `usedAt` tras el envío.
- El token es aleatorio y se guarda como hash, nunca en claro.
- Una embarcación con documentos rechazados no aparece como elegible.
- La asignación de viaje es una acción explícita del administrador.
- Una embarcación no puede tener dos viajes activos dentro de `TRIP_SLOT_HOURS` horas (2 por
  defecto); los viajes `CANCELLED` y `COMPLETED` no bloquean la franja.
- Todo documento registra revisor, fecha y decisión.
- `Review.rating` tiene un CHECK SQL de 1 a 5 y una FK a `Embarcacion`.
- Documentos de máximo 5 MiB se guardan como `BYTEA`; APIs de listado no devuelven el contenido.
- El tramo vacío invierte el recorrido del viaje y reutiliza su embarcación; solo se registra
  para viajes `ASSIGNED`/`CONFIRMED`, con regreso posterior a la salida y un tramo activo por viaje.

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
