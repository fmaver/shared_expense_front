import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { FloatingTopBar, TopBarSpacer } from '@/components/layout/FloatingTopBar';
import { useGroup } from '@/hooks/useGroups';

/**
 * "Buscar" (ADDENDUM-violeta.md V6.5), detrás de FEATURE_SEARCH.
 *
 * Todavía no hay endpoint de búsqueda, así que la pantalla es la cáscara: el input y el
 * estado vacío que dice qué va a poder hacerse. No filtra nada en el cliente a propósito:
 * buscar sólo en el mes cargado daría resultados que parecen completos y no lo son.
 */
export function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  const groupId = params.get('scope') === 'group' ? Number(params.get('groupId')) : null;
  const { data: group } = useGroup(groupId ?? 0);
  const placeholder = groupId && group
    ? t('search.placeholderGroup', { group: group.name })
    : t('search.placeholderPersonal');

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="flex flex-1 flex-col">
      <FloatingTopBar back={{ onClick: () => navigate(-1), label: t('common.back') }} />
      <div className="mx-auto w-full max-w-lg px-5 py-6">
        <TopBarSpacer />
        <h1 className="text-[22px] font-bold leading-[1.1] tracking-[-0.025em] text-foreground">{t('search.title')}</h1>

        <label className="glass mt-4 flex h-11 items-center gap-2.5 rounded-full px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-1" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label={t('search.title')}
            className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-foreground outline-none placeholder:text-muted-2"
          />
        </label>

        <div className="mt-10 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-wash text-brand-ink">
            <Search className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-3 max-w-[260px] text-[13px] font-medium leading-[1.5] text-muted-1">
            {t('search.comingSoon')}
          </p>
        </div>
      </div>
    </div>
  );
}
