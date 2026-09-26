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
