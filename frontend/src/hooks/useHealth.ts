import { useCallback, useEffect, useState } from 'react';
import { fetchHealth } from '../services/health';
import type { HealthResult } from '../types/api';

interface HealthState {
  loading: boolean;
  data: HealthResult | null;
  error: string | null;
}

export function useHealth() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<HealthState>({ loading: true, data: null, error: null });

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const data = await fetchHealth();
        if (active) setState({ loading: false, data, error: null });
      } catch (error) {
        if (active) {
          const message = error instanceof Error ? error.message : 'Error desconocido';
          setState({ loading: false, data: null, error: message });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }));
    setAttempt((current) => current + 1);
  }, []);

  return { ...state, reload };
}
