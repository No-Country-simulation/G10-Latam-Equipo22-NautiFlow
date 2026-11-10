import { useId } from 'react';

/**
 * Loader "Wavy #12" de css-loaders.com/wavy/ (Temani Afif).
 * El filtro SVG recolorea las ondas negras del diseño original al verde
 * de NautiFlow (#0b6b5f) sin perder el efecto gooey blur+contrast.
 */
const GREEN_TINT_MATRIX = [
  '0.2035 0.6845 0.0691 0 0.043',
  '0.1233 0.4148 0.0419 0 0.42',
  '0.1339 0.4506 0.0455 0 0.37',
  '0 0 0 1 0',
].join(' ');

interface WavyLoaderProps {
  /** Etiqueta visible junto a la onda (opcional). */
  label?: string;
  size?: 'md' | 'sm';
  className?: string;
}

export function WavyLoader({ label, size = 'md', className }: WavyLoaderProps) {
  const rawId = useId();
  const filterId = `nf-wavy-${rawId.replace(/:/g, '')}`;

  return (
    <span className={`nf-wavy-wrap${className ? ` ${className}` : ''}`}>
      <svg
        className="nf-wavy-filter-svg"
        aria-hidden="true"
        focusable="false"
      >
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={GREEN_TINT_MATRIX} />
        </filter>
      </svg>
      <span
        className={`nf-wavy-loader${size === 'sm' ? ' nf-wavy-loader-sm' : ''}`}
        aria-hidden="true"
        style={{ filter: `blur(4px) contrast(12) url(#${filterId})` }}
      />
      {label ? <span className="nf-wavy-label">{label}</span> : null}
    </span>
  );
}
