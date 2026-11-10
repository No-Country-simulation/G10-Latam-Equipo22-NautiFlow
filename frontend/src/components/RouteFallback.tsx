import { Suspense, type ReactNode } from 'react';
import { WavyLoader } from './WavyLoader';

export function RouteFallback() {
  return (
    <p className="session-loading" role="status" aria-busy="true">
      <WavyLoader label="Cargando..." />
    </p>
  );
}

export function Suspended({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}
