import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrendingDown, Clock, CheckCircle2, ExternalLink, Repeat } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/utils/format';
import { ViewAllLink } from './ViewAllLink';
import type { MirroredShareItem, PersonalLedgerResponse, CategoryWithEmoji } from '@/types/expense';

interface MirroredSharesSectionProps {
  ledger: PersonalLedgerResponse;
  year: number;
  month: number;
  categories: CategoryWithEmoji[];
  /** Show only the latest N rows (dashboard); omit for the full page. */
  limit?: number;
  /** Target of the "View all" link; shown when there are more rows than `limit`. */
  viewAllTo?: string;
}

export function MirroredSharesSection({ ledger, year, month, categories, limit, viewAllTo }: MirroredSharesSectionProps) {
  const { t } = useTranslation();
  const [selectedMirroredShare, setSelectedMirroredShare] = useState<MirroredShareItem | null>(null);

  const sortedShares = [...ledger.mirroredShares].sort(
    (a, b) => b.date.localeCompare(a.date) || b.sourceExpenseId - a.sourceExpenseId,
  );
  const visibleShares = limit !== undefined ? sortedShares.slice(0, limit) : sortedShares;
  const hasMore = limit !== undefined && ledger.mirroredShares.length > limit;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <TrendingDown className="h-4 w-4 text-red-500" /> {t('personal.mirroredShares')}
        </h2>
        {hasMore && viewAllTo && <ViewAllLink to={viewAllTo} count={ledger.mirroredShares.length} />}
      </div>
      {ledger.mirroredShares.length === 0 ? (
        <p className="text-sm text-muted-foreground px-4 pb-4">{t('personal.noShares')}</p>
      ) : (
        <div>
          {visibleShares.map(share => {
            const catEmoji = categories.find(c => c.name === share.category)?.emoji;
            const isPayer = share.payerAmount > 0;
            const pendingReceipt = isPayer ? share.payerAmount - share.shareAmount : 0;

            return (
              <div key={share.sourceExpenseId} className="border-b border-border/50 last:border-0">
                {/* Header: status badge + group + link */}
                <div className="flex items-center justify-between px-4 pt-2">
                  <div className="flex items-center gap-2">
                    {share.status === 'pending' ? (
                      <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 font-medium">
                        <Clock className="h-3 w-3" />{t('personal.pending')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="h-3 w-3" />{t('personal.realized')}
                      </span>
                    )}
                    {share.installments > 1 && (
                      <span className="text-xs text-muted-foreground">{share.installmentNo}/{share.installments}</span>
                    )}
                  </div>
                  <Link
                    to={`/groups/${share.sourceGroupId}?year=${year}&month=${month}&highlight=${share.sourceExpenseId}`}
                    className="text-xs text-muted-foreground hover:text-brand transition-colors flex items-center gap-0.5"
                    title={t('personal.viewInGroup')}
                  >
                    {t('personal.viewInGroup')} <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                {isPayer ? (
                  /* Payer layout: show paid / pending receipt / net */
                  <div className="flex items-center gap-3 px-4 py-3 [@media(hover:hover)]:hover:bg-accent/40 active:bg-accent/30 transition-colors cursor-pointer touch-manipulation" onClick={() => setSelectedMirroredShare(share)}>
                    {/* Category icon */}
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {catEmoji
                        ? <span className="text-lg leading-none">{catEmoji}</span>
                        : <span className="text-xs font-bold text-muted-foreground uppercase">{share.category.slice(0, 2)}</span>}
                    </div>
                    {/* Description + meta */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{share.description}</p>
                      <p className="text-xs text-muted-foreground">{share.sourceGroupName} · {share.date}</p>
                      <div className="flex sm:hidden items-center gap-1 mt-1">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{share.category}</span>
                      </div>
                    </div>
                    {/* Desktop category badge */}
                    <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{share.category}</span>
                    </div>
                    {/* Amounts: paid + pending receipt */}
                    <div className="text-right flex-shrink-0 w-28">
                      <p className="text-sm font-semibold text-foreground tabular-nums">-{formatCurrency(share.payerAmount)}</p>
                      <p className={`text-xs font-medium ${share.status === 'pending' ? 'text-amber-600' : 'text-green-600'}`}>
                        {share.status === 'pending'
                          ? `+${formatCurrency(pendingReceipt)} ${t('personal.pending').toLowerCase()}`
                          : `+${formatCurrency(pendingReceipt)} ${t('personal.realized').toLowerCase()}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Non-payer layout */
                  <div className="flex items-center gap-3 px-4 py-3 [@media(hover:hover)]:hover:bg-accent/40 active:bg-accent/30 transition-colors cursor-pointer touch-manipulation" onClick={() => setSelectedMirroredShare(share)}>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {catEmoji
                        ? <span className="text-lg leading-none">{catEmoji}</span>
                        : <span className="text-xs font-bold text-muted-foreground uppercase">{share.category.slice(0, 2)}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{share.description}</p>
                      <p className="text-xs text-muted-foreground">{share.payerName} · {share.sourceGroupName}</p>
                      <div className="flex sm:hidden items-center gap-1 mt-1">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{share.category}</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{share.category}</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground tabular-nums flex-shrink-0 w-24 text-right">
                      -{formatCurrency(share.shareAmount)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mirrored share detail popup */}
      {selectedMirroredShare && (() => {
        const s = selectedMirroredShare;
        const catEmoji = categories.find(c => c.name === s.category)?.emoji;
        const isPayer = s.payerAmount > 0;
        const pendingReceipt = isPayer ? s.payerAmount - s.shareAmount : 0;
        return (
          <Dialog open onOpenChange={open => { if (!open) setSelectedMirroredShare(null); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    {catEmoji
                      ? <span className="text-2xl leading-none">{catEmoji}</span>
                      : <span className="text-sm font-bold text-muted-foreground uppercase">{s.category.slice(0, 2)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-base leading-tight flex items-center gap-1.5">
                      {s.description}
                      {s.isRecurring && <Repeat className="h-3.5 w-3.5 text-brand shrink-0" />}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.category} · {formatDate(s.date, true)}</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg px-4 py-3 mt-1 space-y-1">
                  {isPayer ? (
                    <>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">{t('personal.paid', { defaultValue: 'Paid' })}</span>
                        <span className="text-xl font-bold text-foreground tabular-nums">-{formatCurrency(s.payerAmount)}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">{t('personal.myShare', { defaultValue: 'My share' })}</span>
                        <span className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(s.shareAmount)}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">{t('personal.toReceive', { defaultValue: 'To receive' })}</span>
                        <span className={`text-sm font-semibold tabular-nums ${s.status === 'pending' ? 'text-amber-600' : 'text-green-600'}`}>
                          +{formatCurrency(pendingReceipt)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">{t('personal.myShare', { defaultValue: 'My share' })}</span>
                      <span className="text-xl font-bold text-foreground tabular-nums">-{formatCurrency(s.shareAmount)}</span>
                    </div>
                  )}
                </div>
              </DialogHeader>
              <div className="px-1 divide-y divide-border/50">
                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{t('expenses.payer', { defaultValue: 'Payer' })}</span>
                  <span className="text-xs text-foreground">{s.payerName}</span>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{t('personal.group', { defaultValue: 'Group' })}</span>
                  <span className="text-xs text-foreground">{s.sourceGroupName}</span>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{t('personal.status', { defaultValue: 'Status' })}</span>
                  <span className={`text-xs font-medium ${s.status === 'pending' ? 'text-amber-600' : 'text-green-600'}`}>
                    {s.status === 'pending' ? t('personal.pending') : t('personal.realized')}
                  </span>
                </div>
                {s.installments > 1 && (
                  <div className="flex items-start gap-3 py-2">
                    <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{t('expenses.installment', { defaultValue: 'Instalment' })}</span>

                    <span className="text-xs text-foreground">{s.installmentNo} / {s.installments}</span>
                  </div>
                )}
              </div>
              <div className="pt-1">
                <Link
                  to={`/groups/${s.sourceGroupId}?year=${year}&month=${month}&highlight=${s.sourceExpenseId}`}
                  onClick={() => setSelectedMirroredShare(null)}
                  className="flex items-center justify-center gap-1.5 w-full text-xs text-brand hover:text-brand/80 transition-colors py-2 rounded-md hover:bg-muted/50"
                >
                  {t('personal.viewInGroup')} <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
