import { useEffect, useRef } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const TRIGGER_MARGIN = '0px 0px -12% 0px';

/**
 * Revela el elemento cuando su borde superior entra al viewport
 * (one-shot). Deja intacto lo que ya es visible al montar y
 * respeta `prefers-reduced-motion`.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.dataset.reveal === 'visible') return;
    if (window.matchMedia(REDUCED_MOTION).matches) return;
    if (
      el.dataset.reveal === undefined &&
      el.getBoundingClientRect().top < window.innerHeight
    ) {
      return;
    }
    el.dataset.reveal = 'hidden';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.dataset.reveal = 'visible';
          observer.disconnect();
        }
      },
      { rootMargin: TRIGGER_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
