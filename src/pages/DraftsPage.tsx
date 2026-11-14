import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronLeft, ImageOff, Inbox } from 'lucide-react';
import {
  confirmDraft,
  discardDraft,
  draftToExpenseDraft,
  getDraftImage,
  resolveDraft,
} from '@/api/drafts';
import type { ExpenseDraft } from '@/api/expenses';
import type { Draft } from '@/types/expense';
import { useDrafts } from '@/hooks/useDrafts';
import { useScroll } from '@/contexts/ScrollContext';
import { useIsland } from '@/contexts/IslandContext';
import { useExpenseRefresh } from '@/contexts/ExpenseRefreshContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Skeleton } from '@/components/ui/skeleton';
import { FloatingTopBar, TopBarSpacer } from '@/components/layout/FloatingTopBar';
import { GroupExpenseLauncher } from '@/components/layout/GroupExpenseLauncher';
import { capitalize, relativeAge } from '@/utils/format';
import { cn } from '@/lib/utils';

interface DraftImage {
  file: File;
  url: string;
}

/**
 * Las capturas de cada borrador, como File (para pasarle a la hoja de carga) y como object URL
 * (para la miniatura).
 *
 * Las URLs se revocan cuando el borrador sale de la lista y al desmontar. Una imagen que llega
 * después de que su borrador se fue (confirmado en otra pestaña, descartado) se tira sin
 * guardarse. `load` deja pedir una que todavía no llegó, compartiendo el pedido en vuelo.
 */
function useDraftImages(drafts: Draft[]) {
  const [images, setImages] = useState<Map<number, DraftImage>>(() => new Map());
  const imagesRef = useRef(images);
  const inflight = useRef(new Map<number, Promise<File | null>>());
  const liveIds = useRef(new Set<number>());
  const mounted = useRef(true);

  const load = useCallback((id: number): Promise<File | null> => {
    const existing = imagesRef.current.get(id);
    if (existing) return Promise.resolve(existing.file);
    const pending = inflight.current.get(id);
    if (pending) return pending;
    const request = getDraftImage(id)
      .then(file => {
        if (!mounted.current || !liveIds.current.has(id)) return file;
        const url = URL.createObjectURL(file);
        const next = new Map(imagesRef.current).set(id, { file, url });
        imagesRef.current = next;
        setImages(next);
        return file;
      })
      .catch(() => null)
      .finally(() => { inflight.current.delete(id); });
    inflight.current.set(id, request);
    return request;
  }, []);

  useEffect(() => {
    liveIds.current = new Set(drafts.map(d => d.id));
    let next: Map<number, DraftImage> | null = null;
    for (const [id, image] of imagesRef.current) {
      if (!liveIds.current.has(id)) {
        URL.revokeObjectURL(image.url);
        next ??= new Map(imagesRef.current);
        next.delete(id);
      }
    }
    if (next) {
      imagesRef.current = next;
      setImages(next);
    }
    for (const d of drafts) if (d.hasImage) load(d.id);
  }, [drafts, load]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const image of imagesRef.current.values()) URL.revokeObjectURL(image.url);
      imagesRef.current = new Map();
    };
  }, []);

  return { images, load };
}

interface Review {
  draftId: number;
  file: File | null;
  scanDraft: ExpenseDraft;
  suggestedGroupId: number | null;
}

/**
 * Para revisar — los borradores de la carga rápida (atajo de iOS, "Dejar para después").
 *
 * Cada uno se confirma tal cual en el grupo sugerido, se revisa con la misma hoja del "+"
 * (selector de grupo con "Sugerido" y el formulario precargado), o se descarta. Nada se crea
 * sin que la persona lo toque.
 */
export function DraftsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { notifyScroll } = useScroll();
  const island = useIsland();
  const { requestExpenseRefresh } = useExpenseRefresh();
  const { formatAmount } = useCurrency();
  const { drafts, loading, error: loadFailed, refetch } = useDrafts();
  const { images, load } = useDraftImages(drafts);

  const [titleEl, setTitleEl] = useState<HTMLHeadingElement | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [armedDiscardId, setArmedDiscardId] = useState<number | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  /*
    Borradores cuyo gasto ya se guardó desde la hoja pero que el backend no llegó a cerrar
    (`resolveDraft` falló dos veces). Ofrecer Confirmar o Revisar ahí duplicaría el gasto: solo
    queda Descartar.
  */
  const [savedUnresolved, setSavedUnresolved] = useState<Set<number>>(() => new Set());

  // El "¿Descartar?" armado se desarma solo: un toque olvidado no queda listo para borrar.
  useEffect(() => {
    if (armedDiscardId === null) return;
    const timer = setTimeout(() => setArmedDiscardId(null), 4000);
    return () => clearTimeout(timer);
  }, [armedDiscardId]);

  /* Igual que la flecha: un paso atrás, o al inicio si se entró directo (push, deep link). */
  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/groups', { replace: true });
  };

  const handleConfirm = async (draft: Draft) => {
    if (draft.suggestedGroupId == null || busyId !== null) return;
    setBusyId(draft.id);
    try {
      await confirmDraft(draft.id, draft.suggestedGroupId);
      island.success();
      requestExpenseRefresh();
      await refetch();
    } catch (error) {
      toast.error((error as Error).message);
      // Un 409 suele ser que ya se resolvió en otro lado: la lista tiene que reflejarlo.
      await refetch();
    } finally {
      setBusyId(null);
    }
  };

  const handleReview = async (draft: Draft) => {
    if (busyId !== null) return;
    setBusyId(draft.id);
    // Sin la foto la hoja no aplica el borrador: se espera a que llegue si todavía no está.
    const file = draft.hasImage ? await load(draft.id) : null;
    setBusyId(null);
    setReview({
      draftId: draft.id,
      file,
      scanDraft: draftToExpenseDraft(draft),
      suggestedGroupId: draft.suggestedGroupId,
    });
  };

  const handleDiscard = async (draft: Draft) => {
    if (busyId !== null) return;
    if (armedDiscardId !== draft.id) {
      setArmedDiscardId(draft.id);
      return;
    }
    setArmedDiscardId(null);
    setBusyId(draft.id);
    try {
      await discardDraft(draft.id);
      await refetch();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReviewSaved = async () => {
    // El lanzador ya mostró el éxito y pidió refrescar los gastos; acá se cierra el borrador.
    if (!review) return;
    const id = review.draftId;
    try {
      await resolveDraft(id);
    } catch {
      // Un reintento: el gasto ya existe, así que vale la pena insistir antes de avisar.
      try {
        await resolveDraft(id);
      } catch {
        setSavedUnresolved(current => new Set(current).add(id));
        toast.error(t('drafts.savedNotResolved'));
      }
    }
    await refetch();
  };

  const paymentLabel = (draft: Draft) => {
    if (draft.paymentType === 'credit') {
      const n = draft.installments ?? 1;
      return n > 1
        ? `${t('expenseForm.credit')} · ${t('drafts.installments', { count: n })}`
        : t('expenseForm.credit');
    }
    if (draft.paymentType === 'debit') return t('expenseForm.debit');
    return null;
  };

  return (
    <div className="flex flex-1 flex-col">
      <FloatingTopBar
        back={{ to: '/groups', label: t('common.back') }}
        band={{ watch: titleEl, title: t('drafts.title') }}
      />
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden pb-tabbar lg:pb-0"
        onScroll={(e) => notifyScroll((e.target as HTMLDivElement).scrollTop)}
      >
        <div className="mx-auto w-full max-w-lg px-5 py-6">
          <TopBarSpacer />
          <button
            type="button"
            onClick={goBack}
            className="mb-3 hidden cursor-pointer items-center gap-0.5 text-[12px] font-semibold text-muted-2 transition-colors hover:text-foreground lg:inline-flex"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t('common.back')}
          </button>
          <h1
            ref={setTitleEl}
            className="truncate text-[23px] font-bold leading-[1.1] tracking-[-0.025em] text-foreground"
          >
            {t('drafts.title')}
          </h1>

          <div className="mt-4 space-y-2.5">
            {loading ? (
              <>
                <Skeleton className="h-28 w-full rounded-card" />
                <Skeleton className="h-28 w-full rounded-card" />
              </>
            ) : loadFailed && drafts.length === 0 ? (
              <div className="px-1 py-10 text-center">
                <p className="text-[13px] font-semibold text-muted-1">{t('drafts.loadFailed')}</p>
                <button
                  type="button"
                  onClick={() => { refetch(); }}
                  className="mx-auto mt-4 flex h-9 cursor-pointer items-center rounded-pill border border-line-strong px-4 text-[12px] font-bold text-foreground transition-colors hover:bg-surface-sunken"
                >
                  {t('drafts.retry')}
                </button>
              </div>
            ) : drafts.length === 0 ? (
              <div className="px-1 py-10 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken">
                  <Inbox className="h-7 w-7 text-muted-2" aria-hidden="true" />
                </span>
                <p className="mt-4 text-[14px] font-bold text-foreground">{t('drafts.empty')}</p>
                <button
                  type="button"
                  onClick={goBack}
                  className="mx-auto mt-5 flex h-9 cursor-pointer items-center rounded-pill border border-line-strong px-4 text-[12px] font-bold text-foreground transition-colors hover:bg-surface-sunken"
                >
                  {t('common.back')}
                </button>
              </div>
            ) : (
              drafts.map(draft => {
                const image = images.get(draft.id);
                const unresolved = savedUnresolved.has(draft.id);
                const complete = draft.amount != null && draft.suggestedGroupId != null;
                const busy = busyId === draft.id;
                const armed = armedDiscardId === draft.id;
                const payment = paymentLabel(draft);
                return (
                  <div
                    key={draft.id}
                    className="rounded-card border border-line bg-surface p-4 shadow-card"
                  >
                    <div className="flex items-start gap-3">
                      {/* La captura: es lo que te hace acordar de qué era. */}
                      {draft.hasImage && image ? (
                        <img
                          src={image.url}
                          alt=""
                          className="h-[58px] w-[44px] shrink-0 rounded-[8px] border border-line object-cover"
                        />
                      ) : (
                        <span className="flex h-[58px] w-[44px] shrink-0 items-center justify-center rounded-[8px] bg-surface-sunken">
                          {draft.hasImage
                            ? <Skeleton className="h-full w-full rounded-[8px]" />
                            : <ImageOff className="h-4 w-4 text-muted-3" aria-hidden="true" />}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="min-w-0 truncate text-[14px] font-bold text-foreground">
                            {draft.description ? capitalize(draft.description) : t('drafts.noDescription')}
                          </p>
                          {draft.amount != null ? (
                            <span className="shrink-0 text-[14px] font-bold tabular-nums text-foreground">
                              {formatAmount(draft.amount, draft.currency ?? 'ARS')}
                            </span>
                          ) : (
                            <span className="shrink-0 text-[12px] font-semibold text-negative">
                              {t('drafts.noAmount')}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-[12px] font-medium text-muted-1">
                          {draft.suggestedGroupName ?? t('drafts.noGroup')}
                          {payment && <> · {payment}</>}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-muted-2">
                          {t('drafts.savedAge', { age: relativeAge(draft.createdAt, i18n.language) })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1">
                      {complete && !unresolved && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleConfirm(draft)}
                          className="flex h-9 cursor-pointer items-center whitespace-nowrap rounded-pill bg-primary px-3 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-50"
                        >
                          {t('drafts.confirm')}
                        </button>
                      )}
                      {!unresolved && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleReview(draft)}
                        className={cn(
                          'flex h-9 cursor-pointer items-center whitespace-nowrap rounded-pill px-3 text-[12px] font-bold transition-colors disabled:cursor-default disabled:opacity-50',
                          complete
                            ? 'border border-line-strong text-foreground hover:bg-surface-sunken'
                            : 'bg-primary text-primary-foreground hover:opacity-90',
                        )}
                      >
                        {draft.amount == null ? t('drafts.complete') : t('drafts.review')}
                      </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDiscard(draft)}
                        onBlur={() => { if (armed) setArmedDiscardId(null); }}
                        className={cn(
                          'ml-auto flex h-9 cursor-pointer items-center whitespace-nowrap rounded-pill px-2 text-[12px] font-bold transition-colors disabled:cursor-default disabled:opacity-50',
                          armed
                            ? 'border border-negative-wash-line bg-negative-wash text-negative-ink'
                            : 'text-muted-2 hover:text-negative',
                        )}
                      >
                        {armed ? t('drafts.discardConfirm') : t('drafts.discard')}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/*
        Sin `presetGroupId`: primero el selector, con el sugerido marcado. Al cerrar (guardado o
        cancelado) se limpia todo, así nada del borrador anterior se cuela en la próxima apertura.
      */}
      <GroupExpenseLauncher
        open={review !== null}
        onClose={() => setReview(null)}
        mode="expense"
        scanFile={review?.file ?? null}
        scanDraft={review?.scanDraft ?? null}
        suggestedGroupId={review?.suggestedGroupId ?? null}
        onSaved={handleReviewSaved}
      />
    </div>
  );
}
