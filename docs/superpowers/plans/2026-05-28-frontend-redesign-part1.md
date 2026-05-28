# Jirens Frontend Redesign — Implementation Plan (Part 1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Continue with:** `docs/superpowers/plans/2026-05-28-frontend-redesign-part2.md` after all tasks here pass.

**Goal:** Install dependencies, configure Tailwind + shadcn/ui theming, and build the app shell (Sidebar, TopBar, AppShell), landing page, login page, group selector, MonthPicker, and BalancePanel — without touching `App.tsx` or breaking the existing MUI-based app.

**Architecture:** New components are built alongside the old ones. MUI stays installed throughout Part 1. `App.tsx` routing is updated in Part 2 Task 23 as a single cutover; MUI is removed in Part 2 Task 24.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS 3 (`darkMode: class`), shadcn/ui, Inter (Google Fonts), lucide-react, react-router-dom 7, axios.

**Spec:** `docs/superpowers/specs/2026-05-27-frontend-redesign-design.md`

---

## Files created in Part 1

```
index.html                                    modified
vite.config.ts                                modified
tsconfig.app.json                             modified
tailwind.config.js                            replaced
src/index.css                                 replaced
src/main.tsx                                  modified (add Toaster)
components.json                               created by shadcn init
src/lib/utils.ts                              new
src/hooks/useTheme.ts                         new
src/hooks/useIsMobile.ts                      new
src/components/ui/                            new — all shadcn components
src/components/layout/Sidebar.tsx             new
src/components/layout/TopBar.tsx              new
src/components/layout/AppShell.tsx            new
src/components/groups/CreateGroupDialog.tsx   new
src/pages/LandingPage.tsx                     new
src/pages/LoginPage.tsx                       new
src/pages/GroupSelectorPage.tsx               new
src/components/expenses/MonthPicker.tsx       new
src/components/expenses/BalancePanel.tsx      new
```

---

### Task 1: Install new dependencies and configure build tooling

**Files:** `package.json`, `vite.config.ts`, `tsconfig.app.json`, `index.html`

- [ ] **Step 1: Install new packages**

```bash
cd /Users/franciscomaver/Documents/shared_expenses/shared_expense_front
npm install class-variance-authority clsx tailwind-merge sonner
npm install -D @types/node tailwindcss-animate
```

Expected: `added N packages` with no errors.

- [ ] **Step 2: Replace `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ['lucide-react'] },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 3: Add path alias to `tsconfig.app.json`**

Inside `compilerOptions`, add:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 4: Replace `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Jirens — Shared Expenses</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Verify**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add index.html vite.config.ts tsconfig.app.json package.json package-lock.json
git commit -m "feat: configure build tooling — @ alias, Inter font, new deps"
```

---

### Task 2: Initialize shadcn/ui and add all UI components

**Files:** `components.json`, `src/components/ui/`

- [ ] **Step 1: Run shadcn init**

```bash
npx shadcn@latest init
```

When prompted:
- Style → **Default**
- Base color → **Neutral**
- CSS variables → **Yes**

- [ ] **Step 2: Add all required components**

```bash
npx shadcn@latest add button input label dialog sheet dropdown-menu select badge skeleton separator sonner
```

- [ ] **Step 3: Verify files exist**

```bash
ls src/components/ui/
```

Expected: `button.tsx dialog.tsx dropdown-menu.tsx input.tsx label.tsx badge.tsx select.tsx separator.tsx sheet.tsx skeleton.tsx sonner.tsx` (plus any auto-generated peers).

- [ ] **Step 4: Verify**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add components.json src/components/ui/ package.json package-lock.json
git commit -m "feat: add shadcn/ui components"
```

---

### Task 3: Configure Tailwind brand tokens, dark mode, and CSS variables

**Files:** `tailwind.config.js`, `src/index.css`

- [ ] **Step 1: Replace `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand:   '#CCBBDD',
        crimson: '#EE3333',
        charcoal:'#777777',
        sidebar: '#1E1B2E',
        settle:  'hsl(var(--settle))',
        border:  'hsl(var(--border))',
        input:   'hsl(var(--input))',
        ring:    'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover:     { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

- [ ] **Step 2: Replace `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 96%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 270 33% 80%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 93%;
    --secondary-foreground: 222 47% 11%;
    --muted: 0 0% 93%;
    --muted-foreground: 0 0% 47%;
    --accent: 270 33% 93%;
    --accent-foreground: 270 30% 30%;
    --destructive: 0 84% 57%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 90%;
    --input: 0 0% 90%;
    --ring: 270 33% 70%;
    --radius: 0.5rem;
    --settle: 122 39% 49%;
  }
  .dark {
    --background: 222 47% 11%;
    --foreground: 0 0% 98%;
    --card: 215 28% 17%;
    --card-foreground: 0 0% 98%;
    --popover: 215 28% 17%;
    --popover-foreground: 0 0% 98%;
    --primary: 270 33% 80%;
    --primary-foreground: 270 30% 15%;
    --secondary: 215 28% 22%;
    --secondary-foreground: 0 0% 98%;
    --muted: 215 28% 22%;
    --muted-foreground: 0 0% 60%;
    --accent: 270 20% 25%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84% 57%;
    --destructive-foreground: 0 0% 100%;
    --border: 215 28% 25%;
    --input: 215 28% 25%;
    --ring: 270 33% 70%;
    --settle: 122 39% 49%;
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js src/index.css
git commit -m "feat: Tailwind brand tokens, dark mode, shadcn CSS variables"
```

---

### Task 4: `lib/utils.ts`, `useTheme`, `useIsMobile`

**Files:** `src/lib/utils.ts`, `src/hooks/useTheme.ts`, `src/hooks/useIsMobile.ts`

- [ ] **Step 1: Create `src/lib/utils.ts`**

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create `src/hooks/useTheme.ts`**

```ts
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  return { theme, toggle };
}
```

- [ ] **Step 3: Create `src/hooks/useIsMobile.ts`**

```ts
import { useEffect, useState } from 'react';

export function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}
```

- [ ] **Step 4: Verify**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils.ts src/hooks/useTheme.ts src/hooks/useIsMobile.ts
git commit -m "feat: utils, useTheme, useIsMobile"
```

---

### Task 5: Landing page

**Files:** `src/pages/LandingPage.tsx`

- [ ] **Step 1: Create `src/pages/LandingPage.tsx`**

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Scale, Camera, Users, ArrowRight, CheckCircle } from 'lucide-react';

const FEATURES = [
  { icon: MessageSquare, title: 'WhatsApp bot',    desc: 'Add expenses by chat — type "gasté 500 en comida" and it\'s logged.' },
  { icon: Scale,         title: 'Monthly settle',  desc: 'One-click balance settlement at end of month.' },
  { icon: Camera,        title: 'Receipt scan',    desc: 'Send a receipt photo via WhatsApp. AI extracts amount and category.' },
  { icon: Users,         title: 'Multiple groups', desc: 'Home, trips, friends — each group has its own members and history.' },
];

const STEPS = [
  { n: '01', title: 'Add an expense',         desc: 'Via the web app or a WhatsApp message.' },
  { n: '02', title: 'Splits are calculated',  desc: 'Equal, by percentage, or exact amounts per person.' },
  { n: '03', title: 'Settle at month end',    desc: 'One click balances everyone with minimum transfers.' },
];

export function LandingPage() {
  const navigate = useNavigate();

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
              Features
            </Button>
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 text-sm"
              onClick={() => navigate('/login')}>Sign in</Button>
            <Button className="bg-brand hover:bg-brand/90 text-white text-sm font-semibold"
              onClick={() => navigate('/login')}>Get started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-sidebar text-white pt-20 pb-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand/20 text-brand border border-brand/30 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <span>✦</span><span>Now with WhatsApp AI</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
            Shared expenses,{' '}
            <span className="text-brand">finally simple.</span>
          </h1>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            Track, split, and settle costs with your group — from the web or straight from WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-brand hover:bg-brand/90 text-white font-semibold px-8"
              onClick={() => navigate('/login')}>
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline"
              className="border-white/20 text-white hover:bg-white/10 font-semibold px-8"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn more
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-3 tracking-tight">Everything your group needs</h2>
          <p className="text-muted-foreground text-center mb-12">Built for couples, roommates, and friends who share costs.</p>
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
          <h2 className="text-2xl font-bold text-center text-foreground mb-12 tracking-tight">How it works</h2>
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
              Start splitting smarter <ArrowRight className="ml-2 h-4 w-4" />
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
            <CheckCircle className="h-3 w-3 text-settle" /><span>Free to use</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: landing page"
```

---

### Task 6: Login / Register page

**Files:** `src/pages/LoginPage.tsx`, `src/main.tsx`

- [ ] **Step 1: Create `src/pages/LoginPage.tsx`**

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Eye, EyeOff, Phone } from 'lucide-react';
import axios from 'axios';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setName(''); setTelephone(''); setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setIsLoading(true);
    try {
      const res = await login({ username: email, password });
      const expiration = new Date(Date.now() + 30 * 60_000).toISOString();
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('tokenExpiration', expiration);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.access_token}`;
      onLoginSuccess(res.access_token);
      navigate('/groups');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError(''); setIsLoading(true);
    try {
      await register({ name, email, password, telephone: telephone.trim() || undefined });
      const res = await login({ username: email, password });
      const expiration = new Date(Date.now() + 30 * 60_000).toISOString();
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('tokenExpiration', expiration);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.access_token}`;
      onLoginSuccess(res.access_token);
      navigate('/groups');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand rounded-xl mb-3">
            <span className="text-white font-black text-xl">✦</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Jirens</h1>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mt-0.5">
            Shared Expenses
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {/* Google mock */}
          <Button type="button" variant="outline" className="w-full mb-4 font-medium"
            onClick={() => toast.info('Google login coming soon 🚀')}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          {error && (
            <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required autoComplete="email" autoFocus
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} required
                    autoComplete="current-password" value={password}
                    onChange={e => setPassword(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-brand hover:bg-brand/90 text-white font-semibold" disabled={isLoading}>
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <button type="button" onClick={() => { reset(); setMode('register'); }}
                  className="text-primary font-medium hover:underline">Create one</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required autoComplete="name" autoFocus
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> WhatsApp phone
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="phone" type="tel" placeholder="e.g. 541138718498"
                  value={telephone} onChange={e => setTelephone(e.target.value)} />
                <p className="text-xs text-muted-foreground">Include country code, no + sign.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Input id="reg-password" type={showPassword ? 'text' : 'password'} required
                    autoComplete="new-password" minLength={6}
                    value={password} onChange={e => setPassword(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type={showPassword ? 'text' : 'password'} required
                  autoComplete="new-password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full bg-brand hover:bg-brand/90 text-white font-semibold" disabled={isLoading}>
                {isLoading ? 'Creating account…' : 'Create account'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <button type="button" onClick={() => { reset(); setMode('login'); }}
                  className="text-primary font-medium hover:underline">Sign in</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `src/main.tsx` — add Sonner Toaster**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  </React.StrictMode>,
);
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/LoginPage.tsx src/main.tsx
git commit -m "feat: login/register page with Google mock and Sonner toasts"
```

---

### Task 7: Sidebar component

**Files:** `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create `src/components/layout/Sidebar.tsx`**

```tsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useGroups } from '@/hooks/useGroups';
import { useTheme } from '@/hooks/useTheme';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Moon, Sun, Plus, LogOut } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  onNavigate?: () => void;
}

function getInitials(token: string | null): { initials: string; name: string } {
  try {
    if (!token) return { initials: '?', name: '' };
    const payload = JSON.parse(atob(token.split('.')[1]));
    const n = (payload.name ?? payload.sub ?? '') as string;
    const initials = n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    return { initials, name: n };
  } catch {
    return { initials: '?', name: '' };
  }
}

export function Sidebar({ onLogout, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { data: groups = [] } = useGroups();
  const { theme, toggle } = useTheme();
  const { initials, name } = getInitials(localStorage.getItem('token'));

  const go = (to: string) => { navigate(to); onNavigate?.(); };

  return (
    <div className="flex flex-col h-full bg-card dark:bg-sidebar border-r border-border">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4">
        <button onClick={() => go('/groups')} className="flex items-center gap-2.5 w-full text-left">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-black text-base flex-shrink-0">✦</div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-foreground leading-none">Jirens</div>
            <div className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground mt-0.5">Shared Expenses</div>
          </div>
        </button>
      </div>

      <Separator />

      {/* Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-2">Groups</p>
        <nav className="space-y-0.5">
          {groups.map(group => (
            <NavLink key={group.id} to={`/groups/${group.id}`} onClick={onNavigate}
              className={({ isActive }) => cn(
                'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-foreground font-semibold border-l-2 border-brand'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}>
              <span className="truncate">{group.name}</span>
            </NavLink>
          ))}
        </nav>
        <button onClick={() => go('/groups')}
          className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-primary hover:bg-accent w-full mt-1">
          <Plus className="h-3.5 w-3.5" /> New group
        </button>
      </div>

      <Separator />

      {/* Footer */}
      <div className="px-3 py-3 flex items-center justify-between gap-2">
        <button onClick={() => go('/profile')}
          className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 bg-brand rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <span className="text-sm text-muted-foreground truncate">{name || 'Profile'}</span>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onLogout} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: Sidebar component"
```

---

### Task 8: TopBar (mobile) and AppShell

**Files:** `src/components/layout/TopBar.tsx`, `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Create `src/components/layout/TopBar.tsx`**

```tsx
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';
import { useTheme } from '@/hooks/useTheme';
import { Menu, Moon, Sun } from 'lucide-react';

interface TopBarProps {
  onLogout: () => void;
}

export function TopBar({ onLogout }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <header className="lg:hidden h-12 bg-card dark:bg-sidebar border-b border-border flex items-center justify-between px-3 flex-shrink-0">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onLogout={onLogout} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-brand rounded-md flex items-center justify-center text-white font-black text-xs">✦</div>
        <span className="font-extrabold text-sm tracking-tight text-foreground">Jirens</span>
      </div>

      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={toggle} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </header>
  );
}
```

- [ ] **Step 2: Create `src/components/layout/AppShell.tsx`**

```tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  onLogout: () => void;
}

export function AppShell({ onLogout }: AppShellProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0 lg:w-56">
        <Sidebar onLogout={onLogout} />
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <TopBar onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/TopBar.tsx src/components/layout/AppShell.tsx
git commit -m "feat: TopBar (mobile) and AppShell layout"
```

---

### Task 9: GroupSelectorPage and CreateGroupDialog

**Files:** `src/pages/GroupSelectorPage.tsx`, `src/components/groups/CreateGroupDialog.tsx`

- [ ] **Step 1: Create `src/components/groups/CreateGroupDialog.tsx`**

Read `src/api/groups.ts` first to confirm the `createGroup` function signature. It should return `Promise<{ data?: Group; error?: string }>`. Use it as follows:

```tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createGroup } from '@/api/groups';
import type { Group } from '@/types/expense';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (group: Group) => void;
}

export function CreateGroupDialog({ open, onOpenChange, onCreated }: CreateGroupDialogProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true); setError('');
    try {
      const result = await createGroup({ name: name.trim() });
      if (result.data) {
        setName('');
        onCreated(result.data);
        onOpenChange(false);
      } else {
        throw new Error(result.error ?? 'Failed to create group');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>New group</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="groupName">Group name</Label>
            <Input id="groupName" required autoFocus placeholder="e.g. Casa, Viaje 2026"
              value={name} onChange={e => setName(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-brand hover:bg-brand/90 text-white" disabled={isLoading}>
              {isLoading ? 'Creating…' : 'Create group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create `src/pages/GroupSelectorPage.tsx`**

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroups } from '@/hooks/useGroups';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Plus, Users } from 'lucide-react';
import type { Group } from '@/types/expense';

export function GroupSelectorPage() {
  const navigate = useNavigate();
  const { data: groups = [], isLoading, error } = useGroups();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Your groups</h1>
        <Button size="sm" className="bg-brand hover:bg-brand/90 text-white" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New group
        </Button>
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">You don't belong to any group yet.</p>
          <Button className="bg-brand hover:bg-brand/90 text-white" onClick={() => setShowCreate(true)}>
            Create your first group
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map(group => (
            <button key={group.id} onClick={() => navigate(`/groups/${group.id}`)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3.5 flex items-center justify-between hover:border-brand/40 hover:bg-accent/50 transition-colors text-left">
              <div>
                <p className="font-semibold text-foreground text-sm">{group.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      <CreateGroupDialog open={showCreate} onOpenChange={setShowCreate}
        onCreated={(g: Group) => navigate(`/groups/${g.id}`)} />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/GroupSelectorPage.tsx src/components/groups/CreateGroupDialog.tsx
git commit -m "feat: GroupSelectorPage and CreateGroupDialog"
```

---

### Task 10: MonthPicker and BalancePanel

**Files:** `src/components/expenses/MonthPicker.tsx`, `src/components/expenses/BalancePanel.tsx`

- [ ] **Step 1: Create `src/components/expenses/MonthPicker.tsx`**

```tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

interface MonthPickerProps {
  year: number;
  month: number; // 1–12
  onNavigate: (year: number, month: number) => void;
}

export function MonthPicker({ year, month, onNavigate }: MonthPickerProps) {
  const prev = () => month === 1 ? onNavigate(year - 1, 12) : onNavigate(year, month - 1);
  const next = () => month === 12 ? onNavigate(year + 1, 1) : onNavigate(year, month + 1);

  return (
    <div className="flex items-center gap-2 justify-center">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prev} aria-label="Previous month">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-semibold text-foreground w-36 text-center tabular-nums">
        {MONTHS[month - 1]} {year}
      </span>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next} aria-label="Next month">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/expenses/BalancePanel.tsx`**

```tsx
import React from 'react';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Member, ExpenseResponse } from '@/types/expense';

interface BalancePanelProps {
  balances: Record<string, number>;
  members: Member[];
  isSettled: boolean;
  onSettle: () => void;
  isSettling: boolean;
  onUnsettle: () => void;
  isUnsettling: boolean;
  onRecalculate: () => void;
  isRecalculating: boolean;
  expenses: ExpenseResponse[];
}

export function BalancePanel({
  balances, members, isSettled,
  onSettle, isSettling,
  onUnsettle, isUnsettling,
  onRecalculate, isRecalculating,
  expenses,
}: BalancePanelProps) {
  const name = (id: string) => members.find(m => m.id === parseInt(id))?.name ?? 'Unknown';

  const total = expenses.reduce((s, e) =>
    e.category === 'prestamo' || e.category === 'balance' ? s : s + e.amount, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Balance</h3>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground"
            onClick={onRecalculate} disabled={isRecalculating}>
            <RefreshCw className={cn('h-3 w-3 mr-1', isRecalculating && 'animate-spin')} />
            Recalculate
          </Button>
          {!isSettled ? (
            <Button size="sm" onClick={onSettle} disabled={isSettling}
              className="h-7 px-3 text-xs bg-settle hover:bg-settle/90 text-white font-semibold">
              {isSettling ? 'Settling…' : 'Settle up'}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onUnsettle} disabled={isUnsettling}
              className="h-7 px-3 text-xs border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950">
              {isUnsettling ? 'Reopening…' : 'Reopen month'}
            </Button>
          )}
        </div>
      </div>

      {isSettled && (
        <div className="flex items-center gap-1.5 text-xs text-settle font-medium mb-3">
          <CheckCircle2 className="h-3.5 w-3.5" /> Month settled
        </div>
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-1.5">
        {Object.entries(balances).map(([id, balance]) => (
          <div key={id} className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">{name(id)}</span>
            <span className={cn('text-sm font-semibold tabular-nums',
              balance > 0 ? 'text-settle' : balance < 0 ? 'text-crimson' : 'text-muted-foreground')}>
              {formatCurrency(balance)}
            </span>
          </div>
        ))}
      </div>

      <Separator className="my-3" />

      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">Total expenses</span>
        <span className="font-semibold text-foreground tabular-nums">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/expenses/MonthPicker.tsx src/components/expenses/BalancePanel.tsx
git commit -m "feat: MonthPicker and BalancePanel"
```

---

## Part 1 complete ✓

All foundation, layout, and first group-view components are built. The existing MUI-based app still runs unchanged.

**Remaining tasks in Part 2** (`docs/superpowers/plans/2026-05-28-frontend-redesign-part2.md`):

| Task | Component |
|------|-----------|
| 11 | ExpenseRow with badge chips |
| 12 | ExpenseListHeader (sort + filter toolbar) |
| 13 | AddExpenseDialog (all split types — ports `ExpenseForm.tsx`) |
| 14 | TransferDialog (ports `MoneyTransferForm.tsx`) |
| 15 | ExpensesDashboard page |
| 16 | GroupLayout page (tab bar) |
| 17 | GroupMembersPage + InviteDialog + JoinLinkCard |
| 18 | GroupSettingsPage |
| 19 | ProfilePage |
| 20 | InvitationLanding + GroupJoinLanding (public pages) |
| 21 | App.tsx routing cutover |
| 22 | Remove MUI + delete old files + final verification |
