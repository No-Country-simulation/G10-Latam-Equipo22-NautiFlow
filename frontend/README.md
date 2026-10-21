# Frontend · NautiFlow

React 19 + TypeScript + Vite, con React Router y un cliente HTTP tipado.

## Comandos

```bash
npm install
npm run dev       # http://localhost:5173
npm run lint
npm run build
npm test          # Vitest + Testing Library
npm run test:cov
```

La URL de la API se toma de `VITE_API_URL` (en el `.env` de la raíz). Las pruebas y el build
funcionan sin backend.

## Estructura

- `pages/` — landing, login, panel y estado del sistema
- `layouts/` — shell con navegación y pie
- `services/` — cliente `fetch` tipado y servicios por dominio
- `hooks/` — lógica reutilizable (por ejemplo `useHealth`)
- `types/` — contratos compartidos con la API
- `styles/` — sistema visual base con variables CSS

El login real y las vistas protegidas llegan en el Sprint 1. Convenciones y flujo de trabajo en
[../ARCHITECTURE.md](../ARCHITECTURE.md).
