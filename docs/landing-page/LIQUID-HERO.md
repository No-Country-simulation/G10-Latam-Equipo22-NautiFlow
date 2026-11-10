# Efecto líquido del Hero

Componente: `frontend/src/components/LiquidCursorEffect.tsx`
Montaje: `frontend/src/pages/LandingPage.tsx` (dentro del hero, tras `.nf-hero-overlay`).

## Qué hace

Canvas 2D superpuesto al hero que dibuja, siguiendo el puntero:

1. **Glow radial** pegado a la posición exacta del cursor (sin lerp → sin rezago ni titileo), color `rgba(127, 209, 193, α)` (el accent de NautiFlow), radio 88 px.
2. **Ondas concéntricas** que se emiten al moverse (máx. 18 simultáneas, una cada 36 px recorridos), en verde accent y blanco. Cada onda:
   - se expande lento (`RIPPLE_SPEED = 0.9` × factor aleatorio 0.75–1.25 por onda);
   - se **disuelve** con curva `fadeOut = (1 − progress)^1.7` (cola larga y suave, sin corte seco);
   - se **difumina progresivamente** con `ctx.filter = blur(0.6px → 3.8px)` según se aleja (se disuelve como agua);
   - entra con un fade-in rápido para no aparecer de golpe.
   - composite `screen` para que se sumen luminosamente sin tapar el contenido.

## Decisiones de implementación

- **Sin `setState` en el bucle de animación**: todo en `refs` + `requestAnimationFrame` (cero re-renders por frame).
- **DPR limitado a 1.5** para no disparar el costo en pantallas 4K/retina.
- **`ResizeObserver`** para mantener el canvas sincronizado con el hero.
- **`visibilitychange`**: pausa el loop con la pestaña oculta.
- **Idle-stop**: tras ~1.2 s sin movimiento el glow se desvanece (`glowAlpha` decreciente) y, cuando no quedan ondas, se limpia el canvas y se detiene el loop. Se reactiva con el próximo `pointermove`.
- **Sólo puntero fino**: se ignora `pointerType === 'touch'`.
- **Montaje condicional**: `(hover: hover) and (pointer: fine)` — en táctil no se monta el componente.
- **`prefers-reduced-motion`**: no se monta (respeto a usuarios con movimiento reducido).
- **Limpieza total** al desmontar: listeners, `rAF`, `ResizeObserver`, `visibilitychange`.
- El canvas es `pointer-events: none` + `aria-hidden` (pura decoración).

## CSS asociado

`.nf-liquid-canvas` en `global.css` (`position: absolute; inset: 0; z-index: 1`).

## Accesibilidad

- Decorativo: sin rol semántico, oculto para lectores de pantalla.
- Desactivado con `prefers-reduced-motion: reduce`.
