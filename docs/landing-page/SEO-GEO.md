# SEO / GEO — Landing pública

## Metadatos (`frontend/index.html`)

- `lang="es-AR"` (antes sin lang)
- **Title**: `NautiFlow | Embarcaciones verificadas en el Delta del Tigre`
- **Description**: `Conectamos pasajeros y operadores fluviales del Delta del Tigre mediante embarcaciones verificadas, documentación revisada y coordinación transparente.`
- **Canonical**: `https://nautiflow-weld.vercel.app/`
- **theme-color**: `#0b6b5f` (verde de marca)
- **Open Graph**: `og:type=website`, `og:locale=es_AR`, `og:image=/hero.jpg` con `og:image:alt`
- **Twitter**: `summary_large_image` con título/descripción/imagen

> `og:image` apunta al `hero.jpg` existente en `public/` (1000×666). No se generó una imagen dedicada 1200×630 para evitar tocar binarios; si se optimiza el hero, actualizar la URL.

## Structured data (JSON-LD)

`@graph` con tres nodos enlazados por `@id`:

- **Organization** — nombre, URL, `areaServed` (Delta del Tigre)
- **WebSite** — `inLanguage: es-AR`, publisher → Organization
- **Service** — `serviceType: Transporte fluvial de pasajeros`, provider → Organization

Sin datos inventados (sin teléfono, rating, precios ni horarios).

## `robots.txt` (`frontend/public/robots.txt`)

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /owner
Disallow: /dashboard
Disallow: /login
Sitemap: https://nautiflow-weld.vercel.app/sitemap.xml
```

**Por qué existía el problema**: sin `public/robots.txt`, el rewrite SPA de `vercel.json` (`/(.*) → /index.html`) servía el HTML de la app en `/robots.txt`, lo que rompía las reglas de crawlers (19 errores en Lighthouse). Un archivo estático en `public/` tiene prioridad sobre los rewrites.

## `sitemap.xml` (`frontend/public/sitemap.xml`)

Solo la landing (`/`) con `lastmod`, `changefreq=weekly`, `priority=1.0`. Las rutas privadas no se indexan.

## `noindex` dinámico (`AppLayout.tsx`)

Efecto que inyecta `<meta name="robots" content="noindex,nofollow">` (y lo retira al salir) para `/admin`, `/owner`, `/dashboard` y `/login`, como red de seguridad además del `robots.txt`.

## Headers (`frontend/vercel.json`)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**CSP y Trusted Types**: evaluados y no aplicados (riesgo de romper scripts inline de Vite/React). Mejora futura con nonce.

## GEO (generative engine optimization)

- Contenido en `es-AR` claro y autocontenido en el HTML (no depende de JS para el texto principal del hero y secciones con copy real).
- JSON-LD `Service` + `Organization` dan contexto de entidad a los motores generativos.
- Sin FAQ → no se emite schema `FAQPage` (no inventar preguntas).

## Verificación post-deploy

```bash
curl -s https://nautiflow-weld.vercel.app/robots.txt   # debe devolver texto plano, no HTML
curl -s https://nautiflow-weld.vercel.app/sitemap.xml
curl -s https://nautiflow-weld.vercel.app/ | grep -o 'canonical[^>]*'
```
