import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/contexts/SearchContext';
import { useCategories } from '@/hooks/useCategories';
import { useExpenseSearch } from '@/hooks/useExpenseSearch';
import { getMyGroups } from '@/api/groups';
import { SearchResultRow } from '@/components/search/SearchResultRow';
import { PurchaseRow } from '@/components/search/PurchaseRow';
import { GroupChip } from '@/components/search/GroupChip';
import { avatarBg, initials } from '@/utils/avatar';
import { formatDayMonthYear } from '@/utils/format';
import { groupPurchases, type Purchase } from '@/utils/search';
import type { ExpenseSearchResult, Group } from '@/types/expense';

/** Filtro de la búsqueda general: todo, lo personal, o un grupo por id. */
type Filter = 'all' | 'personal' | number;

/** El día de una compra: su fecha, o el 1° del período para los fijos personales (sin fecha). */
function purchaseDay(p: Purchase): string {
  const r = p.first;
  return r.date ?? `${r.periodYear}-${String(r.periodMonth).padStart(2, '0')}-01`;
}

function matchesFilter(p: Purchase, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'personal') return p.first.groupType === 'personal';
  return p.first.groupId === filter;
}

export function SearchOverlay() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { open, scope, openSearch, closeSearch, inputRef, registerQuerySetter } = useSearch();
  const { data: categories = [] } = useCategories();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { results, hasMore, loading, error, retry, active } = useExpenseSearch(q, scope?.groupId);
  const months = t('months', { returnObjects: true }) as string[];
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];

  useEffect(() => {
    registerQuerySetter(setQ);
    return () => registerQuerySetter(null);
  }, [registerQuerySetter]);

  useEffect(() => { if (!open) { setQ(''); setFilter('all'); } }, [open]);
  useEffect(() => { setFilter('all'); }, [scope]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeSearch]);

  /*
    Los grupos del usuario, activos y archivados, se piden cada vez que se abre: el overlay está
    siempre montado y archivar es por miembro, así que una copia tomada al cargar la app quedaría
    vieja. De acá salen el "archivado" de cada fila, las personas de la tarjeta del grupo y el
    tipo del grupo de la línea de alcance.
  */
  const [groupsById, setGroupsById] = useState<Map<number, Group>>(new Map());
  const [archivedIds, setArchivedIds] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    Promise.all([getMyGroups(false), getMyGroups(true)])
      .then(([activeGroups, archivedGroups]) => {
        if (!alive) return;
        setGroupsById(new Map([...activeGroups, ...archivedGroups].map(g => [g.id, g])));
        setArchivedIds(new Set(archivedGroups.map(g => g.id)));
      })
      .catch(() => { /* sin la lista, las filas se ven como no archivadas: no bloquea buscar */ });
    return () => { alive = false; };
  }, [open]);

  /*
    Una compra en cuotas es una sola fila y se ubica en el día de la compra. El backend ordena
    por cuota, así que la compra se reordena acá por su propio día (el mismo criterio que usa el
    backend para elegir las 50 compras).
  */
  const purchases = useMemo(() => {
    const out = groupPurchases(results);
    out.sort((a, b) => purchaseDay(b).localeCompare(purchaseDay(a)) || b.first.id - a.first.id);
    return out;
  }, [results]);

  /* Filtros de la búsqueda general: sólo los grupos que tienen algo. Cuentan compras. */
  const filterChips = useMemo(() => {
    const personal = purchases.filter(p => p.first.groupType === 'personal').length;
    const byGroup = new Map<number, { groupId: number; name: string; count: number }>();
    for (const p of purchases) {
      if (p.first.groupType === 'personal') continue;
      const entry = byGroup.get(p.first.groupId);
      if (entry) entry.count += 1;
      else byGroup.set(p.first.groupId, { groupId: p.first.groupId, name: p.first.groupName, count: 1 });
    }
    return { total: purchases.length, personal, groups: [...byGroup.values()] };
  }, [purchases]);

  // Un texto nuevo que deja al grupo filtrado sin resultados vuelve a "Todo".
  useEffect(() => {
    if (filter === 'all' || loading) return;
    if (!purchases.some(p => matchesFilter(p, filter))) setFilter('all');
  }, [purchases, filter, loading]);

  const visible = useMemo(
    () => (scope ? purchases : purchases.filter(p => matchesFilter(p, filter))),
    [purchases, filter, scope],
  );

  const days = useMemo(() => {
    const out: { key: string; heading: string; items: Purchase[] }[] = [];
    for (const p of visible) {
      const r = p.first;
      const key = r.date ?? `${r.periodYear}-${r.periodMonth}`;
      const heading = r.date
        ? formatDayMonthYear(r.date, monthsShort)
        : `${months[r.periodMonth - 1] ?? ''} ${r.periodYear}`;
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(p); else out.push({ key, heading, items: [p] });
    }
    return out;
  }, [visible, months, monthsShort]);

  const select = (r: ExpenseSearchResult) => {
    closeSearch();
    if (r.groupType === 'personal') navigate(`/personal?year=${r.periodYear}&month=${r.periodMonth}`);
    else navigate(`/groups/${r.groupId}?year=${r.periodYear}&month=${r.periodMonth}&expense=${r.id}`);
  };

  const openGroup = (groupId: number) => {
    closeSearch();
    navigate(`/groups/${groupId}`);
  };

  /* "Buscar en todo ›": misma pantalla, alcance general, mismo texto y el foco en el input. */
  const searchEverywhere = () => openSearch(undefined, q);

  const rowScope = scope === null ? 'all' : 'group';
  const scopeGroup = scope ? groupsById.get(scope.groupId) : undefined;
  const filteredGroup = typeof filter === 'number'
    ? filterChips.groups.find(g => g.groupId === filter)
    : undefined;
  const filteredGroupData = typeof filter === 'number' ? groupsById.get(filter) : undefined;
  const showResults = active && !error;
  const tab = open ? 0 : -1;

  return (
    <div
      aria-hidden={!open}
      className={cn(
        'fixed inset-0 z-[45] flex flex-col bg-background transition-opacity duration-150',
        open ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div className="lg:mx-auto lg:w-full lg:max-w-lg" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
        {/* El campo de vidrio y, al lado, "Cancelar" en texto: una sola ✕, la que borra. */}
        <div className="flex items-center gap-2.5 px-4">
          <label className="glass flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full pl-3.5 pr-1.5">
            <Search className="h-[17px] w-[17px] shrink-0 text-foreground" strokeWidth={2.4} aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              tabIndex={tab}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={scope ? t('search.placeholderGroup', { group: scope.groupName }) : t('search.placeholderAll')}
              aria-label={scope ? t('search.placeholderGroup', { group: scope.groupName }) : t('search.placeholderAll')}
              className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted-2 [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button
                type="button"
                tabIndex={tab}
                onClick={() => { setQ(''); inputRef.current?.focus(); }}
                aria-label={t('search.clear')}
                className="flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-sunken text-[#57526E] dark:text-muted-1"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.6} />
              </button>
            )}
          </label>
          <button
            type="button"
            tabIndex={tab}
            onClick={closeSearch}
            className="shrink-0 cursor-pointer text-[13.5px] font-bold text-brand-ink"
          >
            {t('search.cancel')}
          </button>
        </div>

        {/* Búsqueda general: filtros por grupo, con su propio scroll lateral. */}
        {!scope && showResults && purchases.length > 0 && (
          <div
            role="group"
            aria-label={t('search.filters')}
            className="flex gap-[7px] overflow-x-auto px-4 pt-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <FilterChip label={t('search.filterAll')} count={filterChips.total} active={filter === 'all'} tabIndex={tab} onClick={() => setFilter('all')} />
            {filterChips.personal > 0 && (
              <FilterChip label={t('search.personal')} count={filterChips.personal} active={filter === 'personal'} tabIndex={tab} onClick={() => setFilter('personal')} />
            )}
            {filterChips.groups.map(g => (
              <FilterChip key={g.groupId} label={g.name} count={g.count} active={filter === g.groupId} tabIndex={tab} onClick={() => setFilter(g.groupId)} />
            ))}
          </div>
        )}

        {/* Búsqueda del grupo: el alcance y la salida a la búsqueda general. */}
        {scope && (
          <div className="flex min-w-0 items-center gap-2 px-[22px] pt-3.5">
            <GroupChip
              name={scope.groupName}
              groupId={scope.groupId}
              groupType={scopeGroup?.groupType ?? 'regular'}
              archived={archivedIds.has(scope.groupId)}
            />
            <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-muted-1">
              {scopeGroup?.groupType === 'one_time' ? t('search.wholeEvent') : t('search.allMonths')}
              {showResults && !loading && <> · {t('search.resultCount', { count: purchases.length })}</>}
            </span>
            <button
              type="button"
              tabIndex={tab}
              // Que el toque no le saque el foco al input: el teclado queda abierto.
              onPointerDown={e => e.preventDefault()}
              onClick={searchEverywhere}
              className="flex shrink-0 cursor-pointer items-center text-[11.5px] font-bold text-brand-ink"
            >
              {t('search.searchEverywhere')}
              <ChevronRight className="h-3 w-3" strokeWidth={2.8} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] lg:pb-6">
        <div className="mx-auto w-full min-w-0 max-w-lg">
          {!active && (
            <p className="mt-10 text-center text-[13px] font-medium text-muted-1">{t('search.hint')}</p>
          )}
          {active && error && (
            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <p className="text-[13px] font-medium text-muted-1">{t('search.error')}</p>
              <button type="button" tabIndex={tab} onClick={retry} className="h-9 cursor-pointer rounded-full bg-primary px-4 text-[12.5px] font-bold text-primary-foreground">
                {t('search.retry')}
              </button>
            </div>
          )}
          {showResults && !loading && results.length === 0 && (
            <p className="mt-10 text-center text-[13px] font-medium text-muted-1">{t('search.empty', { q: q.trim() })}</p>
          )}

          {/* Filtrado por un grupo: acceso directo para abrirlo. Personal no lleva tarjeta. */}
          {showResults && !scope && filteredGroup && (
            <div className="mt-4 flex min-w-0 items-center gap-[11px] rounded-[16px] border border-line bg-surface px-3.5 py-3">
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-[14px] font-bold text-white',
                  avatarBg(filteredGroup.groupId),
                )}
                aria-hidden="true"
              >
                {initials(filteredGroup.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold text-foreground">{filteredGroup.name}</span>
                <span className="mt-0.5 block truncate text-[11px] font-medium text-muted-1">
                  {[
                    filteredGroupData?.groupType === 'one_time' ? t('search.kindEvent') : t('search.kindGroup'),
                    filteredGroupData ? t('search.peopleCount', { count: filteredGroupData.members.length }) : null,
                    t('search.resultCount', { count: filteredGroup.count }),
                  ].filter(Boolean).join(' · ')}
                </span>
              </span>
              <button
                type="button"
                tabIndex={tab}
                onClick={() => openGroup(filteredGroup.groupId)}
                className="shrink-0 cursor-pointer text-[12px] font-bold text-brand-ink"
              >
                {t('search.openGroup')} ›
              </button>
            </div>
          )}

          {showResults && days.map(day => (
            <section key={day.key}>
              <h2 className="px-1.5 pb-1.5 pt-4 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-1">{day.heading}</h2>
              <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
                {day.items.map(p => {
                  const archived = archivedIds.has(p.first.groupId);
                  const emoji = categories.find(c => c.name === p.first.category)?.emoji;
                  return p.first.installments > 1 ? (
                    <PurchaseRow
                      key={p.key}
                      purchase={p}
                      emoji={emoji}
                      query={q}
                      scope={rowScope}
                      archived={archived}
                      onSelect={select}
                    />
                  ) : (
                    <SearchResultRow
                      key={p.key}
                      result={p.first}
                      emoji={emoji}
                      query={q}
                      scope={rowScope}
                      archived={archived}
                      onSelect={() => select(p.first)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
          {showResults && hasMore && (
            <p className="mt-4 text-center text-[11.5px] font-medium text-muted-2">{t('search.capped')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, count, active, tabIndex, onClick }: {
  label: string;
  count: number;
  active: boolean;
  tabIndex: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={tabIndex}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex max-w-[200px] shrink-0 cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-full border px-3 py-[7px] text-[12px] font-bold',
        active
          ? 'border-brand bg-brand text-primary-foreground'
          : 'border-line-strong bg-surface text-foreground',
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className={cn('font-semibold tabular-nums', active ? 'text-primary-foreground/90' : 'text-muted-1')}>{count}</span>
    </button>
  );
}
