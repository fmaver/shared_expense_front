import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { config } from '@/config/env';
import { relativeAge } from '@/utils/format';
import { getShortcutToken, issueShortcutToken, revokeShortcutToken } from '@/api/shortcutToken';
import { copyToClipboard } from '@/utils/clipboard';
import type { ShortcutTokenStatus } from '@/types/expense';

const primaryBtn =
  'h-8 shrink-0 cursor-pointer rounded-pill bg-brand-soft px-3.5 text-[12px] font-bold text-ink transition-opacity hover:opacity-90 disabled:opacity-50';
const ghostBtn =
  'h-8 shrink-0 cursor-pointer rounded-pill border border-paper/20 px-3.5 text-[12px] font-bold text-paper transition-colors hover:bg-white/10 disabled:opacity-50';

/**
 * La credencial del atajo de iOS ("Cargar gasto"): cada persona genera la suya.
 *
 * El token completo sólo existe en el estado de este componente, en el momento de generarlo:
 * el servidor guarda únicamente el hash, así que no hay forma de volver a mostrarlo. Nunca va
 * a localStorage ni a ningún otro lado.
 */
export function ShortcutCard({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<ShortcutTokenStatus | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [confirmingRegen, setConfirmingRegen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await getShortcutToken());
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const issue = async () => {
    setIsBusy(true);
    try {
      const issued = await issueShortcutToken();
      setIssuedToken(issued.token);
      setConfirmingRegen(false);
      setStatus({ connected: true, prefix: issued.prefix, createdAt: issued.createdAt, lastUsedAt: null });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('shortcut.issueFailed'));
    } finally {
      setIsBusy(false);
    }
  };

  const revoke = async () => {
    setIsBusy(true);
    try {
      await revokeShortcutToken();
      setIssuedToken(null);
      setConfirmingRegen(false);
      setStatus({ connected: false, prefix: null, createdAt: null, lastUsedAt: null });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('shortcut.revokeFailed'));
    } finally {
      setIsBusy(false);
    }
  };

  // Código de conexión: `<URL del API>|<token>`. Un solo atajo publicado sirve para cualquier
  // entorno porque la dirección viaja con la credencial. El atajo sigue mandando sólo el token.
  const connectionCode = issuedToken
    ? `${config.apiBaseUrl.replace(/\/+$/, '')}|${issuedToken}`
    : null;

  const copy = () => {
    if (!connectionCode) return;
    // Sin permiso o sin contexto seguro: el código sigue visible y seleccionable.
    void copyToClipboard(connectionCode, t('shortcut.copied'), t('shortcut.copyFailed'));
  };

  const connected = status?.connected ?? false;
  const subtitle = !status
    ? loadFailed
      ? t('shortcut.loadFailed')
      : t('shortcut.loading')
    : connected
      ? status.lastUsedAt
        ? t('shortcut.lastUsed', { when: relativeAge(status.lastUsedAt, i18n.language) })
        : t('shortcut.neverUsed')
      : t('shortcut.subtitle');

  return (
    <div className={cn('rounded-card bg-ink p-4', className)}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-1 flex h-2 w-2 shrink-0 rounded-full',
            connected ? 'bg-positive-on-dark' : 'bg-brand-soft',
          )}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-paper">
            {connected ? t('shortcut.connectedTitle') : t('shortcut.title')}
          </p>
          <p className="mt-0.5 text-[11.5px] font-medium leading-[1.45] text-muted-on-dark">{subtitle}</p>
        </div>

        {status && !connected && (
          <button type="button" disabled={isBusy} onClick={issue} className={primaryBtn}>
            {isBusy ? t('shortcut.working') : t('shortcut.connect')}
          </button>
        )}
        {!status && loadFailed && (
          <button type="button" onClick={load} className={ghostBtn}>
            {t('shortcut.retry')}
          </button>
        )}
      </div>

      {issuedToken && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[11.5px] font-semibold text-paper">{t('shortcut.tokenOnce')}</p>
          <p className="mt-1 text-[10.5px] font-semibold text-muted-on-dark">{t('shortcut.codeLabel')}</p>
          <div className="mt-1 flex items-center gap-2">
            <code
              data-testid="shortcut-token"
              className="min-w-0 flex-1 select-all break-all rounded-[10px] bg-white/10 px-3 py-2 font-mono text-[11.5px] text-paper"
            >
              {connectionCode}
            </code>
            <button type="button" onClick={copy} className={primaryBtn}>
              {t('shortcut.copy')}
            </button>
          </div>
          {config.shortcutInstallUrl ? (
            <>
              <InstallLink />
              <ol className="mt-3 list-decimal space-y-1 pl-4 text-[11.5px] font-medium leading-[1.45] text-muted-on-dark">
                <li>{t('shortcut.stepInstall')}</li>
                <li>{t('shortcut.stepPaste')}</li>
                <li>{t('shortcut.stepBackTap')}</li>
              </ol>
            </>
          ) : (
            <p className="mt-3 text-[11.5px] font-medium leading-[1.45] text-muted-on-dark">
              {t('shortcut.notPublished')}
            </p>
          )}
          <p className="mt-2 text-[11.5px] font-medium leading-[1.45] text-muted-on-dark">
            {t('shortcut.step3')}
          </p>
        </div>
      )}

      {connected && !issuedToken && (
        <>
          {config.shortcutInstallUrl && <InstallLink />}
          <p className="mt-3 text-[11.5px] font-medium leading-[1.45] text-muted-on-dark">
            {t('shortcut.lostToken')}
          </p>
        </>
      )}

      {connected && (
        <div className="mt-3 border-t border-white/10 pt-3">
          {confirmingRegen ? (
            <div>
              <p className="text-[11.5px] font-medium leading-[1.45] text-muted-on-dark">
                {t('shortcut.regenWarning')}
              </p>
              <div className="mt-2 flex gap-2">
                <button type="button" disabled={isBusy} onClick={issue} className={primaryBtn}>
                  {isBusy ? t('shortcut.working') : t('shortcut.regenConfirm')}
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setConfirmingRegen(false)}
                  className={ghostBtn}
                >
                  {t('shortcut.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setConfirmingRegen(true)}
                className={ghostBtn}
              >
                {t('shortcut.regen')}
              </button>
              <button type="button" disabled={isBusy} onClick={revoke} className={ghostBtn}>
                {t('shortcut.disconnect')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** El atajo publicado (link de iCloud): se instala ya armado y pide el código al instalarse. */
function InstallLink() {
  const { t } = useTranslation();
  return (
    <a
      href={config.shortcutInstallUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-block text-[12px] font-bold text-brand-soft underline underline-offset-2"
    >
      {t('shortcut.install')}
    </a>
  );
}
