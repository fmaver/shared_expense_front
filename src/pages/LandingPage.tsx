import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MessageSquare, Scale, Camera, Users, ArrowRight, CheckCircle } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-white dark:bg-background font-sans">
      {/* Navbar */}
      <nav className="bg-sidebar sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center text-white font-black text-sm">✦</div>
            <span className="text-white font-extrabold text-lg tracking-tight">Jirens</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 text-sm hidden sm:inline-flex"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('landing.nav.features')}
            </Button>
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 text-sm"
              onClick={() => navigate('/login')}>{t('landing.nav.signIn')}</Button>
            <Button className="bg-brand hover:bg-brand/90 text-white text-sm font-semibold"
              onClick={() => navigate('/login')}>{t('landing.nav.getStarted')}</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-sidebar text-white pt-20 pb-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand/20 text-brand border border-brand/30 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <span>✦</span><span>{t('landing.hero.badge')}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
            {t('landing.hero.headline1')}{' '}
            <span className="text-brand">{t('landing.hero.headline2')}</span>
          </h1>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            {t('landing.hero.subheadline')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-brand hover:bg-brand/90 text-white font-semibold px-8"
              onClick={() => navigate('/login')}>
              {t('landing.hero.cta')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 font-semibold px-8"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('landing.hero.learnMore')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-3 tracking-tight">{t('landing.features.title')}</h2>
          <p className="text-muted-foreground text-center mb-12">{t('landing.features.subtitle')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-5 hover:border-brand/40 transition-colors">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-12 tracking-tight">{t('landing.howItWorks.title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="text-4xl font-black text-brand/30 mb-3">{n}</div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button size="lg" className="bg-brand hover:bg-brand/90 text-white font-semibold px-8"
              onClick={() => navigate('/login')}>
              {t('landing.howItWorks.cta')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-white/40 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand rounded-md flex items-center justify-center text-white font-black text-xs">✦</div>
            <div>
              <div className="text-white font-bold text-sm">Jirens</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40">Shared Expenses</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <CheckCircle className="h-3 w-3 text-settle" /><span>{t('landing.footer.freeToUse')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
