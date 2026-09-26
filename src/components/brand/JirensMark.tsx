import { cn } from '@/lib/utils';

interface JirensMarkProps {
  /** Rendered size in px. Default 32. */
  size?: number;
  /**
   * `app` (default): sobre el fondo de la app, que cambia con el tema — acento #6C5AC0 en claro
   * y #A99BEA en oscuro, vía `--brand`. `night`: sobre las superficies noche fijas (ingreso,
   * sidebar), siempre #A99BEA vía `--brand-soft`.
   */
  tone?: 'app' | 'night';
  className?: string;
}

/**
 * La marca monolínea de Jirens. El trazo toma `currentColor`, así que hereda el color del
 * contexto (`text-foreground` sobre la app, `text-white` sobre noche). El punto y las dos
 * líneas de acento son violeta de marca, en el tono que corresponde al fondo.
 */
export function JirensMark({ size = 32, tone = 'app', className }: JirensMarkProps) {
  const accent = tone === 'night' ? 'fill-brand-soft stroke-brand-soft' : 'fill-brand stroke-brand';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Jirens"
    >
      <path
        d="M30 10v16a9 9 0 0 1-18 0"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.4}
        strokeLinecap="round"
      />
      <circle cx={30} cy={34.5} r={4.2} className={cn(accent, 'stroke-none')} />
      <path d="M36 14h6M36 20h6" className={cn(accent, 'fill-none')} strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}
