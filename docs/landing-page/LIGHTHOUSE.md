# Lighthouse — Landing pública

## Baseline (antes de la rama `feature/landing-ux-seo`)

| Métrica | Valor |
|---------|-------|
| Performance | 99 |
| Accessibility | 90 |
| Best Practices | 96 |
| SEO | 92 |

**19 errores de SEO** provenientes de `/robots.txt` sirviendo el HTML del rewrite SPA en lugar de un robots válido.

## Objetivos

| Métrica | Objetivo |
|---------|----------|
| Performance | ≥ 99 (mantener) |
| Accessibility | ≥ 95 |
| Best Practices | 100 |
| SEO | 100 |

## Cambios aplicados para llegar a los objetivos

### SEO (92 → 100 esperado)
- `public/robots.txt` y `public/sitemap.xml` (fin de los 19 errores).
- Metadatos completos, canonical, OG/Twitter, JSON-LD.
- `lang="es-AR"`.

### Accessibility (90 → ≥95 esperado)
- Contraste AA corregido: `.nf-boat-operator` `#6b7f7b`→`#5b6f6b`, `.nf-boat-description` `#687c78`→`#5b6f6b`.
- `role="group"` en `.nf-audience-grid`; `role="img"` en `.nf-boat-rating` y `.nf-experience-stars`.
- Skip-link + `id="main-content"` en `<main>` (`AppLayout.tsx`).
- `noindex,nofollow` dinámico en rutas privadas.
- Loaders con `role="status"` y `aria-busy`.

### Best Practices (96 → 100 esperado)
- Headers en `vercel.json`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `COOP: same-origin`, `Permissions-Policy`.
- `fetchPriority="high"` en la imagen LCP del hero + `width`/`height` explícitos (evita CLS).

### Performance (mantener ≥99)
- **Lazy routes**: `React.lazy` en `router.tsx` con `Suspense` → páginas privadas/auth/status en chunks propios ( LoginPage 3.9 kB, AdminTripsPage 9.4 kB, etc.).
- **CSS muerto eliminado**: 4182 → 2850 líneas (−1143 líneas); bundle CSS final ~39 kB (gzip ~8.3 kB).
- Efecto líquido: canvas con `pointer-events: none`, sin re-renders, se pausa con la pestaña oculta y se detiene en idle.

## Verificación pendiente (post-deploy)

1. Deploy en Vercel (rama `develop`).
2. Lighthouse móvil y desktop en `https://nautiflow-weld.vercel.app/`.
3. `curl` de `/robots.txt` y `/sitemap.xml` para confirmar que responden texto, no HTML.
4. Comparar scores con la tabla de objetivos.

> Nota: el bundle principal (`index.js`) sigue siendo ~569 kB (172 kB gzip) por dependencias (React, router, lucide, charts). Es preexistente; si en el futuro se necesita bajar Performance, el siguiente paso es analizar dependencias con `rollup-plugin-visualizer`, no tocar la landing.
