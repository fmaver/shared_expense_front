import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/*
  El segmentado único de la app (ADDENDUM-violeta.md V6.3). Los colores viven en index.css
  (`.segmented`, `.segmented-item`); acá sólo la forma. Es la misma pieza para las pestañas
  del grupo, "Una vez / Cada mes", el tema y el canal de avisos.
*/
const TRACK = 'segmented flex gap-0.5 rounded-full p-[3px]';
const ITEM = cn(
  'segmented-item flex h-8 flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-3',
  'text-[12.5px] font-semibold transition-[background-color,color,box-shadow] duration-150',
  'data-[active=true]:font-bold aria-[current=page]:font-bold',
);

interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  'aria-label'?: string;
}

/** Opciones excluyentes, todas a la vista. */
export function Segmented<T extends string>({
  value, options, onChange, className, 'aria-label': ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn(TRACK, className)}>
      {options.map(option => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-active={active}
            onClick={() => onChange(option.value)}
            className={ITEM}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export interface SegmentedLink {
  to: string;
  label: string;
  /** Como `end` de NavLink: sólo activo en la ruta exacta. */
  end?: boolean;
}

/*
  `fit`: cada opción toma el ancho de su texto y el sobrante se reparte, en vez de partes
  iguales. Con cinco pestañas ("Vencimientos" es la larga) partes iguales no entraban y la fila
  tenía que scrollear de costado, y una fila que scrollea desde el borde le roba al celular el
  gesto de volver. Medido en WebKit con Manrope, en español y en inglés: desde 400px de pantalla
  entra con 7px de aire por lado; entre 360 y 399, con 4px; por debajo de 360, en 11px.
*/
const FIT_ITEM = cn(
  'flex-auto px-[7px]',
  'max-[399px]:px-1',
  'max-[359px]:px-[3px] max-[359px]:text-[11px] max-[359px]:tracking-[-0.01em]',
);

/** La misma pieza, con links: las pestañas de una sección. */
export function SegmentedLinks({ links, className, fit = false, 'aria-label': ariaLabel }: {
  links: SegmentedLink[];
  className?: string;
  fit?: boolean;
  'aria-label'?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className={cn(TRACK, className)}>
      {links.map(link => (
        <NavLink key={link.to} to={link.to} end={link.end} className={cn(ITEM, fit && FIT_ITEM)}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
