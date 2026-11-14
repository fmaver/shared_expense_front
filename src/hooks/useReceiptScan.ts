import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { parseExpenseImage, type ExpenseDraft } from '@/api/expenses';
import { saveDraft } from '@/api/drafts';
import { useExpenseRefresh } from '@/contexts/ExpenseRefreshContext';

/** Los campos que el escaneo puede completar y que la hoja marca como "de la foto". */
export type ScanField = 'amount' | 'description' | 'date' | 'payment';

export interface ReceiptImage {
  /** Object URL local: sirve para la miniatura mientras la hoja está abierta. No se sube. */
  url: string;
  name: string;
}

/**
 * El estado de un escaneo de ticket dentro de una hoja de carga (ADDENDUM-violeta.md V6.6).
 *
 * `scan(file, apply)` lee la foto con `parseExpenseImage` y deja que la hoja vuelque el
 * borrador en su propio estado: `apply` devuelve qué campos llenó, y esos quedan marcados
 * como "de la foto" hasta que el usuario los toque (`touch`). La foto queda como miniatura
 * local; el backend no guarda imágenes, así que no se persiste.
 *
 * Con `preRead` (un borrador de carga rápida que el backend ya leyó) no se vuelve a llamar a
 * `parseExpenseImage`: la foto queda de miniatura y se aplica ese borrador tal cual.
 */
export function useReceiptScan(groupId: number | null | undefined) {
  const { t } = useTranslation();
  const { requestExpenseRefresh } = useExpenseRefresh();
  const [scanning, setScanning] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptImage | null>(null);
  const [fromPhoto, setFromPhoto] = useState<Set<ScanField>>(() => new Set());
  const [confidence, setConfidence] = useState<ExpenseDraft['confidence'] | null>(null);
  /* La foto que se está leyendo o que llenó el formulario: es la que "Dejar para después" guarda. */
  const [scannedFile, setScannedFile] = useState<File | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const urlRef = useRef<string | null>(null);
  /*
    Cada lectura lleva un número. Si mientras tanto se dejó para después (o la hoja se
    reinició), la respuesta que llega tarde ya no es la vigente y no toca el formulario.
  */
  const generationRef = useRef(0);

  const setImage = useCallback((file: File | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = file ? URL.createObjectURL(file) : null;
    setReceipt(file && urlRef.current ? { url: urlRef.current, name: file.name } : null);
  }, []);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const scan = useCallback(async (
    file: File,
    apply: (draft: ExpenseDraft) => ScanField[],
    preRead?: ExpenseDraft,
  ) => {
    if (groupId == null) return;
    const generation = ++generationRef.current;
    setScanning(true);
    setImage(file);
    setScannedFile(file);
    setFromPhoto(new Set());
    setConfidence(null);
    try {
      const draft = preRead ?? await parseExpenseImage(groupId, file);
      if (generation !== generationRef.current) return;
      setFromPhoto(new Set(apply(draft)));
      setConfidence(draft.confidence);
    } catch (err) {
      // Una lectura abandonada no tiene a quién avisarle su error.
      if (generation === generationRef.current) throw err;
    } finally {
      if (generation === generationRef.current) setScanning(false);
    }
  }, [groupId, setImage]);

  /**
   * "Dejar para después": guarda la foto como borrador pendiente (el backend la vuelve a leer)
   * y llama a `onSaved` para cerrar la hoja. No espera a la lectura en curso: la abandona, así
   * su respuesta no toca un formulario cerrado. Si falla, avisa y la hoja queda como estaba.
   * Lo que se haya editado a mano no viaja: el borrador sale de la foto.
   */
  const savingRef = useRef(false);
  const saveForLater = useCallback(async (onSaved: () => void, file: File | null = scannedFile) => {
    // El ref frena el doble toque antes de que el botón llegue a deshabilitarse: dos toques
    // serían dos borradores.
    if (!file || savingRef.current) return;
    savingRef.current = true;
    setSavingDraft(true);
    try {
      await saveDraft(file);
      // Recién ahora se abandona la lectura: si el guardado falla, la hoja sigue como estaba.
      ++generationRef.current;
      toast.success(t('scan.savedForLater'));
      requestExpenseRefresh();
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('scan.saveForLaterFailed'));
    } finally {
      savingRef.current = false;
      setSavingDraft(false);
    }
  }, [scannedFile, t, requestExpenseRefresh]);

  /** El usuario editó ese campo: deja de ser "de la foto". */
  const touch = useCallback((field: ScanField) => {
    setFromPhoto(prev => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    ++generationRef.current;
    setScannedFile(null);
    setImage(null);
    setFromPhoto(new Set());
    setConfidence(null);
    setScanning(false);
  }, [setImage]);

  return {
    scanning, receipt, fromPhoto, confidence, scan, touch, reset,
    /** La foto leída (o leyéndose), y si ya se está guardando como borrador. */
    scannedFile, savingDraft, saveForLater,
    /** Adjuntar una foto como comprobante, sin leerla (fila "Comprobante"). */
    attach: setImage,
  };
}

/** Qué campos trae un borrador, para marcarlos "de la foto". */
export function draftFields(draft: ExpenseDraft, opts: { payment: boolean }): ScanField[] {
  const fields: ScanField[] = [];
  if (draft.amount != null) fields.push('amount');
  if (draft.description) fields.push('description');
  if (draft.date) fields.push('date');
  if (opts.payment && draft.paymentType) fields.push('payment');
  // Lo que el borrador trae por defecto (fecha de hoy, débito) no lo leyó nadie.
  return draft.notRead ? fields.filter(f => !draft.notRead!.includes(f as 'date' | 'payment')) : fields;
}
