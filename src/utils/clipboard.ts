import { toast } from 'sonner';

/** Copia al portapapeles; sin permiso o sin contexto seguro avisa con un toast de error. */
export async function copyToClipboard(text: string, successMsg: string, failMsg: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMsg);
  } catch {
    toast.error(failMsg);
  }
}
