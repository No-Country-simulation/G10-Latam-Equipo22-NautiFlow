# Landing pública — NautiFlow

Mejora integral de UX, SEO/GEO y microinteracciones de la landing pública (`/`), ejecutada en la rama `feature/landing-ux-seo`.

## Alcance implementado

| Fase | Estado | Detalle |
|------|--------|---------|
| 1. SEO técnico | ✅ | Metadatos en `frontend/index.html`, `robots.txt`, `sitemap.xml`, JSON-LD |
| 2. ARIA / hero | ✅ | Roles ARIA, `fetchPriority`, contraste AA, skip-link, `noindex` en rutas privadas |
| 3. Headers de seguridad | ✅ | `frontend/vercel.json` (X-Frame-Options, nosniff, Referrer-Policy, COOP, Permissions-Policy) |
| 4. Variables de entorno Vercel | ✅ | `VITE_API_URL` → `https://nautiflow-backend.onrender.com/api/v1` (resuelto por MaryJo + redeploy) |
| 5. Efecto líquido del hero | ✅ | `LiquidCursorEffect.tsx` (Canvas 2D) |
| 6. Lazy routes + CSS muerto | ✅ | `React.lazy` en `router.tsx`, −1143 líneas de CSS sin uso |
| 7. Documentación | ✅ | Este directorio |

## Decisiones registradas

1. **Testimonios (`FALLBACK_EXPERIENCES`)** — se mantienen como están (decisión explícita; no se tocó la lógica).
2. **Imágenes** — se dejaron tal cual (sin recorte, sin WebP, sin generación de `og:image` dedicado). `og:image` apunta a `/hero.jpg` existente. Si en el futuro se optimizan, actualizar también `sitemap.xml`/metadatos.
3. **Microinteracciones y loaders** — solo visuales; cero lógica de negocio, cero cambios en envíos/auth.
4. **CSP / Trusted Types** — evaluados y **no aplicados** por riesgo de romper scripts inline de Vite/React. Queda como mejora futura con nonce.
5. **WhatsApp** — botón presente con número placeholder; reemplazar por el definitivo antes de producción real.

## Fase 4 (resuelta)

`VITE_API_URL` en Vercel apunta ahora a `https://nautiflow-backend.onrender.com/api/v1` (el backend con admin seedeado) y se hizo redeploy. Credenciales de prueba: `admin@nautiflow.local` / `AdminNautiFlow2026!`.

## Archivos clave

- `frontend/index.html` — title/description/canonical/OG/Twitter/JSON-LD
- `frontend/public/robots.txt`, `frontend/public/sitemap.xml`
- `frontend/vercel.json` — headers + rewrites SPA
- `frontend/src/components/LiquidCursorEffect.tsx`
- `frontend/src/components/WavyLoader.tsx`, `RouteFallback.tsx`
- `frontend/src/router.tsx` — lazy loading de rutas
- `frontend/src/styles/global.css` — CSS vivo + estilos nuevos; sin reglas muertas

## Docs detalladas

- [LIQUID-HERO.md](./LIQUID-HERO.md) — efecto líquido del hero
- [SEO-GEO.md](./SEO-GEO.md) — metadatos, robots, sitemap, structured data
- [MICROINTERACTIONS.md](./MICROINTERACTIONS.md) — loaders y transiciones
- [LIGHTHOUSE.md](./LIGHTHOUSE.md) — baseline, objetivos y cambios
