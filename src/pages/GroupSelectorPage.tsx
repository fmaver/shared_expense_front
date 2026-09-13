import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Archive, ChevronRight, Plus } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { usePersonalLedger } from '@/hooks/usePersonalLedger';
import { useMonthSearchParams } from '@/hooks/useMonthSearchParams';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/format';
import { avatarBg, initials } from '@/utils/avatar';
import { cn } from '@/lib/utils';
import type { Group } from '@/types/expense';

/**
 * La primera pantalla después de entrar.
 *
 * Arriba la suma de todo lo que te deben o debés entre grupos, que es la pregunta con la que
 * se abre la app; después tu plata del mes y la lista de grupos, cada uno con su saldo (§6.12).
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
  const monthName = months[month - 1] ?? '';

  // El saldo de cada grupo ya viene calculado en el ledger personal: no hace falta pedir el
  // mes de cada grupo por separado para saber cómo venís en cada uno.
  const balanceByGroup = new Map(
    (ledger?.groupBalances ?? []).map(g => [g.sourceGroupId, g]),
  );
  const pending = ledger?.pendingSettlementsTotal ?? 0;
  const openMoves = (ledger?.groupBalances ?? [])
    .filter(g => !g.isSettled && Math.abs(g.netBalance) > 0.01).length;

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-6">
      {/* ── Cuánto te deben, entre todos los grupos ─────────────────────────────────── */}
      <h1
        className={cn(
          'font-display text-[30px] leading-[1.1] tabular-nums',
          Math.abs(pending) <= 0.01 ? 'text-foreground' : pending > 0 ? 'text-positive' : 'text-negative',
        )}
      >
        {Math.abs(pending) <= 0.01
          ? t('groups.squareTotal')
          : pending > 0
            ? t('groups.owedTotal', { amount: formatCurrency(pending) })
            : t('groups.oweTotal', { amount: formatCurrency(Math.abs(pending)) })}
      </h1>
      {openMoves > 0 && (
        <p className="mt-2 text-[12.5px] font-medium text-muted-1">
          {t('groups.movesLeft', { count: openMoves })}
        </p>
      )}

      {/* ── Tu plata ────────────────────────────────────────────────────────────────── */}
      <Link
        to="/personal"
        className="mt-4 flex items-center justify-between gap-3 rounded-card-lg bg-ink p-4 transition-opacity hover:opacity-95"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-on-dark">
            {t('groups.yourMoney')}
          </span>
          <span className="mt-1 block font-display text-[26px] leading-none tabular-nums text-paper">
            {ledger ? formatCurrency(ledger.currentBalance) : '—'}
          </span>
          <span className="mt-1 block text-[11.5px] font-medium text-muted-on-dark-2">
            {t('groups.availableThisMonth')}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-on-dark" aria-hidden="true" />
      </Link>

      {error && (
        <p className="mt-4 rounded-card border border-negative-wash-line bg-negative-wash px-4 py-3 text-[12.5px] font-semibold text-negative-ink">
          {t('groups.failedToFetch')}
        </p>
      )}

      {/* ── Tus grupos ──────────────────────────────────────────────────────────────── */}
      <div className="mt-4 space-y-2">
        {isLoading ? (
          [1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-card" />)
        ) : (
          groups.map(group => {
            const balance = balanceByGroup.get(group.id);
            const net = balance?.netBalance ?? 0;
            const isSquare = Math.abs(net) <= 0.01;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => navigate(`/groups/${group.id}`)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-card border border-line bg-surface p-4 text-left shadow-card transition-colors hover:bg-surface-sunken"
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
                <span
                  className={cn(
                    'shrink-0 text-[13px] font-bold tabular-nums',
                    isSquare ? 'text-muted-2' : net > 0 ? 'text-positive' : 'text-negative',
                  )}
                >
                  {isSquare ? t('groups.inZero') : `${net > 0 ? '+' : ''}${formatCurrency(net)}`}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* ── Armar uno ───────────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="mt-3 flex w-full cursor-pointer items-center gap-3 rounded-card border border-dashed border-line-strong px-4 py-3.5 text-left transition-colors hover:bg-surface-sunken"
      >
        <Plus className="h-4 w-4 shrink-0 text-muted-2" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-bold text-foreground">{t('groups.startOne')}</span>
          <span className="block truncate text-[11.5px] font-medium text-muted-2">
            {t('groups.orJoinWithLink')}
          </span>
        </span>
      </button>

      {/* ── Archivados ──────────────────────────────────────────────────────────────── */}
      {archived.length > 0 && (
        <Link
          to="/groups/archived"
          className="mt-4 flex items-center gap-2 text-[12px] font-medium text-muted-2 transition-colors hover:text-foreground"
        >
          <Archive className="h-3.5 w-3.5" aria-hidden="true" />
          {t('groups.archivedFooter', { count: archived.length })}
          <span className="font-bold text-brand-ink">{t('groups.see')}</span>
        </Link>
      )}

      <CreateGroupDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={(g: Group) => navigate(`/groups/${g.id}`)}
      />
    </div>
  );
}
