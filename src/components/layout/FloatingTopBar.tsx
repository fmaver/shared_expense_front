import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassButton } from '@/components/ui/Glass';

/** Dónde arrancan los botones: debajo de la barra de estado, con 8px de aire. */
const TOP = 'calc(env(safe-area-inset-top, 0px) + 8px)';

interface FloatingTopBarProps {
  /** El botón volver. Sin él, la izquierda queda vacía (Tu plata es una raíz). */
  back?: { to: string; label: string } | { onClick: () => void; label: string };
  /** La cápsula de la derecha (buscar + ⋯, buscar + avatar). */
  right?: React.ReactNode;
  /** `night` sobre las superficies noche (registro). */
  tone?: 'app' | 'night';
  /**
   * La banda que aparece al scrollear: cuando `watch` (el título grande) sale de la vista, se
   * muestra el título compacto con su contexto y, debajo, lo que haga falta pegar (las
   * pestañas). Los botones no se mueven: la banda pasa por debajo de ellos.
   */
  band?: {
    /** El título grande. Llega por callback ref: mientras carga todavía no existe. */
    watch: HTMLElement | null;
    title: string;
    context?: string;
    below?: React.ReactNode;
  };
}

/**
 * Los controles flotantes de arriba en mobile (ADDENDUM-violeta.md V6.2): el volver como un
 * círculo de vidrio a la izquierda y una cápsula a la derecha. Reemplazan a los "‹ Grupos" /
 * "‹ Volver" de texto. En desktop no se dibujan: ahí el sidebar ya es la navegación.
 *
 * La pantalla que lo usa deja arriba del título grande un `<TopBarSpacer />`, para que el
 * título no quede debajo de los botones.
 */
export function FloatingTopBar({ back, right, tone = 'app', band }: FloatingTopBarProps) {
  const navigate = useNavigate();
  const [bandVisible, setBandVisible] = useState(false);

  /*
    La flecha hace lo mismo que el gesto de volver de iOS: un paso atrás en el historial. Si
    fuera un link a `back.to`, sumaría una entrada, y deslizar después te devolvería adentro
    de la pantalla de la que saliste. Sólo cuando no hay adónde volver (se entró por un
    deep-link o una notificación) va a `back.to`, reemplazando la entrada.
  */
  const goBack = (to: string) => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(to, { replace: true });
  };
  const el = band?.watch ?? null;

  useEffect(() => {
    if (!el) { setBandVisible(false); return; }
    // La banda aparece cuando el título pasa por debajo de los botones, no recién al salir
    // de la pantalla: por eso el margen de arriba descuenta la franja de los botones.
    const observer = new IntersectionObserver(
      ([entry]) => setBandVisible(!entry.isIntersecting && entry.boundingClientRect.top < 60),
      { rootMargin: '-56px 0px 0px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);

  return (
    <div className="lg:hidden">
      {band && (
        <div
          aria-hidden={!bandVisible}
          className={cn(
            'glass-band fixed inset-x-0 top-0 z-30 transition-opacity duration-150',
            bandVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          style={{ paddingTop: TOP }}
        >
          {/* El título compacto va a la altura de los botones, centrado entre ellos. */}
          <div className="mx-auto flex h-9 max-w-[60%] flex-col items-center justify-center text-center">
            <p className="w-full truncate text-[15px] font-bold leading-tight text-foreground">{band.title}</p>
            {band.context && (
              <p className="w-full truncate text-[11px] font-semibold leading-tight text-muted-1">{band.context}</p>
            )}
          </div>
          {band.below && <div className="px-5 pb-3 pt-3">{band.below}</div>}
          {!band.below && <div className="h-2" />}
        </div>
      )}

      {back && (
        <div className="fixed left-4 z-40" style={{ top: TOP }}>
          {'to' in back ? (
            <GlassButton onClick={() => goBack(back.to)} tone={tone} aria-label={back.label}>
              <ChevronLeft className="h-[17px] w-[17px]" strokeWidth={2.4} />
            </GlassButton>
          ) : (
            <GlassButton onClick={back.onClick} tone={tone} aria-label={back.label}>
              <ChevronLeft className="h-[17px] w-[17px]" strokeWidth={2.4} />
            </GlassButton>
          )}
        </div>
      )}

      {right && (
        <div className="fixed right-4 z-40" style={{ top: TOP }}>
          {right}
        </div>
      )}
    </div>
  );
}

/** El espacio que dejan los botones flotantes arriba del título grande (sólo mobile). */
export function TopBarSpacer() {
  return <div aria-hidden="true" className="h-10 lg:hidden" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }} />;
}
