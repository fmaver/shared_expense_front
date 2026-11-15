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
 * credencial se pega en la acción Text del primer paso.
 */
export function ShortcutGuide() {
  const { t } = useTranslation();
  // La dirección es la variable `servidor` del atajo, no la URL resuelta: se copia sólo el path.
  const api = '/api/v1/quick-capture';
  const hasInstall = Boolean(config.shortcutInstallUrl);

  return (
    <details className="group mt-3 border-t border-white/10 pt-3" open={!hasInstall}>
      <summary className="cursor-pointer list-none text-[12px] font-bold text-brand-soft underline underline-offset-2 [&::-webkit-details-marker]:hidden">
        {hasInstall ? t('shortcut.guide.titleAlt') : t('shortcut.guide.title')}
      </summary>
      <p className="mt-3 text-[11.5px] font-medium italic leading-[1.45] text-muted-on-dark">
        {t('shortcut.guide.intro')}
      </p>
      <ol className="mt-2 list-decimal space-y-3 pl-4 text-[11.5px] font-medium leading-[1.45] text-muted-on-dark">
        <Step title={t('shortcut.guide.s1')}>
          <p>{t('shortcut.guide.s1b')}</p>
        </Step>
        <Step title={t('shortcut.guide.s2')}>
          <p>{t('shortcut.guide.s2a')}</p>
          <CopyBlock label={t('shortcut.guide.separator')} value="|" />
        </Step>
        <Step title={t('shortcut.guide.s3')}>
          <p>{t('shortcut.guide.s3a')}</p>
          <p className="mt-1">{t('shortcut.guide.s3b')}</p>
          <p className="mt-1">{t('shortcut.guide.s3c')}</p>
        </Step>
        <Step title={t('shortcut.guide.s4')}>
          <p>{t('shortcut.guide.s4b')}</p>
        </Step>
        <Step title={t('shortcut.guide.s5')}>
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
        </Step>
        <Step title={t('shortcut.guide.s6')}>
          <p>{t('shortcut.guide.s6a')}</p>
          <p className="mt-1">{t('shortcut.guide.s6b')}</p>
        </Step>
        <Step title={t('shortcut.guide.s7')}>
          <p>{t('shortcut.guide.s7a')}</p>
          <p className="mt-1 italic">{t('shortcut.guide.s7b')}</p>
        </Step>
        <Step title={t('shortcut.guide.s8')}>
          <p>{t('shortcut.guide.s8a')}</p>
          <p className="mt-1">{t('shortcut.guide.s8b')}</p>
        </Step>
        <Step title={t('shortcut.guide.s9')}>
          <p>{t('shortcut.guide.s9a')}</p>
          <p className="mt-1">{t('shortcut.guide.s9b')}</p>
        </Step>
        <Step title={t('shortcut.guide.s10')}>
          <p>{t('shortcut.guide.s10a')}</p>
          <p className="mt-1">{t('shortcut.guide.s10b')}</p>
          <p className="mt-1">{t('shortcut.guide.s10c')}</p>
          <p className="mt-1">{t('shortcut.guide.s10d')}</p>
        </Step>
        <Step title={t('shortcut.guide.s11')}>
          <p>{t('shortcut.guide.s11a')}</p>
          <p className="mt-1.5 font-semibold text-paper">{t('shortcut.guide.confirm')}</p>
          <p className="mt-1">{t('shortcut.guide.confirmA')}</p>
          <CopyBlock label={t('shortcut.guide.urlPost')} value={`${api}/`} suffix="{borrador}/confirm" />
          <p className="mt-1.5">{t('shortcut.guide.confirmB')}</p>
          <CopyBlock label={t('shortcut.guide.jsonField')} value="groupId" />
          <p className="mt-1.5">{t('shortcut.guide.confirmC')}</p>
          <p className="mt-1.5 font-semibold text-paper">{t('shortcut.guide.keep')}</p>
          <CopyBlock label={t('shortcut.guide.urlPost')} value={`${api}/`} suffix="{borrador}/keep" />
          <p className="mt-1.5">{t('shortcut.guide.keepA')}</p>
          <p className="mt-1.5 font-semibold text-paper">{t('shortcut.guide.discard')}</p>
          <CopyBlock label={t('shortcut.guide.urlDelete')} value={`${api}/`} suffix="{borrador}" />
          <p className="mt-1.5">{t('shortcut.guide.discardA')}</p>
          <p className="mt-1.5">{t('shortcut.guide.draftIdNote')}</p>
          <p className="mt-1">{t('shortcut.guide.s11out')}</p>
        </Step>
        <Step title={t('shortcut.guide.s12')}>
          <p>{t('shortcut.guide.s12b')}</p>
        </Step>
      </ol>
      <p className="mt-3 text-[11.5px] font-medium leading-[1.45] text-muted-on-dark">
        <span className="font-semibold text-paper">{t('shortcut.guide.fail')}</span>
      </p>
      <ul className="mt-1 list-disc space-y-1 pl-4 text-[11.5px] font-medium leading-[1.45] text-muted-on-dark">
        <li>{t('shortcut.guide.f1')}</li>
        <li>{t('shortcut.guide.f2')}</li>
        <li>{t('shortcut.guide.f3')}</li>
        <li>{t('shortcut.guide.f4')}</li>
      </ul>
      <p className="mt-3 text-[11px] font-medium leading-[1.45] text-muted-on-dark">
        {t('shortcut.guide.mismatch')}
      </p>
    </details>
  );
}
