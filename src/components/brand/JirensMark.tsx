interface JirensMarkProps {
  /** Rendered size in px. Default 32. */
  size?: number;
  className?: string;
}

/**
 * La marca monolínea de Jirens. El trazo toma `currentColor`, así que hereda el color del
 * contexto (`text-foreground` sobre claro, `text-background` sobre el sidebar oscuro).
 * El punto y las dos líneas de acento son de marca y no cambian.
 */
export function JirensMark({ size = 32, className }: JirensMarkProps) {
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
      <circle cx={30} cy={34.5} r={4.2} fill="#E98A2B" />
      <path d="M36 14h6M36 20h6" stroke="#E98A2B" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}
