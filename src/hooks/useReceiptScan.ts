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
 * `parseExpenseImage`: la foto queda de miniatura y se aplica ese borrador tal cual. Con
 * `preRead` la foto puede faltar (no se pudo bajar, o el borrador no tiene): el borrador se
 * aplica igual, sin miniatura.
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
  /*
    Cada apertura de la hoja (`reset`) es una sesión. Un guardado que termina después de que
    la hoja se cerró y se volvió a abrir con otra foto no abandona esa lectura ni la cierra.
  */
  const sessionRef = useRef(0);
  /*
    `scanning` en un ref, para que la hoja pregunte "¿hay una lectura en curso?" sin depender
    del estado del render en que armó su closure: el efecto de apertura llama a `reset` y
    enseguida a `scan`, y ahí el estado todavía no se actualizó.
  */
  const scanningRef = useRef(false);
  const setScanningBoth = useCallback((value: boolean) => {
    scanningRef.current = value;
    setScanning(value);
  }, []);
  const isScanning = useCallback(() => scanningRef.current, []);

  const setImage = useCallback((file: File | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = file ? URL.createObjectURL(file) : null;
    setReceipt(file && urlRef.current ? { url: urlRef.current, name: file.name } : null);
  }, []);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const scan = useCallback(async (
    file: File | null,
    apply: (draft: ExpenseDraft) => ScanField[],
    preRead?: ExpenseDraft,
  ) => {
    if (groupId == null || (!file && !preRead)) return;
    const generation = ++generationRef.current;
    setScanningBoth(true);
    setImage(file);
    setScannedFile(file);
    setFromPhoto(new Set());
    setConfidence(null);
    try {
      const draft = preRead ?? (file ? await parseExpenseImage(groupId, file) : null);
      if (!draft || generation !== generationRef.current) return;
      setFromPhoto(new Set(apply(draft)));
      setConfidence(draft.confidence);
    } catch (err) {
      // Una lectura abandonada no tiene a quién avisarle su error.
      if (generation === generationRef.current) throw err;
    } finally {
      if (generation === generationRef.current) setScanningBoth(false);
    }
  }, [groupId, setImage, setScanningBoth]);

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
    const session = sessionRef.current;
    savingRef.current = true;
    setSavingDraft(true);
    try {
      await saveDraft(file);
      // El borrador quedó guardado pase lo que pase con la hoja: el aviso y el refresco van igual.
      toast.success(t('scan.savedForLater'));
      requestExpenseRefresh();
      // Otra sesión (la hoja se cerró y se abrió con otra foto): esa no se toca.
      if (session !== sessionRef.current) return;
      // Recién ahora se abandona la lectura: si el guardado falla, la hoja sigue como estaba.
      ++generationRef.current;
      setScanningBoth(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('scan.saveForLaterFailed'));
    } finally {
      if (session === sessionRef.current) {
        savingRef.current = false;
        setSavingDraft(false);
      }
    }
  }, [scannedFile, t, requestExpenseRefresh, setScanningBoth]);

  /** El usuario editó ese campo: deja de ser "de la foto". */
  const touch = useCallback((field: ScanField) => {
    setFromPhoto(prev => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }, []);

  /*
    La hoja se cerró: un guardado en vuelo ya no la cierra (podría cerrar otra cosa que se
    abrió mientras tanto). No limpia nada visible, así la animación de salida no parpadea.
  */
  const endSession = useCallback(() => { ++sessionRef.current; }, []);
  useEffect(() => endSession, [endSession]);

  const reset = useCallback(() => {
    ++generationRef.current;
    ++sessionRef.current;
    savingRef.current = false;
    setSavingDraft(false);
    setScannedFile(null);
    setImage(null);
    setFromPhoto(new Set());
    setConfidence(null);
    setScanningBoth(false);
  }, [setImage, setScanningBoth]);

  return {
    scanning, receipt, fromPhoto, confidence, scan, touch, reset,
    /** Si hay una lectura en curso, leído al momento (no del render). */
    isScanning, endSession,
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
  // Lo que el borrador trae por defecto (fecha de hoy, débito, ARS, "otros") no lo leyó nadie.
  const notRead: ReadonlyArray<string> = draft.notRead ?? [];
  return fields.filter(f => !notRead.includes(f));
}
