import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Archive, ChevronRight, Plus, Wallet } from 'lucide-react';
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

  /** "Casa y Bariloche" — los grupos que hacen falta cerrar, nombrados. */
  const openNames = (() => {
    const names = openGroups.map(g => g.sourceGroupName);
    if (names.length === 0) return '';
    if (names.length === 1) return names[0];
    return `${names.slice(0, -1).join(', ')} ${t('groups.and')} ${names[names.length - 1]}`;
  })();

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-6">
      {/* ── Cuánto te deben, entre todos los grupos ─────────────────────────────────── */}
      <h1
        className={cn(
          'text-[30px] font-extrabold leading-[1.1] tracking-[-0.025em] tabular-nums',
          Math.abs(pending) <= 0.01 ? 'text-foreground' : pending > 0 ? 'text-positive' : 'text-negative',
        )}
      >
        {Math.abs(pending) <= 0.01
          ? t('groups.squareTotal')
          : pending > 0
            ? t('groups.owedTotal', { amount: formatCurrency(pending) })
            : t('groups.oweTotal', { amount: formatCurrency(Math.abs(pending)) })}
      </h1>
      {/* Con los grupos nombrados: "en total" no dice de dónde sale, y de dónde sale importa. */}
      {openGroups.length > 0 && (
        <p className="mt-2 text-[12.5px] font-medium leading-[1.45] text-muted-1">
          {t('groups.movesLeftNamed', { count: openGroups.length, groups: openNames })}
        </p>
      )}

      {/* ── Tu plata ────────────────────────────────────────────────────────────────── */}
      <Link
        to="/personal"
        className="mt-4 flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-card transition-colors hover:bg-surface-sunken"
      >
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-surface-sunken">
          <Wallet className="h-4 w-4 text-muted-1" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold text-foreground">
            {t('groups.yourMoney')}
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] font-medium text-muted-2">
            {t('groups.yourMoneyDesc')}
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-bold tabular-nums text-positive">
          {ledger ? formatCompactCurrency(ledger.currentBalance) : '—'}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-2" aria-hidden="true" />
      </Link>

      {error && (
        <p className="mt-4 rounded-card border border-negative-wash-line bg-negative-wash px-4 py-3 text-[12.5px] font-semibold text-negative-ink">
          {t('groups.failedToFetch')}
        </p>
      )}

      {/* ── Tus grupos ──────────────────────────────────────────────────────────────── */}
      <p className="mt-6 text-[10.5px] font-bold uppercase tracking-[0.13em] text-muted-2">
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
