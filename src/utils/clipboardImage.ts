/**
 * La primera imagen del portapapeles, como `File`, o `null` si no hay.
 *
 * Hay que llamarla desde el toque mismo y sin `await` antes: `navigator.clipboard.read()`
 * exige un gesto del usuario, y en iOS Safari es la que hace aparecer el botón de sistema
 * "Pegar". Por eso el `read()` sale en la primera línea, antes de cualquier espera.
 *
 * Sin soporte (navegadores sin `clipboard.read`), sin permiso o sin imagen copiada → `null`:
 * quien llama avisa con un toast y no se rompe nada más.
 */
export async function readClipboardImage(): Promise<File | null> {
  let items: ClipboardItems;
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.read) return null;
    items = await navigator.clipboard.read();
  } catch {
    return null;
  }
  try {
    for (const item of items) {
      const type = item.types.find(t => t.startsWith('image/'));
      if (!type) continue;
      const blob = await item.getType(type);
      return new File([blob], 'captura-pegada.png', { type: blob.type || type });
    }
  } catch {
    /* la imagen dejó de estar disponible entre el read y el getType */
  }
  return null;
}
