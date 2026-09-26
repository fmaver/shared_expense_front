import { type ChangeEvent, useCallback, useRef } from 'react';

/**
 * Los dos caminos para elegir la foto de un ticket (ADDENDUM-violeta.md V6.6), con el input
 * nativo y sin cámara propia:
 * - `pickCamera`: `capture="environment"` abre la cámara trasera directo. Es lo que hace
 *   mantener apretado el "+".
 * - `pickAny`: el mismo input sin `capture`. En el celular el sistema ofrece sacar la foto o
 *   elegir una de la galería; en desktop, el selector de archivos.
 *
 * Los inputs tienen que estar montados antes del toque y el `click()` tiene que salir de
 * ese mismo toque: iOS no abre el selector desde un timer ni después de un `await`. Por eso
 * esto vive en el lanzador, que siempre está montado, y no dentro del menú que se cierra.
 */
export function useScanPicker(onFile: (file: File) => void) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const anyRef = useRef<HTMLInputElement>(null);

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Vaciarlo deja volver a elegir la misma foto, que si no no dispara `change`.
    e.target.value = '';
    if (file) onFile(file);
  };

  const pickCamera = useCallback(() => cameraRef.current?.click(), []);
  const pickAny = useCallback(() => anyRef.current?.click(), []);

  const inputs = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={handle} />
      <input ref={anyRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={handle} />
    </>
  );

  return { inputs, pickCamera, pickAny };
}
