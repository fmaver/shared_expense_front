import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * El permiso de notificaciones, no un interruptor de avisos.
 *
 * La diferencia importa: en iPhone el push sólo existe con la app agregada a la pantalla de
 * inicio, y una vez que se niega el permiso no se puede volver a pedir desde la web. Por eso
 * los estados que no tienen arreglo desde acá no muestran botón — muestran por qué (§6.8).
 */
export function PushCard({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { status, isBusy, subscribe, unsubscribe } = usePushNotifications();

  const copy = {
    'available':      { title: t('profile.pushTitle'),       subtitle: t('profile.pushOnDevice') },
    'subscribed':     { title: t('profile.pushActiveTitle'), subtitle: t('profile.pushActiveSubtitle') },
    'needs-install':  { title: t('profile.pushTitle'),       subtitle: t('profile.pushInstallIOS') },
    'denied':         { title: t('profile.pushTitle'),       subtitle: t('profile.pushDenied') },
    'unsupported':    { title: t('profile.pushTitle'),       subtitle: t('profile.pushUnsupported') },
    'not-configured': { title: t('profile.pushTitle'),       subtitle: t('profile.pushNotConfigured') },
  }[status];

  return (
    <div className={cn('rounded-card bg-ink p-4', className)}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-1 flex h-2 w-2 shrink-0 rounded-full',
            status === 'subscribed' ? 'bg-positive-on-dark' : 'bg-brand-soft',
            (status === 'denied' || status === 'unsupported') && 'bg-muted-on-dark',
          )}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-paper">{copy.title}</p>
          <p className="mt-0.5 text-[11.5px] font-medium leading-[1.45] text-muted-on-dark">
            {copy.subtitle}
          </p>
        </div>

        {status === 'available' && (
          <button
            type="button"
            disabled={isBusy}
            onClick={subscribe}
            className="h-8 shrink-0 cursor-pointer rounded-pill bg-brand-soft px-3.5 text-[12px] font-bold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isBusy ? t('profile.pushWorking') : t('profile.pushEnable')}
          </button>
        )}

        {status === 'subscribed' && (
          <button
            type="button"
            disabled={isBusy}
            onClick={unsubscribe}
            className="h-8 shrink-0 cursor-pointer rounded-pill border border-paper/20 px-3.5 text-[12px] font-bold text-paper transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {isBusy ? t('profile.pushWorking') : t('profile.pushDisable')}
          </button>
        )}
      </div>

      {/* La cobertura va siempre: es lo que la gente quiere saber antes de decidir. */}
      <p className="mt-3 border-t border-white/10 pt-3 text-[11px] font-medium leading-[1.45] text-muted-on-dark-2">
        {t('profile.pushCoverage')}
      </p>
    </div>
  );
}
