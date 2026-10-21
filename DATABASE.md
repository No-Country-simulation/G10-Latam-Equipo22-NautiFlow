# Base de datos

PostgreSQL 16 + Prisma 7. El esquema vive en `backend/prisma/schema.prisma`; las migraciones se
versionan en `backend/prisma/migrations`.

> Modelo inicial implementado: `User` y `Owner`. El resto de las entidades está especificado para
> las próximas etapas y debe validarse con el referente de negocio.

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

## Entidades planificadas

| Entidad | Responsabilidad / campos orientativos |
| --- | --- |
| Boat | `ownerId`, nombre/identificador, capacidad, descripción, estado, cobertura |
| Zone | Zona de cobertura; relación muchos a muchos con `Boat` |
| BoatDocument | `boatId`/`ownerId`, tipo, `storageKey`, estado de revisión, observación, fechas y admin revisor |
| Trip | fecha/hora, pasajeros, zona/origen/destino, estado, `boatId` opcional |
| ReviewToken | `tripId`, `tokenHash`, `expiresAt`, `usedAt`, `createdAt` |
| Review | `tripId`, `boatId`, `rating` (1–5), `comment`, `createdAt` |
| EmptyLeg | `tripId` de origen, `boatId`, zona/origen/destino, fecha/hora estimada, estado |
| Notification | `userId`, tipo, canal, resumen, estado de envío, fecha |

## Relaciones previstas

- Un `Owner` registra varias `Boat`.
- Una `Boat` cubre varias `Zone` (M:N) y tiene varios documentos.
- Una `Boat` realiza varios `Trip`.
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

## Pendientes de decisión

- Nivel de aprobación: propietario, embarcación, documento o combinación (ver `DECISIONS.md`).
- Cómo se modela disponibilidad por fecha y horario.
- Campos obligatorios y representación de origen/destino del viaje.
