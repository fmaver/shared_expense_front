import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Bell, Check, Copy, Download, MoreVertical, PlusSquare, Share } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { JirensMark } from '@/components/brand/JirensMark';
import {
  canPromptInstall,
  dismissInstallGuide,
  promptInstall,
  shouldShowInstallGuide,
  type InstallPlatform,
} from '@/utils/installGuide';

type Step = { icon: ComponentType<{ className?: string }>; title: string; hint: string };

/**
 * Guía para instalar la app como PWA, en el navegador del celular.
 *
 * Una hoja desde abajo (la app queda borrosa detrás) que aparece una vez por visita, con los
 * pasos del sistema: en iPhone, Compartir → "Agregar a inicio"; en Android, el botón nativo de
 * Chrome si lo ofreció, y si no el menú ⋮. Cerrarla la pospone; "Ya la tengo instalada" la
 * apaga. Las reglas de cuándo se muestra están en `utils/installGuide.ts`.
 */
export function InstallAppSheet() {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const decided = shouldShowInstallGuide();
    if (!decided) return;
    // Un respiro después de entrar: que primero se vea la app, después la guía.
    const timer = setTimeout(() => { setPlatform(decided); setOpen(true); }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!platform) return null;

  const close = (forever: boolean) => {
    dismissInstallGuide(forever);
    setOpen(false);
  };

  const nativeInstall = platform === 'android' && canPromptInstall();

  const steps: Step[] = platform === 'ios'
    ? [
        { icon: Share, title: t('installGuide.ios.step1'), hint: t('installGuide.ios.step1Hint') },
        { icon: PlusSquare, title: t('installGuide.ios.step2'), hint: t('installGuide.ios.step2Hint') },
        { icon: Check, title: t('installGuide.ios.step3'), hint: t('installGuide.ios.step3Hint') },
      ]
    : platform === 'android'
      ? [
          { icon: MoreVertical, title: t('installGuide.android.step1'), hint: t('installGuide.android.step1Hint') },
          { icon: Download, title: t('installGuide.android.step2'), hint: t('installGuide.android.step2Hint') },
          { icon: Check, title: t('installGuide.android.step3'), hint: t('installGuide.android.step3Hint') },
        ]
      : [];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success(t('installGuide.inapp.copied'));
    } catch {
      toast.error(t('installGuide.inapp.copyFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={next => { if (!next) close(false); }}>
      <DialogContent showCloseButton={false} className="lg:max-w-sm">
        <div className="flex flex-col items-center pt-1 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-ink">
            <JirensMark tone="night" className="text-white" size={34} />
          </span>
          <DialogTitle className="mt-3 text-[20px] font-bold leading-[1.2] tracking-[-0.025em] text-foreground">
            {platform === 'inapp' ? t('installGuide.inapp.title') : t('installGuide.title')}
          </DialogTitle>
          <p className="mt-1.5 max-w-[30ch] text-[13px] font-medium leading-[1.45] text-muted-1">
            {platform === 'inapp' ? t('installGuide.inapp.subtitle') : t('installGuide.subtitle')}
          </p>
        </div>

        {platform === 'inapp' ? (
          <button
            type="button"
            onClick={copyLink}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-brand text-[13.5px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            {t('installGuide.inapp.copy')}
          </button>
        ) : nativeInstall ? (
          <button
            type="button"
            onClick={async () => { if (await promptInstall()) close(true); }}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-brand text-[13.5px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {t('installGuide.android.installNow')}
          </button>
        ) : (
          <ol className="rounded-card border border-line bg-surface-sunken">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-line px-3.5 py-3 last:border-b-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[11.5px] font-bold text-primary-foreground tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold leading-tight text-foreground">{step.title}</span>
                  <span className="mt-0.5 block text-[11.5px] font-medium leading-snug text-muted-1">{step.hint}</span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface text-brand-ink">
                  <step.icon className="h-[18px] w-[18px]" />
                </span>
              </li>
            ))}
          </ol>
        )}

        {platform !== 'inapp' && (
          <p className="flex items-start gap-2 rounded-[12px] bg-brand-wash px-3 py-2.5 text-[11.5px] font-medium leading-[1.45] text-brand-ink">
            <Bell className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('installGuide.afterInstall')}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pb-[env(safe-area-inset-bottom,0px)]">
          <button
            type="button"
            onClick={() => close(false)}
            className="h-11 cursor-pointer rounded-[12px] px-3 text-[13px] font-bold text-muted-1 hover:bg-surface-sunken"
          >
            {t('installGuide.later')}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className="h-11 cursor-pointer rounded-[12px] border border-line-strong px-4 text-[13px] font-bold text-foreground hover:bg-surface-sunken"
          >
            {t('installGuide.alreadyInstalled')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
