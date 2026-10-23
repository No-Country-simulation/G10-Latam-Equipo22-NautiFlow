# Base de datos

PostgreSQL 16 + Prisma 7. El esquema vive en `backend/prisma/schema.prisma`; las migraciones se
versionan en `backend/prisma/migrations`.

> Implementado: `User` y `Owner` (inglés, heredado del esqueleto) más el modelo de flota en
> español (`Zona`, `Embarcacion`, `EmbarcacionZona`, por D-010). El resto de las entidades está
> especificado para las próximas etapas y debe validarse con el referente de negocio.
> La unificación de `User`/`Owner`/`Role` queda pendiente (TECH-14) hasta que mergee US-01.

## Implementado

### User

| Campo | Tipo | Reglas |
| --- | --- | --- |
| id | UUID | PK, `uuid()` |
| name | string | obligatorio |
| email | string | único |
| passwordHash | string | hash, nunca texto plano |
| role | `Role` | `ADMIN` \| `OWNER` (default `OWNER`) |
| status | `UserStatus` | `ACTIVE` \| `INACTIVE` (default `ACTIVE`) |
| createdAt / updatedAt | timestamp | automáticos |

### Owner

| Campo | Tipo | Reglas |
| --- | --- | --- |
| id | UUID | PK |
| userId | UUID | único, FK a `User` con `onDelete: Cascade` |
| phone | string? | contacto |
| status | `OwnerStatus` | `PENDING` \| `APPROVED` \| `REJECTED` |
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

## Entidades planificadas

| Entidad | Responsabilidad / campos orientativos |
| --- | --- |
| BoatDocument | `embarcacionId`/`propietarioId`, tipo, `storageKey`, estado de revisión, observación, fechas y admin revisor |
| Trip | fecha/hora, pasajeros, zona/origen/destino, estado, `embarcacionId` opcional |
| ReviewToken | `tripId`, `tokenHash`, `expiresAt`, `usedAt`, `createdAt` |
| Review | `tripId`, `embarcacionId`, `rating` (1–5), `comment`, `createdAt` |
| EmptyLeg | `tripId` de origen, `embarcacionId`, zona/origen/destino, fecha/hora estimada, estado |
| Notification | `userId`, tipo, canal, resumen, estado de envío, fecha |

## Relaciones previstas

- Un `Owner` registra varias `Embarcacion`.
- Una `Embarcacion` cubre varias `Zona` (M:N) y tendrá varios documentos.
- Una `Embarcacion` realizará varios `Trip`.
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
- Todo documento registra revisor, fecha y decisión.

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

- Nivel de aprobación: propietario, embarcación, documento o combinación (ver `DECISIONS.md`).
- Cómo se modela disponibilidad por fecha y horario.
- Campos obligatorios y representación de origen/destino del viaje.
