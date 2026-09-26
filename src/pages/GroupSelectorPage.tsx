import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Archive, ChevronRight, Plus } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { usePersonalLedger } from '@/hooks/usePersonalLedger';
import { useMonthSearchParams } from '@/hooks/useMonthSearchParams';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { capitalize, formatCompactCurrency, formatCurrency, formatDayMonth } from '@/utils/format';
import { avatarBg, initials } from '@/utils/avatar';
import { cn } from '@/lib/utils';
import type { Group } from '@/types/expense';

/**
 * La primera pantalla después de entrar.
 *
 * Arriba tu saldo neto entre grupos, que es la pregunta con la que se abre la app, con una
 * pastilla por grupo que lo explica; después tu plata del mes y la lista de grupos, cada uno con
 * su saldo (§6.12, y el ajuste 2 de ADDENDUM-violeta.md).
 */
export function GroupSelectorPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { year, month } = useMonthSearchParams();
  const { data: groups = [], isLoading, error } = useGroups();
  const { data: archived = [] } = useGroups(true);
  const { data: ledger } = usePersonalLedger(year, month);
  const [showCreate, setShowCreate] = useState(false);

  const months = t('months', { returnObjects: true }) as string[];
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];
  const monthName = months[month - 1] ?? '';

  // El saldo de cada grupo ya viene calculado en el ledger personal: no hace falta pedir el
  // mes de cada grupo por separado para saber cómo venís en cada uno.
  const balanceByGroup = new Map(
    (ledger?.groupBalances ?? []).map(g => [g.sourceGroupId, g]),
  );
  const pending = ledger?.pendingSettlementsTotal ?? 0;
  const openGroups = (ledger?.groupBalances ?? [])
    .filter(g => !g.isSettled && Math.abs(g.netBalance) > 0.01);
  const signedCurrency = (n: number) => `${n > 0 ? '+' : '−'}${formatCurrency(Math.abs(n))}`;

  /*
    El último gasto de cada grupo, sacado de tu parte en él. Es lo que ya trae el ledger: pedir
    el mes de cada grupo sólo para poner una línea de contexto serían N requests por pantalla.
  */
  const lastByGroup = new Map<number, { description: string; date: string }>();
  for (const share of ledger?.mirroredShares ?? []) {
    const current = lastByGroup.get(share.sourceGroupId);
    if (!current || share.date > current.date) {
      lastByGroup.set(share.sourceGroupId, { description: share.description, date: share.date });
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-6">
      {/* ── Tu saldo en grupos: la cifra neta y de qué grupo sale cada parte ─────────── */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-1">
        {t('groups.balanceLabel')}
      </p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span
          className={cn(
            'text-[36px] font-extrabold leading-none tracking-[-0.035em] tabular-nums',
            Math.abs(pending) <= 0.01 ? 'text-foreground' : pending > 0 ? 'text-positive' : 'text-negative',
          )}
        >
          {Math.abs(pending) <= 0.01 ? formatCurrency(0) : signedCurrency(pending)}
        </span>
        <span className="text-[13px] font-semibold text-muted-1">
          {Math.abs(pending) <= 0.01
            ? t('groups.squareTotal')
            : t(pending > 0 ? 'groups.inFavour' : 'groups.toPay')}
        </span>
      </div>
      {openGroups.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {openGroups.map(g => (
            <span
              key={g.sourceGroupId}
              className="flex flex-none items-center gap-[5px] whitespace-nowrap rounded-full border border-line bg-surface px-[9px] py-1.5 text-[11px] font-semibold text-foreground"
            >
              {g.sourceGroupName}
              <span className={cn('font-bold tabular-nums', g.netBalance > 0 ? 'text-positive' : 'text-negative')}>
                {signedCurrency(g.netBalance)}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* ── Tu plata ────────────────────────────────────────────────────────────────── */}
      <Link
        to="/personal"
        className="mt-[22px] flex items-center gap-3 rounded-card-lg border border-brand-wash-line bg-surface-sunken px-[18px] py-4 transition-opacity hover:opacity-90 dark:bg-brand-wash"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold text-foreground">
            {t('groups.yourMoney')}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-medium text-[#57526E] dark:text-muted-1">
            {t('groups.yourMoneyDesc')}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[17px] font-extrabold tracking-[-0.02em] tabular-nums text-[#4A3C96] dark:text-brand-ink">
            {ledger ? formatCompactCurrency(ledger.currentBalance) : '—'}
          </span>
          <span className="mt-0.5 block text-[10.5px] font-semibold text-[#57526E] dark:text-muted-1">
            {t('groups.moneyLeft')}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-brand-ink" aria-hidden="true" />
      </Link>

      {error && (
        <p className="mt-4 rounded-card border border-negative-wash-line bg-negative-wash px-4 py-3 text-[12.5px] font-semibold text-negative-ink">
          {t('groups.failedToFetch')}
        </p>
      )}

      {/* ── Tus grupos ──────────────────────────────────────────────────────────────── */}
      <p className="mt-[18px] text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-1">
        {t('groups.yourGroups')}
      </p>

      <div className="mt-2 space-y-2">
        {isLoading ? (
          [1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-card" />)
        ) : (
          groups.map(group => {
            const balance = balanceByGroup.get(group.id);
            const net = balance?.netBalance ?? 0;
            const isSquare = Math.abs(net) <= 0.01;
            const last = lastByGroup.get(group.id);
            const isOpen = !isSquare && !balance?.isSettled;
            return (
              <div
                key={group.id}
                className="overflow-hidden rounded-card border border-line bg-surface shadow-card"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="flex w-full cursor-pointer items-center gap-3 p-4 text-left transition-colors hover:bg-surface-sunken"
                >
                  <span className={cn(
                    'flex h-[34px] w-[34px] shrink-0 select-none items-center justify-center rounded-[11px] text-[12px] font-bold text-white',
                    avatarBg(group.id),
                  )}>
                    {initials(group.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13.5px] font-bold text-foreground">{group.name}</span>
                      {group.groupType === 'one_time' && (
                        <span className="shrink-0 rounded-chip bg-tag-split-wash px-1.5 py-0.5 text-[10.5px] font-bold text-tag-split">
                          {t('expenses.badgeEvent')}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] font-medium text-muted-2">
                      {t('groups.peopleCount', { count: group.members.length })}
                      {group.groupType !== 'one_time' && (
                        <> · {t(balance?.isSettled ? 'groups.monthSettled' : 'groups.monthOpen', {
                          month: monthName.toLocaleLowerCase(),
                        })}</>
                      )}
                    </span>
                  </span>
                  {/* El saldo, y debajo en palabras de qué lado estás. */}
                  <span className="shrink-0 text-right">
                    <span
                      className={cn(
                        'block text-[13px] font-bold tabular-nums',
                        isSquare ? 'text-muted-2' : net > 0 ? 'text-positive' : 'text-negative',
                      )}
                    >
                      {isSquare ? t('groups.inZero') : `${net > 0 ? '+' : ''}${formatCurrency(net)}`}
                    </span>
                    {!isSquare && (
                      <span className="mt-0.5 block text-[11px] font-medium text-muted-2">
                        {t(net > 0 ? 'groups.inYourFavour' : 'groups.youOweShort')}
                      </span>
                    )}
                  </span>
                </button>

                {/* Qué pasó último ahí adentro, y la salida directa a saldarlo. */}
                {(last || isOpen) && (
                  <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
                    <span className="min-w-0 truncate text-[11.5px] font-medium text-muted-2">
                      {last
                        ? t('groups.lastExpense', {
                            description: capitalize(last.description),
                            date: formatDayMonth(last.date, monthsShort),
                          })
                        : ''}
                    </span>
                    {isOpen && (
                      <Link
                        to={`/groups/${group.id}/settle?year=${year}&month=${month}`}
                        className="shrink-0 text-[12px] font-bold text-brand-ink transition-opacity hover:opacity-70"
                      >
                        {t('groups.settleLink')}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Armar uno ───────────────────────────────────────────────────────────────── */}
      {/* Punteado y sin fondo: se lee como una acción, no como un grupo más. */}
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="mt-2.5 flex w-full cursor-pointer items-center gap-[11px] rounded-card border-[1.5px] border-dashed border-muted-3 bg-transparent px-4 py-[15px] text-left transition-colors hover:bg-surface-sunken/60"
      >
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] border-[1.5px] border-dashed border-muted-3 text-brand-ink">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold text-brand-ink">{t('groups.startOne')}</span>
          <span className="mt-0.5 block truncate text-[11px] font-medium text-muted-1">
            {t('groups.orJoinWithLink')}
          </span>
        </span>
      </button>

      {/* ── Archivados ──────────────────────────────────────────────────────────────── */}
      {archived.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-muted-2">
            <Archive className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{t('groups.archivedFooter', { count: archived.length })}</span>
          </span>
          <Link
            to="/groups/archived"
            className="flex h-8 shrink-0 items-center rounded-pill border border-line-strong px-3.5 text-[12px] font-bold text-foreground transition-colors hover:bg-surface-sunken"
          >
            {t('groups.see')}
          </Link>
        </div>
      )}

      <CreateGroupDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={(g: Group) => navigate(`/groups/${g.id}`)}
      />
    </div>
  );
}
