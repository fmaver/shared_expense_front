import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config/env';
import { copyToClipboard } from '@/utils/clipboard';

const copyBtn =
  'h-7 shrink-0 cursor-pointer rounded-pill bg-brand-soft px-3 text-[11px] font-bold text-ink transition-opacity hover:opacity-90';

/** Un valor para tipear en Atajos: bloque con scroll propio y botón "Copiar". */
function CopyBlock({
  label,
  value,
  suffix,
}: {
  label?: string;
  value: string;
  suffix?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-1.5">
      {label && <p className="text-[10.5px] font-semibold text-muted-on-dark">{label}</p>}
      <div className="mt-0.5 flex items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre rounded-[10px] bg-white/10 px-2.5 py-1.5 font-mono text-[11px] text-paper">
          {value}
          {suffix && <span className="text-muted-on-dark">{suffix}</span>}
        </code>
        <button
          type="button"
          onClick={() =>
            copyToClipboard(value, t('shortcut.guide.copied'), t('shortcut.guide.copyFailed'))
          }
          className={copyBtn}
        >
          {t('shortcut.copy')}
        </button>
      </div>
    </div>
  );
}

function Step({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <li className="pl-1">
      <p className="font-semibold text-paper">{title}</p>
      {children}
    </li>
  );
}

/**
 * Cómo armar el atajo "Cargar gasto" en Atajos de iOS, paso a paso. Misma receta que
 * `docs/quick-capture-shortcut.md` (fuente de verdad). Nunca incluye el token real: la
 * credencial se pega en la pregunta de importación "Token".
 */
export function ShortcutGuide() {
  const { t } = useTranslation();
  const api = `${config.apiBaseUrl.replace(/\/+$/, '')}/api/v1/quick-capture`;
  const hasInstall = Boolean(config.shortcutInstallUrl);

  return (
    <details className="group mt-3 border-t border-white/10 pt-3" open={!hasInstall}>
      <summary className="cursor-pointer list-none text-[12px] font-bold text-brand-soft underline underline-offset-2 [&::-webkit-details-marker]:hidden">
        {hasInstall ? t('shortcut.guide.titleAlt') : t('shortcut.guide.title')}
      </summary>
      <ol className="mt-3 list-decimal space-y-3 pl-4 text-[11.5px] font-medium leading-[1.45] text-muted-on-dark">
        <Step title={t('shortcut.guide.s1')}>
          <p>{t('shortcut.guide.s1b')}</p>
        </Step>
        <Step title={t('shortcut.guide.s2')}>
          <p>{t('shortcut.guide.s2b')}</p>
        </Step>
        <Step title={t('shortcut.guide.s3')}>
          <p>{t('shortcut.guide.s3b')}</p>
        </Step>
        <Step title={t('shortcut.guide.s4')}>
          <CopyBlock label={t('shortcut.guide.url')} value={api} />
          <p className="mt-1.5">{t('shortcut.guide.method')}</p>
          <CopyBlock label={t('shortcut.guide.headerName')} value="Authorization" />
          <CopyBlock
            label={t('shortcut.guide.headerValue')}
            value="Bearer "
            suffix={t('shortcut.guide.yourToken')}
          />
          <p className="mt-1.5">{t('shortcut.guide.body')}</p>
          <CopyBlock label={t('shortcut.guide.field')} value="file" />
          <p className="mt-1.5">{t('shortcut.guide.response')}</p>
        </Step>
        <Step title={t('shortcut.guide.s5')}>
          <p>{t('shortcut.guide.s5b')}</p>
        </Step>
        <Step title={t('shortcut.guide.s6')}>
          <p>{t('shortcut.guide.s6a')}</p>
          <p className="mt-1">{t('shortcut.guide.s6b')}</p>
          <p className="mt-1">{t('shortcut.guide.s6c')}</p>
          <p className="mt-1 italic">{t('shortcut.guide.s6note')}</p>
        </Step>
        <Step title={t('shortcut.guide.s7')}>
          <p>{t('shortcut.guide.s7intro')}</p>
          <p className="mt-1.5 font-semibold text-paper">{t('shortcut.guide.confirm')}</p>
          <CopyBlock label="POST" value={`${api}/{draftId}/confirm`} />
          <CopyBlock label={t('shortcut.guide.jsonBody')} value={'{"groupId": grupo}'} />
          <p className="mt-1.5 font-semibold text-paper">{t('shortcut.guide.keep')}</p>
          <CopyBlock label="POST" value={`${api}/{draftId}/keep`} />
          <p className="mt-1.5 font-semibold text-paper">{t('shortcut.guide.discard')}</p>
          <CopyBlock label="DELETE" value={`${api}/{draftId}`} />
          <p className="mt-1.5">{t('shortcut.guide.s7outro')}</p>
        </Step>
        <Step title={t('shortcut.guide.s8')}>
          <p>{t('shortcut.guide.s8b')}</p>
        </Step>
        <Step title={t('shortcut.guide.s9')}>
          <p>{t('shortcut.guide.s9b')}</p>
        </Step>
      </ol>
      <p className="mt-3 text-[11px] font-medium leading-[1.45] text-muted-on-dark">
        {t('shortcut.guide.mismatch')}
      </p>
    </details>
  );
}
