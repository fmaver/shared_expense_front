import { useCallback, useEffect, useRef, useState } from 'react';
import { parseExpenseImage, type ExpenseDraft } from '@/api/expenses';

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
 */
export function useReceiptScan(groupId: number | null | undefined) {
  const [scanning, setScanning] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptImage | null>(null);
  const [fromPhoto, setFromPhoto] = useState<Set<ScanField>>(() => new Set());
  const [confidence, setConfidence] = useState<ExpenseDraft['confidence'] | null>(null);
  const urlRef = useRef<string | null>(null);

  const setImage = useCallback((file: File | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = file ? URL.createObjectURL(file) : null;
    setReceipt(file && urlRef.current ? { url: urlRef.current, name: file.name } : null);
  }, []);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const scan = useCallback(async (file: File, apply: (draft: ExpenseDraft) => ScanField[]) => {
    if (groupId == null) return;
    setScanning(true);
    setImage(file);
    setFromPhoto(new Set());
    setConfidence(null);
    try {
      const draft = await parseExpenseImage(groupId, file);
      setFromPhoto(new Set(apply(draft)));
      setConfidence(draft.confidence);
    } finally {
      setScanning(false);
    }
  }, [groupId, setImage]);

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
    setImage(null);
    setFromPhoto(new Set());
    setConfidence(null);
    setScanning(false);
  }, [setImage]);

  return {
    scanning, receipt, fromPhoto, confidence, scan, touch, reset,
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
  return fields;
}
