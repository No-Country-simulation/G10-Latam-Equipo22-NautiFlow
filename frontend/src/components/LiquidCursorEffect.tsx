import { useEffect, useRef } from 'react';

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  speed: number;
}

const MAX_RIPPLES = 18;
const SPAWN_DISTANCE = 36;
const RIPPLE_SPEED = 0.9;
const MAX_DPR = 1.5;

/**
 * Capa de agua sutil sobre la imagen del Hero (solo pointer fino, sin touch,
 * respeta prefers-reduced-motion). Canvas 2D confinado al hero: sin estado de
 * React por movimiento, sin interferir con clicks ni scroll (pointer-events:
 * none en CSS) y con el loop detenido cuando no hay ondas activas.
 */
export function LiquidCursorEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (reduceMotion.matches || !finePointer.matches) return;

    const hero = canvas.parentElement;
    if (!hero) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const ripples: Ripple[] = [];
    let targetX = -9999;
    let targetY = -9999;
    let glowX = -9999;
    let glowY = -9999;
    let glowAlpha = 0;
    let pointerInside = false;
    let lastSpawnX = -9999;
    let lastSpawnY = -9999;
    let rafId = 0;
    let lastTime = 0;

    function resize() {
      const rect = hero!.getBoundingClientRect();
      canvas!.width = Math.max(1, Math.round(rect.width * dpr));
      canvas!.height = Math.max(1, Math.round(rect.height * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time: number) {
      const dt = lastTime ? Math.min((time - lastTime) / 16.67, 3) : 1;
      lastTime = time;

      const rect = hero!.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx!.clearRect(0, 0, width, height);
      ctx!.filter = 'none';
      ctx!.globalCompositeOperation = 'screen';

      // Ondas: se expanden lento y se disuelven con curva suave (tipo agua).
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const ripple = ripples[i];
        ripple.r += RIPPLE_SPEED * ripple.speed * dt;
        const progress = ripple.r / ripple.maxR;
        if (progress >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const fadeIn = Math.min(1, progress * 10);
        const fadeOut = Math.pow(1 - progress, 1.7);
        const alpha = ripple.alpha * fadeIn * fadeOut;
        if (alpha < 0.004) continue;
        // Difuminado creciente: el anillo se "disuelve" al alejarse.
        ctx!.filter = `blur(${(0.6 + progress * 3.2).toFixed(2)}px)`;
        ctx!.beginPath();
        ctx!.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
        ctx!.lineWidth = 1.4;
        ctx!.strokeStyle = `rgba(127, 209, 193, ${alpha})`;
        ctx!.stroke();
        ctx!.filter = 'none';
        ctx!.beginPath();
        ctx!.arc(ripple.x, ripple.y, ripple.r * 0.72, 0, Math.PI * 2);
        ctx!.lineWidth = 0.9;
        ctx!.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
        ctx!.stroke();
      }

      // Resplandor pegado al cursor (posición exacta, sin rezago ni titileo).
      if (pointerInside) {
        glowX = targetX;
        glowY = targetY;
        glowAlpha = Math.min(0.12, glowAlpha + 0.014 * dt);
      } else {
        glowAlpha = Math.max(0, glowAlpha - 0.014 * dt);
      }
      if (glowAlpha > 0.002 && glowX > -999) {
        const radius = 88;
        const gradient = ctx!.createRadialGradient(
          glowX,
          glowY,
          0,
          glowX,
          glowY,
          radius,
        );
        gradient.addColorStop(0, `rgba(127, 209, 193, ${glowAlpha})`);
        gradient.addColorStop(1, 'rgba(127, 209, 193, 0)');
        ctx!.beginPath();
        ctx!.arc(glowX, glowY, radius, 0, Math.PI * 2);
        ctx!.fillStyle = gradient;
        ctx!.fill();
      }

      ctx!.globalCompositeOperation = 'source-over';

      if (ripples.length === 0 && glowAlpha <= 0.002) {
        glowX = -9999;
        glowY = -9999;
        ctx!.clearRect(0, 0, width, height);
        rafId = 0;
        lastTime = 0;
        return;
      }
      rafId = requestAnimationFrame(draw);
    }

    function start() {
      if (rafId === 0 && document.visibilityState === 'visible') {
        lastTime = 0;
        rafId = requestAnimationFrame(draw);
      }
    }

    function stop() {
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
        rafId = 0;
        lastTime = 0;
      }
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType === 'touch') return;
      const rect = canvas!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        pointerInside = false;
        return;
      }
      pointerInside = true;
      targetX = x;
      targetY = y;
      if (glowX < -999) {
        glowX = x;
        glowY = y;
      }
      if (Math.hypot(x - lastSpawnX, y - lastSpawnY) >= SPAWN_DISTANCE) {
        lastSpawnX = x;
        lastSpawnY = y;
        ripples.push({
          x,
          y,
          r: 4,
          maxR: 56 + Math.random() * 44,
          alpha: 0.45,
          speed: 0.75 + Math.random() * 0.5,
        });
        if (ripples.length > MAX_RIPPLES) ripples.shift();
      }
      start();
    }

    function handlePointerLeave() {
      pointerInside = false;
      targetX = -9999;
      targetY = -9999;
    }

    function handleVisibility() {
      if (document.visibilityState === 'hidden') {
        stop();
      } else if (pointerInside || ripples.length > 0) {
        start();
      }
    }

    resize();
    const observer = new ResizeObserver(() => resize());
    observer.observe(hero);
    hero.addEventListener('pointermove', handlePointerMove);
    hero.addEventListener('pointerleave', handlePointerLeave);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      observer.disconnect();
      hero.removeEventListener('pointermove', handlePointerMove);
      hero.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="nf-liquid-canvas" aria-hidden="true" />;
}
