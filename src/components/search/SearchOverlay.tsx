import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassButton } from '@/components/ui/Glass';
import { useSearch } from '@/contexts/SearchContext';
import { useCategories } from '@/hooks/useCategories';
import { useExpenseSearch } from '@/hooks/useExpenseSearch';
import { SearchResultRow } from '@/components/search/SearchResultRow';
import { formatDayMonthYear } from '@/utils/format';
import type { ExpenseSearchResult } from '@/types/expense';

export function SearchOverlay() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { open, scope, closeSearch, inputRef } = useSearch();
  const { data: categories = [] } = useCategories();
  const [q, setQ] = useState('');
  const { results, hasMore, loading, error, retry, active } = useExpenseSearch(q, scope?.groupId);
  const months = t('months', { returnObjects: true }) as string[];
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];

  useEffect(() => { if (!open) setQ(''); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeSearch]);

  const groups = useMemo(() => {
    const out: { key: string; heading: string; items: ExpenseSearchResult[] }[] = [];
    for (const r of results) {
      const key = r.date ?? `${r.periodYear}-${r.periodMonth}`;
      const heading = r.date
        ? formatDayMonthYear(r.date, monthsShort)
        : `${months[r.periodMonth - 1] ?? ''} ${r.periodYear}`;
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(r); else out.push({ key, heading, items: [r] });
    }
    return out;
  }, [results, months, monthsShort]);

  const select = (r: ExpenseSearchResult) => {
    closeSearch();
    if (r.groupType === 'personal') navigate(`/personal?year=${r.periodYear}&month=${r.periodMonth}`);
    else navigate(`/groups/${r.groupId}?year=${r.periodYear}&month=${r.periodMonth}&expense=${r.id}`);
  };
  return (
    <div
      aria-hidden={!open}
      className={cn(
        'fixed inset-0 z-[45] flex flex-col bg-background transition-opacity duration-150',
        open ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      {/* El campo que se estira: donde estaba la barra flotante, a lo ancho, con la ✕ al lado. */}
      <div className="flex items-center gap-2.5 px-4 pb-3 lg:mx-auto lg:w-full lg:max-w-lg" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
        <label className="glass flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full pl-3.5 pr-1.5">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-1" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            tabIndex={open ? 0 : -1}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={scope ? t('search.placeholderGroup', { group: scope.groupName }) : t('search.placeholderAll')}
            aria-label={scope ? t('search.placeholderGroup', { group: scope.groupName }) : t('search.placeholderAll')}
            className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-foreground outline-none placeholder:text-muted-2 [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              type="button"
              onClick={() => { setQ(''); inputRef.current?.focus(); }}
              aria-label={t('search.clear')}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted-3/50 text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>
        <GlassButton onClick={closeSearch} aria-label={t('search.close')} tabIndex={open ? 0 : -1} className="h-11 w-11">
          <X className="h-5 w-5" strokeWidth={2.4} />
        </GlassButton>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] lg:pb-6">
        <div className="mx-auto w-full max-w-lg">
          {!active && (
            <p className="mt-10 text-center text-[13px] font-medium text-muted-1">{t('search.hint')}</p>
          )}
          {active && error && (
            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <p className="text-[13px] font-medium text-muted-1">{t('search.error')}</p>
              <button type="button" onClick={retry} className="h-9 cursor-pointer rounded-full bg-primary px-4 text-[12.5px] font-bold text-primary-foreground">
                {t('search.retry')}
              </button>
            </div>
          )}
          {active && !error && !loading && results.length === 0 && (
            <p className="mt-10 text-center text-[13px] font-medium text-muted-1">{t('search.empty', { q: q.trim() })}</p>
          )}
          {active && !error && groups.map(group => (
            <section key={group.key} className="mt-4">
              <h2 className="px-1 pb-2 text-[12px] font-bold text-muted-1">{group.heading}</h2>
              <div className="overflow-hidden rounded-card border border-line bg-surface">
                {group.items.map(r => (
                  <SearchResultRow
                    key={`${r.kind}-${r.id}`}
                    result={r}
                    emoji={categories.find(c => c.name === r.category)?.emoji}
                    showGroup={scope === null}
                    onSelect={() => select(r)}
                  />
                ))}
              </div>
            </section>
          ))}
          {active && hasMore && (
            <p className="mt-4 text-center text-[11.5px] font-medium text-muted-2">{t('search.capped')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
