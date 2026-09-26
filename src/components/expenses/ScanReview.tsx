import { useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReceiptImage } from '@/hooks/useReceiptScan';

/** La pastilla "de la foto": el valor lo leyó el escaneo y conviene mirarlo. */
export function FromPhotoPill() {
  const { t } = useTranslation();
  return (
    <span className="shrink-0 rounded-full bg-brand-wash px-1.5 py-0.5 text-[10px] font-bold leading-none text-brand-ink">
      {t('scan.fromPhoto')}
    </span>
  );
}

/** Mientras `parseExpenseImage` responde: la hoja ya está abierta, con un skeleton. */
export function ScanReading({ receipt }: { receipt: ReceiptImage | null }) {
  const { t } = useTranslation();
  return (
    <div className="pt-4" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-[14px] border border-brand-wash-line bg-brand-wash p-3">
        {receipt && (
          <img src={receipt.url} alt="" className="h-[46px] w-[36px] shrink-0 rounded-[6px] object-cover" />
        )}
        <p className="flex items-center gap-2 text-[12.5px] font-bold text-brand-ink">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t('scan.reading')}
        </p>
      </div>
      <div className="mt-6 flex flex-col items-center gap-3">
        <Skeleton className="h-12 w-44 rounded-[12px]" />
        <Skeleton className="h-5 w-56 rounded-md" />
        <Skeleton className="mt-2 h-24 w-full rounded-card" />
      </div>
    </div>
  );
}

/** Arriba del formulario ya completado: qué se leyó y qué revisar. */
export function ScanReviewNotice({ receipt, confidence }: {
  receipt: ReceiptImage | null;
  confidence: 'high' | 'low' | null;
}) {
  const { t } = useTranslation();
  if (!receipt || confidence === null) return null;
  return (
    <div className="mt-3 flex items-center gap-3 rounded-[14px] border border-brand-wash-line bg-brand-wash p-3">
      <img src={receipt.url} alt={t('scan.thumbnailAlt')} className="h-[46px] w-[36px] shrink-0 rounded-[6px] object-cover" />
      <p className="text-[12px] font-medium leading-[1.45] text-foreground">
        {confidence === 'low'
          ? t('scan.lowConfidence')
          : <Trans i18nKey="scan.read" components={[<strong className="font-bold" />]} />}
      </p>
    </div>
  );
}

/**
 * La fila "Comprobante" de la tarjeta de contexto (V6.7), detrás de FEATURE_RECEIPTS.
 *
 * Vacía invita a sumar una foto; con foto muestra la miniatura, el nombre y "Ver". Si el gasto
 * vino de un escaneo, la foto ya está puesta. El backend todavía no guarda imágenes: la foto
 * vive mientras la hoja está abierta y no viaja con el gasto. El lugar queda listo para cuando
 * `ExpenseCreate` tenga un `receiptUrl` o `attachmentId`.
 */
export function ReceiptRow({ receipt, onAttach }: {
  receipt: ReceiptImage | null;
  onAttach: (file: File) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={e => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) onAttach(file);
      }}
    />
  );

  if (!receipt) {
    return (
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-sunken"
      >
        <span className="text-[13px] font-bold text-brand-ink">📎 {t('receipt.add')}</span>
        <span className="text-[12px] font-medium text-muted-1">{t('receipt.optional')}</span>
        {input}
      </button>
    );
  }

  return (
    <div className="flex w-full items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
      <img src={receipt.url} alt={t('scan.thumbnailAlt')} className="h-[38px] w-[30px] shrink-0 rounded-[5px] object-cover" />
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-foreground">{receipt.name}</span>
      <a
        href={receipt.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-[12.5px] font-bold text-brand-ink hover:opacity-70"
      >
        {t('receipt.view')}
      </a>
    </div>
  );
}
