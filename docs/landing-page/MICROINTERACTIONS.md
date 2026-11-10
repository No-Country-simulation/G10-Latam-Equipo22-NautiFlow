# Microinteracciones y loaders

Regla acordada: **solo visual, cero lógica**. Ningún loader altera el estado de envíos, auth ni validaciones.

## Loader Wavy #12

Componente: `frontend/src/components/WavyLoader.tsx`
CSS: `.nf-wavy-*` en `global.css` (original de css-loaders.com/wavy, sección `#l12`).

- Efecto gooey clásico: `filter: blur(4px) contrast(12)`.
- **Problema**: `contrast(12)` vuelve negro el verde de marca por canal.
- **Solución**: filtro SVG `feColorMatrix` (id único con `useId`) que mapea negro → `#0b6b5f` y blanco → blanco, con `colorInterpolationFilters="sRGB"`. Se aplica como `filter: blur(4px) contrast(12) url(#id)`.
- Props: `label` (texto visible), `size: 'md' | 'sm'`, `className`.
- El label usa `.nf-wavy-label` (visible, no sr-only).

### Dónde se usa

| Ubicación | Cuándo |
|-----------|--------|
| `LandingPage` | Carga de la flota (`loadingFlota`) |
| `ProtectedRoute` | Verificando sesión |
| `StatusPage` | Consultando el viaje |
| `LoginPage` | Session loading + botón "Ingresando..." |
| `OwnerRegistrationPage` | Botón "Enviando..." |
| `PublicReviewPage` | Carga del viaje + botón "Enviando..." |
| `router.tsx` (`RouteFallback`) | Suspense de rutas lazy |

Todos los usos llevan `role="status"` + `aria-busy="true"` donde aplica.

## Transiciones (bloque final de `global.css`)

- **Nav**: subrayado animado (`background-size` en el hover).
- **Botones**: `:active { transform: scale(0.98) }` en `.button`, `.nav-cta`, `.nf-hero-btn`, `.nf-whatsapp-btn`.
- **Flechas**: `translateX(3px)` en el svg de `.nf-hero-btn` / `.nf-whatsapp-btn` al hover.
- **Formularios**: transición de `border-color` y `box-shadow` en inputs/selects/textarea de login, registro y review.
- **Footer**: transición de color en links.
- **Focus-visible**: anillo de foco consistente en la landing.
- **Skip-link**: `.skip-link` visible al recibir foco (apunta a `#main-content`).

## `prefers-reduced-motion`

Regla global al final de `global.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Además, `LiquidCursorEffect` no se monta con movimiento reducido.
