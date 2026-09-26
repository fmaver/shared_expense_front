import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Las piezas de vidrio que flotan sobre el contenido (ADDENDUM-violeta.md V6.1–V6.2).
 *
 * Todas usan la misma receta, `.glass` de index.css (o `.glass-night` sobre las superficies
 * noche). Miden 36px, pero el área táctil llega a 44px con un `::before` invisible: el
 * círculo se ve chico y se toca como un botón de iOS.
 */

type Tone = 'app' | 'night';

const surface = (tone: Tone) => (tone === 'night' ? 'glass-night text-white' : 'glass text-foreground');

/** Área táctil de 44px alrededor de un control de 36px, sin cambiar lo que se ve. */
const HIT_AREA = "relative before:absolute before:-inset-1 before:content-['']";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  /** Si viene, el botón es un link de la app. */
  to?: LinkProps['to'];
}

/** Círculo de vidrio de 36px: volver, cerrar, la lupa suelta. */
export function GlassButton({ tone = 'app', to, className, children, ...props }: GlassButtonProps) {
  const classes = cn(
    'flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full',
    'transition-transform active:scale-95',
    HIT_AREA,
    surface(tone),
    className,
  );
  if (to !== undefined) {
    return (
      <Link to={to} aria-label={props['aria-label']} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}

/** Cápsula de vidrio de 36px de alto que agrupa varios controles (buscar + ⋯, el mes). */
export function GlassCapsule({
  tone = 'app', className, children,
}: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex h-9 shrink-0 items-center rounded-full', surface(tone), className)}>
      {children}
    </div>
  );
}

interface CapsuleSlotProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  to?: LinkProps['to'];
}

/** Un lugar de 40px dentro de una cápsula. */
export function CapsuleSlot({ to, className, children, ...props }: CapsuleSlotProps) {
  const classes = cn(
    'flex h-9 w-10 cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-70',
    HIT_AREA,
    className,
  );
  if (to !== undefined) {
    return (
      <Link to={to} aria-label={props['aria-label']} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
