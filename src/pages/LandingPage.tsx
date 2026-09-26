import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Camera, CheckCircle, MessageSquare, Scale, Users } from 'lucide-react';
import { JirensMark } from '@/components/brand/JirensMark';

/**
 * La pública de marketing.
 *
 * Mismo contenido que antes — las cuatro features, los tres pasos y sus textos son los que ya
 * estaban en i18n —, con el material del ingreso: tinta arriba, tipografía de display en los
 * títulos y papel para lo que se lee. No es un rediseño, es la misma página con la piel nueva.
 */
export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const FEATURES = [
    { icon: MessageSquare, title: t('landing.features.whatsapp.title'), desc: t('landing.features.whatsapp.desc') },
    { icon: Scale,         title: t('landing.features.settle.title'),   desc: t('landing.features.settle.desc') },
    { icon: Camera,        title: t('landing.features.receipt.title'),  desc: t('landing.features.receipt.desc') },
    { icon: Users,         title: t('landing.features.groups.title'),   desc: t('landing.features.groups.desc') },
  ];

  const STEPS = [
    { n: '01', title: t('landing.howItWorks.step1.title'), desc: t('landing.howItWorks.step1.desc') },
    { n: '02', title: t('landing.howItWorks.step2.title'), desc: t('landing.howItWorks.step2.desc') },
    { n: '03', title: t('landing.howItWorks.step3.title'), desc: t('landing.howItWorks.step3.desc') },
  ];

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-background">
      {/* ── Barra ───────────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-ink">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-7">
          <div className="flex items-center gap-2.5">
            <JirensMark tone="night" className="text-white" size={28} />
            <span className="text-[19px] font-extrabold leading-none tracking-[-0.025em] text-paper">Jirens</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollTo('features')}
              className="hidden h-9 cursor-pointer rounded-pill px-3 text-[12.5px] font-semibold text-muted-on-dark transition-colors hover:bg-white/10 hover:text-paper sm:inline-flex sm:items-center"
            >
              {t('landing.nav.features')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex h-9 cursor-pointer items-center rounded-pill px-3 text-[12.5px] font-semibold text-muted-on-dark transition-colors hover:bg-white/10 hover:text-paper"
            >
              {t('landing.nav.signIn')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex h-9 cursor-pointer items-center rounded-pill bg-brand px-4 text-[12.5px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t('landing.nav.getStarted')}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────────────── */}
      <section className="bg-ink px-5 pb-24 pt-16 lg:px-7">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-pill border border-brand-soft/30 bg-brand/15 px-3.5 py-1.5 text-[12px] font-semibold text-brand-soft">
            {t('landing.hero.badge')}
          </span>

          <h1 className="mt-8 text-[36px] font-bold leading-[1.1] tracking-[-0.025em] text-paper sm:text-[46px]">
            {t('landing.hero.headline1')}{' '}
            <span className="text-brand-soft">{t('landing.hero.headline2')}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-[16px] font-medium leading-[1.55] text-muted-on-dark">
            {t('landing.hero.subheadline')}
          </p>

          <div className="mt-9 flex flex-col justify-center gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-brand px-7 text-[14px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t('landing.hero.cta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollTo('how-it-works')}
              className="flex h-12 cursor-pointer items-center justify-center rounded-[12px] border border-paper/20 px-7 text-[14px] font-bold text-paper transition-colors hover:bg-white/10"
            >
              {t('landing.hero.learnMore')}
            </button>
          </div>
        </div>
      </section>

      {/* ── Qué hace ────────────────────────────────────────────────────────────────── */}
      <section id="features" className="px-5 py-20 lg:px-7">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-[26px] font-bold leading-none tracking-[-0.025em] text-foreground">
            {t('landing.features.title')}
          </h2>
          <p className="mt-3 text-center text-[14px] font-medium text-muted-1">
            {t('landing.features.subtitle')}
          </p>

          <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-card border border-line bg-surface p-5 shadow-card">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px] bg-brand-wash">
                  <Icon className="h-5 w-5 text-brand-ink" aria-hidden="true" />
                </span>
                <h3 className="text-[13.5px] font-bold text-foreground">{title}</h3>
                <p className="mt-1.5 text-[12.5px] font-medium leading-[1.5] text-muted-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-surface-sunken px-5 py-20 lg:px-7">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-[26px] font-bold leading-none tracking-[-0.025em] text-foreground">
            {t('landing.howItWorks.title')}
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <p className="text-[40px] font-extrabold leading-none tracking-[-0.025em] tabular-nums text-brand-soft">{n}</p>
                <h3 className="mt-3 text-[13.5px] font-bold text-foreground">{title}</h3>
                <p className="mt-1.5 text-[12.5px] font-medium leading-[1.5] text-muted-1">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-brand px-7 text-[14px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t('landing.howItWorks.cta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Pie ─────────────────────────────────────────────────────────────────────── */}
      <footer className="bg-ink px-5 py-10 lg:px-7">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <JirensMark tone="night" className="text-white" size={26} />
            <span className="text-[17px] font-extrabold leading-none tracking-[-0.025em] text-paper">Jirens</span>
          </div>
          <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-on-dark">
            <CheckCircle className="h-3.5 w-3.5 text-positive-on-dark" aria-hidden="true" />
            {t('landing.footer.freeToUse')}
          </p>
        </div>
      </footer>
    </div>
  );
}
