import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export const ownerRegistrationSteps = [
  'Responsable',
  'Embarcación',
  'Documentación',
  'Confirmación',
];

export function AuthFrame({
  title,
  description,
  step,
  steps,
  children,
}: {
  title: string;
  description: string;
  step?: number;
  steps?: string[];
  children: ReactNode;
}) {
  return (
    <main className="auth-experience">
      <aside className="auth-sidebar">
        <Link className="auth-brand" to="/">
          <span className="auth-brand-mark" aria-hidden="true">⚓</span>
          <span>NautiFlow</span>
        </Link>
        <div className="auth-sidebar-copy">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {steps && typeof step === 'number' && (
          <ol className="auth-steps" aria-label="Pasos del registro">
            {steps.map((label, index) => (
              <li className={index === step ? 'is-current' : index < step ? 'is-complete' : ''} key={label}>
                <span aria-hidden="true">{index + 1}</span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
        )}
      </aside>
      <section className="auth-content">
        <Link className="auth-back" to="/">← <span>Volver</span></Link>
        <div className="auth-card">{children}</div>
      </section>
    </main>
  );
}