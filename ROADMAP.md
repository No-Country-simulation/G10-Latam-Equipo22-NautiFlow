# Roadmap

Las etapas expresan dependencias y resultados, no fechas comprometidas. El objetivo del MVP es
cerrar el circuito operativo completo, no sumar herramientas.

## Circuito vertical prioritario

Registro de lanchero → alta de embarcación y documentos → revisión del administrador → búsqueda y
asignación de viaje → completar viaje → generar enlace de reseña → turista envía reseña →
actualizar reputación.

## Etapas

| Etapa | Objetivo | Entregable |
| --- | --- | --- |
| 0. Descubrimiento | Validar actores, flujos, MVP, datos, UX y arquitectura | Alcance acordado, backlog priorizado y documentación inicial |
| 1. Fundaciones | Monorepo, React, NestJS, PostgreSQL, Prisma, Docker Compose, CI y Swagger | Entorno reproducible y primera migración |
| 2. Usuarios y flota | Registro/login, roles, perfil de lanchero, embarcaciones, zonas y documentos | Lanchero carga perfil, embarcación y documentación |
| 3. Operación admin | Dashboard, revisión manual, filtros de flota, solicitudes y asignación | Agencia verifica y gestiona el circuito de viaje |
| 4. Reputación y retornos | Token de reseña, vista pública, calificación, promedio, landing y tramos vacíos | Reputación visible y bolsa de retornos operativa |
| 5. Calidad y entrega | Tests, seguridad, UX, despliegue, documentación y demo | MVP desplegado, probado y presentable |

## Estado actual

- **Etapas 1 a 4 completadas en su circuito**: fundaciones, usuarios/flota, operación admin y
  reputación con reservas (`US-17`, `US-18`), catálogo público y dashboard.
- **Etapa 5 avanzada**: backend y frontend desplegados en producción (Render + Vercel, rama
  `develop`), CORS/cookies cross-site configurados, CI en verde y 176 tests unitarios. Pendiente
  la demo final (E2E `QA-02`), la fusión de `main` al cerrar el sprint y `TECH-14` Fase 2
  (nomenclatura al español, pospuesta por riesgo).

## Límites del MVP

- La verificación de identidad y documentación es manual (sin APIs gubernamentales).
- El turista no crea cuenta: consulta el catálogo público, solicita reserva sin registrarse y el
  admin la confirma o rechaza desde el panel (el contacto posterior puede seguir por WhatsApp).
  El turista también deja reseñas con un token único.
- La búsqueda filtra; no asigna automáticamente por GPS ni implementa un algoritmo tipo Uber.
- La bolsa de tramos vacíos es un tablero interno, sin subastas ni notificaciones geolocalizadas.
- WhatsApp se usa mediante enlaces `wa.me` con mensaje prearmado.

## Fuera de alcance

Microservicios, apps móviles nativas, pagos online, integraciones con Prefectura, IA y
automatización de WhatsApp. Se evalúan después de cerrar el circuito principal.
