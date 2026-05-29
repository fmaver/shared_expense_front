# Mobile Fixes + i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 quick UX issues (PWA home screen icon, mobile badge visibility, Settle Up confirmation + color, "Learn more" button in light mode) and add English/Spanish language switching via react-i18next.

**Architecture:** All changes are in the frontend (`shared_expense_front`). Items 1–4 are isolated one-file fixes. Item 5 (i18n) wraps all user-visible strings in `t()` calls backed by `src/i18n/locales/en.json` and `src/i18n/locales/es.json`; a language toggle appears in the Sidebar footer. No backend changes.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, react-i18next (new), i18next (new).

**Branch:** `feat/mobile-fixes-i18n`

---

## Files created / modified

```
public/manifest.webmanifest           new
public/apple-touch-icon.png           already generated
public/icon-192.png                   already generated
public/icon-512.png                   already generated
index.html                            modified (manifest link, apple-touch-icon)
src/components/expenses/ExpenseRow.tsx      modified (show badges on mobile)
src/components/expenses/BalancePanel.tsx    modified (settle color + confirm prop)
src/pages/ExpensesDashboard.tsx            modified (settle confirm state)
src/pages/LandingPage.tsx                  modified (Learn more button fix)
src/i18n/index.ts                     new
src/i18n/locales/en.json              new
src/i18n/locales/es.json              new
src/main.tsx                          modified (import i18n)
src/components/layout/Sidebar.tsx     modified (language toggle)
src/components/expenses/MonthPicker.tsx    modified
src/components/expenses/BalancePanel.tsx   modified
src/components/expenses/ExpenseRow.tsx     modified
src/components/expenses/ExpenseListHeader.tsx  modified
src/components/expenses/AddExpenseDialog.tsx   modified
src/components/expenses/TransferDialog.tsx     modified
src/pages/LandingPage.tsx             modified
src/pages/LoginPage.tsx               modified
src/pages/GroupSelectorPage.tsx       modified
src/pages/GroupLayout.tsx             modified
src/pages/ExpensesDashboard.tsx       modified
src/pages/GroupMembersPage.tsx        modified
src/pages/GroupSettingsPage.tsx       modified
src/pages/ProfilePage.tsx             modified
src/components/groups/CreateGroupDialog.tsx  modified
src/components/members/InviteDialog.tsx     modified
src/components/members/JoinLinkCard.tsx     modified
```

---

### Task 1: PWA web app manifest (home screen icon)

**Files:**
- Create: `public/manifest.webmanifest`
- Modify: `index.html`

The PNG icons (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) are already in `public/` — no generation needed.

- [ ] **Step 1: Create `public/manifest.webmanifest`**

```json
{
  "name": "Jirens — Shared Expenses",
  "short_name": "Jirens",
  "description": "Track, split, and settle shared expenses with your group.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F5F5F5",
  "theme_color": "#CCBBDD",
  "icons": [
    { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" },
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Update `index.html`** — add manifest link and update apple-touch-icon to use PNG

Replace the existing `<head>` content:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#CCBBDD" />
    <title>Jirens — Shared Expenses</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  </head>
  <body>
    <script>
      (function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}})();
    </script>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

Expected: build succeeds. `dist/manifest.webmanifest`, `dist/apple-touch-icon.png`, `dist/icon-192.png`, `dist/icon-512.png` all exist:

```bash
ls dist/ | grep -E "manifest|icon|apple"
```

- [ ] **Step 4: Commit**

```bash
git add public/manifest.webmanifest public/apple-touch-icon.png public/icon-192.png public/icon-512.png index.html
git commit -m "feat: PWA manifest and home screen icons"
```

---

### Task 2: Show expense badges on mobile

**Files:**
- Modify: `src/components/expenses/ExpenseRow.tsx:72-84`

Currently badges are `hidden sm:flex` — invisible on mobile. Fix: show them as a compact row below the description/meta lines (always visible, not behind `sm:` breakpoint).

- [ ] **Step 1: Replace the badges section in `ExpenseRow.tsx`**

Replace:
```tsx
      {/* Badges */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', SPLIT_BADGE[expense.splitStrategy.type])}>
          {splitLabel}
        </span>
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', PAYMENT_BADGE[expense.paymentType])}>
          {expense.paymentType}
          {expense.paymentType === 'credit' && expense.installments > 1 && ` ${expense.installmentNo}/${expense.installments}`}
        </span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          {capitalize(expense.category)}
        </span>
      </div>
```

With:
```tsx
      {/* Badges — always visible, wraps on mobile */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', SPLIT_BADGE[expense.splitStrategy.type])}>
          {splitLabel}
        </span>
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', PAYMENT_BADGE[expense.paymentType])}>
          {expense.paymentType}
          {expense.paymentType === 'credit' && expense.installments > 1 && ` ${expense.installmentNo}/${expense.installments}`}
        </span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          {capitalize(expense.category)}
        </span>
      </div>
```

Also update the description section to show badges inline on mobile. Replace the description `<div className="flex-1 min-w-0">` block entirely:

```tsx
      {/* Description + meta + mobile badges */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{capitalize(expense.description)}</p>
        <p className="text-xs text-muted-foreground">
          {memberName(members, expense.payerId)} · {formatDate(expense.date, true)}
        </p>
        {expense.splitStrategy.type === 'percentage' && expense.splitStrategy.percentages && (
          <p className="text-xs text-muted-foreground truncate">
            {Object.entries(expense.splitStrategy.percentages)
              .map(([id, pct]) => `${memberName(members, parseInt(id))} ${parseFloat(Number(pct).toFixed(1))}%`)
              .join(' · ')}
          </p>
        )}
        {expense.splitStrategy.type === 'exact' && expense.splitStrategy.amounts && (
          <p className="text-xs text-muted-foreground truncate">
            {Object.entries(expense.splitStrategy.amounts)
              .map(([id, amt]) => `${memberName(members, parseInt(id))} ${formatCurrency(amt ?? 0)}`)
              .join(' · ')}
          </p>
        )}
        {/* Mobile-only badges row */}
        <div className="flex sm:hidden items-center flex-wrap gap-1 mt-1">
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', SPLIT_BADGE[expense.splitStrategy.type])}>
            {splitLabel}
          </span>
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', PAYMENT_BADGE[expense.paymentType])}>
            {expense.paymentType}
            {expense.paymentType === 'credit' && expense.installments > 1 && ` ${expense.installmentNo}/${expense.installments}`}
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {capitalize(expense.category)}
          </span>
        </div>
      </div>
```

- [ ] **Step 2: Verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/expenses/ExpenseRow.tsx
git commit -m "fix: show expense badges on mobile (below description)"
```

---

### Task 3: Settle Up — softer color + confirmation dialog

**Files:**
- Modify: `src/components/expenses/BalancePanel.tsx`
- Modify: `src/pages/ExpensesDashboard.tsx`

Two changes: (a) change Settle Up to an outlined button (less aggressive, harder to press accidentally), (b) require confirmation before settling.

- [ ] **Step 1: Update `BalancePanel.tsx` — change Settle Up button style and add `onSettleRequest` prop**

Replace the entire file content:

```tsx
import React from 'react';
import { formatCurrency } from '@/utils/format';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Member, ExpenseResponse } from '@/types/expense';

interface BalancePanelProps {
  balances: Record<string, number>;
  members: Member[];
  isSettled: boolean;
  onSettleRequest: () => void;  // opens confirmation dialog — caller handles actual settle
  isSettling: boolean;
  onUnsettle: () => void;
  isUnsettling: boolean;
  expenses: ExpenseResponse[];
}

export function BalancePanel({
  balances, members, isSettled,
  onSettleRequest, isSettling,
  onUnsettle, isUnsettling,
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
          {!isSettled ? (
            <button
              type="button"
              onClick={onSettleRequest}
              disabled={isSettling}
              className="h-7 px-3 text-xs rounded-md font-semibold border border-[#4CAF50] text-[#4CAF50] hover:bg-green-50 dark:hover:bg-green-950/40 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSettling ? 'Settling…' : 'Settle up'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onUnsettle}
              disabled={isUnsettling}
              className="h-7 px-3 text-xs rounded-md font-medium border border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isUnsettling ? 'Reopening…' : 'Reopen month'}
            </button>
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

- [ ] **Step 2: Update `ExpensesDashboard.tsx` — add settle confirmation state and dialog**

Find the existing `BalancePanel` call and state in `ExpensesDashboard.tsx`. Make these changes:

**a) Add `showSettleConfirm` state** — add after the existing `isUnsettling` state:

```tsx
const [showSettleConfirm, setShowSettleConfirm] = useState(false);
```

**b) Replace the `<BalancePanel>` call** — change `onSettle={handleSettle}` to `onSettleRequest={() => setShowSettleConfirm(true)}`:

```tsx
      {monthlyData && (
        <BalancePanel
          balances={monthlyData.balances}
          members={members}
          isSettled={isSettled}
          onSettleRequest={() => setShowSettleConfirm(true)}
          isSettling={isSettling}
          onUnsettle={handleUnsettle} isUnsettling={isUnsettling}
          expenses={expenses}
        />
      )}
```

**c) Add the confirmation Dialog** — add after the duplicate-detection Dialog (before the closing `</div>`):

```tsx
      {/* Settle confirmation dialog */}
      <Dialog open={showSettleConfirm} onOpenChange={(isOpen) => { if (!isOpen) setShowSettleConfirm(false); }}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Settle {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will create balancing expenses and close the month. You can reopen it later if needed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettleConfirm(false)}>Cancel</Button>
            <Button
              className="cursor-pointer"
              style={{ backgroundColor: '#4CAF50', color: 'white' }}
              onClick={async () => { setShowSettleConfirm(false); await handleSettle(); }}
            >
              Settle up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/expenses/BalancePanel.tsx src/pages/ExpensesDashboard.tsx
git commit -m "fix: Settle Up outlined button + confirmation dialog before settling"
```

---

### Task 4: Fix "Learn more" button in light mode

**Files:**
- Modify: `src/pages/LandingPage.tsx:62-66`

The `variant="outline"` Button has `bg-background` (near-white in light mode) from its base class, which fights `text-white`. Fix: add `bg-transparent` to override.

- [ ] **Step 1: Update the "Learn more" button in `LandingPage.tsx`**

Find:
```tsx
            <Button size="lg" variant="outline"
              className="border-white/20 text-white hover:bg-white/10 font-semibold px-8"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn more
            </Button>
```

Replace with:
```tsx
            <Button size="lg" variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 font-semibold px-8"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn more
            </Button>
```

- [ ] **Step 2: Verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "fix: Learn more button readable in light mode (bg-transparent)"
```

---

### Task 5: Install and configure react-i18next

**Files:**
- Create: `src/i18n/index.ts`
- Create: `src/i18n/locales/en.json`
- Create: `src/i18n/locales/es.json`
- Modify: `src/main.tsx`

- [ ] **Step 1: Install react-i18next**

```bash
npm install i18next react-i18next
```

Expected: installs cleanly.

- [ ] **Step 2: Create `src/i18n/locales/en.json`**

```json
{
  "nav": {
    "sharedExpenses": "Shared Expenses",
    "groups": "GROUPS",
    "newGroup": "New group",
    "profile": "Profile",
    "toggleTheme": "Toggle theme",
    "logout": "Logout"
  },
  "landing": {
    "nav": { "features": "Features", "signIn": "Sign in", "getStarted": "Get started" },
    "hero": {
      "badge": "Now with WhatsApp AI",
      "headline1": "Shared expenses,",
      "headline2": "finally simple.",
      "subheadline": "Track, split, and settle costs with your group — from the web or straight from WhatsApp.",
      "cta": "Get started free",
      "learnMore": "Learn more"
    },
    "features": {
      "title": "Everything your group needs",
      "subtitle": "Built for couples, roommates, and friends who share costs.",
      "whatsapp": { "title": "WhatsApp bot", "desc": "Add expenses by chat — type \"gasté 500 en comida\" and it's logged." },
      "settle": { "title": "Monthly settle", "desc": "One-click balance settlement at end of month." },
      "receipt": { "title": "Receipt scan", "desc": "Send a receipt photo via WhatsApp. AI extracts amount and category." },
      "groups": { "title": "Multiple groups", "desc": "Home, trips, friends — each group has its own members and history." }
    },
    "howItWorks": {
      "title": "How it works",
      "step1": { "title": "Add an expense", "desc": "Via the web app or a WhatsApp message." },
      "step2": { "title": "Splits are calculated", "desc": "Equal, by percentage, or exact amounts per person." },
      "step3": { "title": "Settle at month end", "desc": "One click balances everyone with minimum transfers." },
      "cta": "Start splitting smarter"
    },
    "footer": { "freeToUse": "Free to use" }
  },
  "auth": {
    "continueWithGoogle": "Continue with Google",
    "or": "or",
    "email": "Email",
    "password": "Password",
    "signIn": "Sign in",
    "signingIn": "Signing in…",
    "noAccount": "Don't have an account?",
    "createOne": "Create one",
    "fullName": "Full name",
    "whatsappPhone": "WhatsApp phone",
    "optional": "(optional)",
    "confirmPassword": "Confirm password",
    "createAccount": "Create account",
    "creatingAccount": "Creating account…",
    "alreadyHaveAccount": "Already have an account?",
    "signInLink": "Sign in",
    "phoneHelp": "Include country code, no + sign.",
    "invalidCredentials": "Invalid email or password.",
    "passwordMismatch": "Passwords do not match.",
    "registrationFailed": "Registration failed. Please try again.",
    "googleSoon": "Google login coming soon 🚀"
  },
  "groups": {
    "yourGroups": "Your groups",
    "newGroup": "New group",
    "failedToFetch": "Failed to fetch",
    "noGroups": "You don't belong to any group yet.",
    "createFirst": "Create your first group",
    "memberCount_one": "{{count}} member",
    "memberCount_other": "{{count}} members",
    "dialog": {
      "title": "New group",
      "namePlaceholder": "e.g. Casa, Viaje 2026",
      "creating": "Creating…",
      "create": "Create group"
    }
  },
  "tabs": {
    "expenses": "Expenses",
    "members": "Members",
    "settings": "Settings"
  },
  "balance": {
    "title": "Balance",
    "settleUp": "Settle up",
    "settling": "Settling…",
    "reopenMonth": "Reopen month",
    "reopening": "Reopening…",
    "monthSettled": "Month settled",
    "totalExpenses": "Total expenses",
    "settleConfirmTitle": "Settle {{month}} {{year}}?",
    "settleConfirmDesc": "This will create balancing expenses and close the month. You can reopen it later if needed."
  },
  "expenses": {
    "title": "Expenses",
    "exportPdf": "Export PDF",
    "transfer": "Transfer",
    "add": "Add",
    "noExpenses": "No expenses this month.",
    "duplicateTitle": "Similar expense found",
    "duplicateDesc": "A similar expense already exists this month:",
    "addAnyway": "Yes, add it",
    "cancel": "Cancel",
    "sort": "Sort",
    "payer": "Payer",
    "category": "Category",
    "all": "All",
    "sortFields": {
      "date": "Date",
      "amount": "Amount",
      "description": "Description",
      "category": "Category",
      "payer": "Payer",
      "paymentType": "Payment type",
      "splitStrategy": "Split type"
    }
  },
  "months": ["January","February","March","April","May","June","July","August","September","October","November","December"],
  "expenseForm": {
    "addExpense": "Add expense",
    "editExpense": "Edit expense",
    "amount": "Amount",
    "description": "Description",
    "date": "Date",
    "category": "Category",
    "payer": "Payer",
    "paymentType": "Payment type",
    "debit": "Debit",
    "credit": "Credit",
    "installments": "Installments",
    "splitType": "Split type",
    "equal": "Equal",
    "percentage": "Percentage",
    "exact": "Exact amounts",
    "participants": "Participants (leave all checked for a full equal split)",
    "percentagesLabel": "Percentages (must sum to 100)",
    "exactLabel": "Exact amounts",
    "amountsCorrect": "✓ Amounts add up correctly",
    "unassigned": "${{amount}} still unassigned",
    "overBy": "Over by ${{amount}}",
    "update": "Update expense",
    "selectPlaceholder": "Select…",
    "exactError": "Exact amounts must add up to the total."
  },
  "transfer": {
    "title": "Money transfer",
    "lender": "Lender (who paid)",
    "borrower": "Borrower (who owes)",
    "amount": "Amount",
    "date": "Date",
    "description": "Description",
    "save": "Save transfer",
    "saving": "Saving…"
  },
  "members": {
    "title": "Members",
    "invite": "Invite",
    "pending": "Pending",
    "pendingInvitations": "Pending invitations",
    "leaveGroup": "Leave group",
    "leaveTitle": "Leave group?",
    "leaveDesc": "You'll lose access to this group's expenses and history. This is blocked if you have an outstanding balance.",
    "leaving": "Leaving…",
    "inviteTitle": "Invite member",
    "channel": "Channel",
    "emailChannel": "Email",
    "whatsappChannel": "WhatsApp / Phone",
    "emailAddress": "Email address",
    "phoneNumber": "WhatsApp number",
    "phoneHelp": "Include country code, no + sign.",
    "sendInvite": "Send invite",
    "sending": "Sending…",
    "joinLinkTitle": "Shareable join link",
    "copy": "Copy",
    "rotate": "Rotate",
    "createLink": "Create join link"
  },
  "settings": {
    "groupName": "Group name",
    "dangerZone": "Danger zone",
    "save": "Save",
    "saving": "Saving…"
  },
  "profile": {
    "title": "Profile",
    "fullName": "Full name",
    "email": "Email",
    "phone": "WhatsApp phone",
    "notifPref": "Notification preference",
    "notifWhatsapp": "WhatsApp",
    "notifEmail": "Email",
    "notifNone": "None",
    "saveProfile": "Save profile",
    "saving": "Saving…",
    "changePassword": "Change password",
    "currentPassword": "Current password",
    "newPassword": "New password",
    "confirmNewPassword": "Confirm new password",
    "changePasswordBtn": "Change password",
    "changingPassword": "Changing…"
  },
  "toasts": {
    "expenseAdded": "Expense added",
    "expenseUpdated": "Expense updated",
    "expenseDeleted": "Expense deleted",
    "monthSettled": "Month settled",
    "monthReopened": "Month reopened",
    "balancesRecalculated": "Balances recalculated",
    "profileUpdated": "Profile updated",
    "passwordChanged": "Password changed",
    "invitationSent": "Invitation sent!",
    "invitationRevoked": "Invitation revoked",
    "groupRenamed": "Group renamed",
    "leftGroup": "Left group",
    "linkCopied": "Link copied",
    "linkRotated": "Join link rotated",
    "failedSettle": "Failed to settle",
    "failedReopen": "Failed to reopen",
    "failedDelete": "Failed to delete expense",
    "failedExport": "Failed to export PDF"
  },
  "common": {
    "cancel": "Cancel",
    "save": "Save",
    "loading": "Loading…"
  },
  "language": "ES"
}
```

- [ ] **Step 3: Create `src/i18n/locales/es.json`**

```json
{
  "nav": {
    "sharedExpenses": "Gastos Compartidos",
    "groups": "GRUPOS",
    "newGroup": "Nuevo grupo",
    "profile": "Perfil",
    "toggleTheme": "Cambiar tema",
    "logout": "Cerrar sesión"
  },
  "landing": {
    "nav": { "features": "Funciones", "signIn": "Iniciar sesión", "getStarted": "Comenzar" },
    "hero": {
      "badge": "Ahora con IA en WhatsApp",
      "headline1": "Gastos compartidos,",
      "headline2": "finalmente simples.",
      "subheadline": "Registrá, dividí y saldá gastos con tu grupo — desde la web o directo por WhatsApp.",
      "cta": "Comenzar gratis",
      "learnMore": "Ver más"
    },
    "features": {
      "title": "Todo lo que tu grupo necesita",
      "subtitle": "Hecho para parejas, compañeros de cuarto y amigos que comparten gastos.",
      "whatsapp": { "title": "Bot de WhatsApp", "desc": "Agregá gastos por chat — escribí \"gasté 500 en comida\" y listo." },
      "settle": { "title": "Saldar mensual", "desc": "Saldar balances con un clic al final del mes." },
      "receipt": { "title": "Escanear recibos", "desc": "Mandá una foto del ticket por WhatsApp. La IA extrae el monto y categoría." },
      "groups": { "title": "Múltiples grupos", "desc": "Casa, viajes, amigos — cada grupo tiene sus propios miembros e historial." }
    },
    "howItWorks": {
      "title": "Cómo funciona",
      "step1": { "title": "Agregá un gasto", "desc": "Desde la app web o un mensaje de WhatsApp." },
      "step2": { "title": "Se calculan las divisiones", "desc": "Igualitario, por porcentaje o montos exactos por persona." },
      "step3": { "title": "Saldá a fin de mes", "desc": "Un clic balancea a todos con las mínimas transferencias." },
      "cta": "Empezá a dividir mejor"
    },
    "footer": { "freeToUse": "Gratis" }
  },
  "auth": {
    "continueWithGoogle": "Continuar con Google",
    "or": "o",
    "email": "Email",
    "password": "Contraseña",
    "signIn": "Iniciar sesión",
    "signingIn": "Iniciando sesión…",
    "noAccount": "¿No tenés cuenta?",
    "createOne": "Crear una",
    "fullName": "Nombre completo",
    "whatsappPhone": "Teléfono de WhatsApp",
    "optional": "(opcional)",
    "confirmPassword": "Confirmar contraseña",
    "createAccount": "Crear cuenta",
    "creatingAccount": "Creando cuenta…",
    "alreadyHaveAccount": "¿Ya tenés cuenta?",
    "signInLink": "Iniciá sesión",
    "phoneHelp": "Incluí el código de país, sin el signo +.",
    "invalidCredentials": "Email o contraseña inválidos.",
    "passwordMismatch": "Las contraseñas no coinciden.",
    "registrationFailed": "Error al registrarse. Intentá de nuevo.",
    "googleSoon": "Google login próximamente 🚀"
  },
  "groups": {
    "yourGroups": "Tus grupos",
    "newGroup": "Nuevo grupo",
    "failedToFetch": "Error al cargar",
    "noGroups": "Todavía no pertenecés a ningún grupo.",
    "createFirst": "Creá tu primer grupo",
    "memberCount_one": "{{count}} miembro",
    "memberCount_other": "{{count}} miembros",
    "dialog": {
      "title": "Nuevo grupo",
      "namePlaceholder": "ej. Casa, Viaje 2026",
      "creating": "Creando…",
      "create": "Crear grupo"
    }
  },
  "tabs": {
    "expenses": "Gastos",
    "members": "Miembros",
    "settings": "Configuración"
  },
  "balance": {
    "title": "Balance",
    "settleUp": "Saldar",
    "settling": "Saldando…",
    "reopenMonth": "Reabrir mes",
    "reopening": "Reabriendo…",
    "monthSettled": "Mes saldado",
    "totalExpenses": "Total de gastos",
    "settleConfirmTitle": "¿Saldar {{month}} {{year}}?",
    "settleConfirmDesc": "Se crearán gastos de balance y se cerrará el mes. Podés reabrirlo más adelante si es necesario."
  },
  "expenses": {
    "title": "Gastos",
    "exportPdf": "Exportar PDF",
    "transfer": "Transferencia",
    "add": "Agregar",
    "noExpenses": "Sin gastos este mes.",
    "duplicateTitle": "Gasto similar encontrado",
    "duplicateDesc": "Ya existe un gasto similar este mes:",
    "addAnyway": "Sí, agregar igual",
    "cancel": "Cancelar",
    "sort": "Ordenar",
    "payer": "Pagador",
    "category": "Categoría",
    "all": "Todos",
    "sortFields": {
      "date": "Fecha",
      "amount": "Monto",
      "description": "Descripción",
      "category": "Categoría",
      "payer": "Pagador",
      "paymentType": "Tipo de pago",
      "splitStrategy": "Tipo de división"
    }
  },
  "months": ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
  "expenseForm": {
    "addExpense": "Agregar gasto",
    "editExpense": "Editar gasto",
    "amount": "Monto",
    "description": "Descripción",
    "date": "Fecha",
    "category": "Categoría",
    "payer": "Pagador",
    "paymentType": "Tipo de pago",
    "debit": "Débito",
    "credit": "Crédito",
    "installments": "Cuotas",
    "splitType": "Tipo de división",
    "equal": "Igualitario",
    "percentage": "Porcentaje",
    "exact": "Montos exactos",
    "participants": "Participantes (dejá todos marcados para dividir igualitario completo)",
    "percentagesLabel": "Porcentajes (deben sumar 100)",
    "exactLabel": "Montos exactos",
    "amountsCorrect": "✓ Los montos están correctos",
    "unassigned": "${{amount}} sin asignar",
    "overBy": "Excedido por ${{amount}}",
    "update": "Actualizar gasto",
    "selectPlaceholder": "Seleccioná…",
    "exactError": "Los montos exactos deben sumar el total."
  },
  "transfer": {
    "title": "Transferencia de dinero",
    "lender": "Prestador (quien pagó)",
    "borrower": "Deudor (quien debe)",
    "amount": "Monto",
    "date": "Fecha",
    "description": "Descripción",
    "save": "Guardar transferencia",
    "saving": "Guardando…"
  },
  "members": {
    "title": "Miembros",
    "invite": "Invitar",
    "pending": "Pendiente",
    "pendingInvitations": "Invitaciones pendientes",
    "leaveGroup": "Salir del grupo",
    "leaveTitle": "¿Salir del grupo?",
    "leaveDesc": "Perderás acceso a los gastos e historial de este grupo. Está bloqueado si tenés un balance pendiente.",
    "leaving": "Saliendo…",
    "inviteTitle": "Invitar miembro",
    "channel": "Canal",
    "emailChannel": "Email",
    "whatsappChannel": "WhatsApp / Teléfono",
    "emailAddress": "Dirección de email",
    "phoneNumber": "Número de WhatsApp",
    "phoneHelp": "Incluí el código de país, sin el signo +.",
    "sendInvite": "Enviar invitación",
    "sending": "Enviando…",
    "joinLinkTitle": "Link para unirse",
    "copy": "Copiar",
    "rotate": "Rotar",
    "createLink": "Crear link"
  },
  "settings": {
    "groupName": "Nombre del grupo",
    "dangerZone": "Zona de peligro",
    "save": "Guardar",
    "saving": "Guardando…"
  },
  "profile": {
    "title": "Perfil",
    "fullName": "Nombre completo",
    "email": "Email",
    "phone": "Teléfono de WhatsApp",
    "notifPref": "Preferencia de notificación",
    "notifWhatsapp": "WhatsApp",
    "notifEmail": "Email",
    "notifNone": "Ninguna",
    "saveProfile": "Guardar perfil",
    "saving": "Guardando…",
    "changePassword": "Cambiar contraseña",
    "currentPassword": "Contraseña actual",
    "newPassword": "Nueva contraseña",
    "confirmNewPassword": "Confirmar nueva contraseña",
    "changePasswordBtn": "Cambiar contraseña",
    "changingPassword": "Cambiando…"
  },
  "toasts": {
    "expenseAdded": "Gasto agregado",
    "expenseUpdated": "Gasto actualizado",
    "expenseDeleted": "Gasto eliminado",
    "monthSettled": "Mes saldado",
    "monthReopened": "Mes reabierto",
    "balancesRecalculated": "Balances recalculados",
    "profileUpdated": "Perfil actualizado",
    "passwordChanged": "Contraseña cambiada",
    "invitationSent": "¡Invitación enviada!",
    "invitationRevoked": "Invitación revocada",
    "groupRenamed": "Grupo renombrado",
    "leftGroup": "Saliste del grupo",
    "linkCopied": "Link copiado",
    "linkRotated": "Link rotado",
    "failedSettle": "Error al saldar",
    "failedReopen": "Error al reabrir",
    "failedDelete": "Error al eliminar gasto",
    "failedExport": "Error al exportar PDF"
  },
  "common": {
    "cancel": "Cancelar",
    "save": "Guardar",
    "loading": "Cargando…"
  },
  "language": "EN"
}
```

- [ ] **Step 4: Create `src/i18n/index.ts`**

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

const stored = localStorage.getItem('language') as 'en' | 'es' | null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: stored ?? 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
```

- [ ] **Step 5: Update `src/main.tsx`** — import i18n before App so it initialises first

Add `import '@/i18n';` as the FIRST import (before React):

```tsx
import '@/i18n';
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

- [ ] **Step 6: Verify**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/i18n/ src/main.tsx package.json package-lock.json
git commit -m "feat: add react-i18next with EN/ES translation files"
```

---

### Task 6: Language toggle in Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

Add `EN` / `ES` toggle button in the sidebar footer, next to the theme toggle and logout.

- [ ] **Step 1: Update `src/components/layout/Sidebar.tsx`**

Add the import at the top:
```tsx
import { useTranslation } from 'react-i18next';
```

Inside `Sidebar` function, add after `const { theme, toggle } = useTheme();`:
```tsx
const { t, i18n } = useTranslation();
const currentLang = i18n.language.startsWith('es') ? 'es' : 'en';
const toggleLang = () => {
  const next = currentLang === 'en' ? 'es' : 'en';
  i18n.changeLanguage(next);
  localStorage.setItem('language', next);
};
```

Update the footer `div` to add the language toggle button between the theme toggle and logout:

```tsx
      {/* Footer */}
      <div className="px-3 py-3 flex items-center justify-between gap-2">
        <button onClick={() => go('/profile')}
          className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="w-7 h-7 bg-brand rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <span className="text-sm text-muted-foreground truncate">{name || t('nav.profile')}</span>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={toggleLang}
            className="h-7 px-1.5 rounded-md text-[11px] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            aria-label="Switch language"
          >
            {t('language')}
          </button>
          <button
            type="button"
            onClick={toggle}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            aria-label={t('nav.toggleTheme')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            aria-label={t('nav.logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
```

The `t('language')` key returns `"ES"` in English mode and `"EN"` in Spanish mode — so it always shows what you'll switch TO.

- [ ] **Step 2: Verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: language toggle (EN/ES) in Sidebar footer"
```

---

### Task 7: Apply translations — LandingPage, LoginPage, GroupSelectorPage, GroupLayout

**Files:** `src/pages/LandingPage.tsx`, `src/pages/LoginPage.tsx`, `src/pages/GroupSelectorPage.tsx`, `src/pages/GroupLayout.tsx`

Pattern for every component: add `import { useTranslation } from 'react-i18next';` and `const { t } = useTranslation();` then replace hardcoded strings.

- [ ] **Step 1: Apply to `src/pages/LandingPage.tsx`**

Add import and hook. Key replacements (find-and-replace each hardcoded string):

```tsx
// Add at top: import { useTranslation } from 'react-i18next';
// Inside LandingPage(): const { t } = useTranslation();

// Nav
"Features"            → {t('landing.nav.features')}
"Sign in"             → {t('landing.nav.signIn')}
"Get started"         → {t('landing.nav.getStarted')}

// Hero
"Now with WhatsApp AI" → {t('landing.hero.badge')}
"Shared expenses,"    → {t('landing.hero.headline1')}
"finally simple."     → {t('landing.hero.headline2')}
"Track, split..."     → {t('landing.hero.subheadline')}
"Get started free"    → {t('landing.hero.cta')}
"Learn more"          → {t('landing.hero.learnMore')}

// Features
"Everything your group needs"      → {t('landing.features.title')}
"Built for couples..."             → {t('landing.features.subtitle')}

// Replace FEATURES array with translated version inside component:
const FEATURES = [
  { icon: MessageSquare, title: t('landing.features.whatsapp.title'), desc: t('landing.features.whatsapp.desc') },
  { icon: Scale,         title: t('landing.features.settle.title'),   desc: t('landing.features.settle.desc') },
  { icon: Camera,        title: t('landing.features.receipt.title'),  desc: t('landing.features.receipt.desc') },
  { icon: Users,         title: t('landing.features.groups.title'),   desc: t('landing.features.groups.desc') },
];

// Replace STEPS array:
const STEPS = [
  { n: '01', title: t('landing.howItWorks.step1.title'), desc: t('landing.howItWorks.step1.desc') },
  { n: '02', title: t('landing.howItWorks.step2.title'), desc: t('landing.howItWorks.step2.desc') },
  { n: '03', title: t('landing.howItWorks.step3.title'), desc: t('landing.howItWorks.step3.desc') },
];

// NOTE: Move FEATURES and STEPS from module-level constants INTO the component body (after const { t } = useTranslation())

"How it works"             → {t('landing.howItWorks.title')}
"Start splitting smarter"  → {t('landing.howItWorks.cta')}
"Free to use"              → {t('landing.footer.freeToUse')}
"Jirens" (wordmark)        → keep as-is (brand name, not translated)
"SHARED EXPENSES"          → keep the tagline approach or add a translation key
```

- [ ] **Step 2: Apply to `src/pages/LoginPage.tsx`**

```tsx
// Add import + hook
"Continue with Google"       → {t('auth.continueWithGoogle')}
"or"                         → {t('auth.or')}
"Email"                      → {t('auth.email')}
"Password"                   → {t('auth.password')}
"Sign in"  (button)          → {t('auth.signIn')}
"Signing in…"                → {t('auth.signingIn')}
"Don't have an account?"     → {t('auth.noAccount')}
"Create one"                 → {t('auth.createOne')}
"Full name"                  → {t('auth.fullName')}
"WhatsApp phone"             → {t('auth.whatsappPhone')}
"(optional)"                 → {t('auth.optional')}
"Confirm password"           → {t('auth.confirmPassword')}
"Create account"             → {t('auth.createAccount')}
"Creating account…"          → {t('auth.creatingAccount')}
"Already have an account?"   → {t('auth.alreadyHaveAccount')}
"Sign in" (link)             → {t('auth.signInLink')}
"Include country code..."    → {t('auth.phoneHelp')}
// Error strings:
'Invalid email or password.' → t('auth.invalidCredentials')
'Passwords do not match.'    → t('auth.passwordMismatch')
'Registration failed...'     → t('auth.registrationFailed')
// Toast:
toast.info('Google login coming soon 🚀') → toast.info(t('auth.googleSoon'))
```

- [ ] **Step 3: Apply to `src/pages/GroupSelectorPage.tsx`**

```tsx
"Your groups"                → {t('groups.yourGroups')}
"New group"                  → {t('groups.newGroup')}
"Failed to fetch"            → {t('groups.failedToFetch')}  
"You don't belong..."        → {t('groups.noGroups')}
"Create your first group"    → {t('groups.createFirst')}
// Member count:
`${group.members.length} member${group.members.length !== 1 ? 's' : ''}`
→ t('groups.memberCount', { count: group.members.length })
```

- [ ] **Step 4: Apply to `src/pages/GroupLayout.tsx`**

```tsx
// Replace TABS array:
const { t } = useTranslation();
const TABS = [
  { label: t('tabs.expenses'), path: '' },
  { label: t('tabs.members'),  path: 'members' },
  { label: t('tabs.settings'), path: 'settings' },
];
```

- [ ] **Step 5: Apply to `src/components/groups/CreateGroupDialog.tsx`**

```tsx
"New group"    → {t('groups.dialog.title')}
placeholder    → t('groups.dialog.namePlaceholder')
"Creating…"   → {t('groups.dialog.creating')}
"Create group" → {t('groups.dialog.create')}
```

- [ ] **Step 6: Verify**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/LandingPage.tsx src/pages/LoginPage.tsx src/pages/GroupSelectorPage.tsx src/pages/GroupLayout.tsx src/components/groups/CreateGroupDialog.tsx
git commit -m "feat(i18n): translate landing, login, group selector, group layout"
```

---

### Task 8: Apply translations — expense components

**Files:** `src/components/expenses/MonthPicker.tsx`, `src/components/expenses/BalancePanel.tsx`, `src/components/expenses/ExpenseListHeader.tsx`, `src/pages/ExpensesDashboard.tsx`

- [ ] **Step 1: Apply to `src/components/expenses/MonthPicker.tsx`**

Replace the static `MONTHS` array with a translated version. The `months` key is an array in JSON:

```tsx
import { useTranslation } from 'react-i18next';

export function MonthPicker({ year, month, onNavigate }: MonthPickerProps) {
  const { t } = useTranslation();
  const months = t('months', { returnObjects: true }) as string[];
  // ...
  <span ...>
    {months[month - 1]} {year}
  </span>
}
```

- [ ] **Step 2: Apply to `src/components/expenses/BalancePanel.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
// inside component:
const { t } = useTranslation();

"Balance"       → {t('balance.title')}
"Settling…"     → {t('balance.settling')}
"Settle up"     → {t('balance.settleUp')}
"Reopening…"    → {t('balance.reopening')}
"Reopen month"  → {t('balance.reopenMonth')}
"Month settled" → {t('balance.monthSettled')}
"Total expenses"→ {t('balance.totalExpenses')}
```

- [ ] **Step 3: Apply to `src/components/expenses/ExpenseListHeader.tsx`**

```tsx
const { t } = useTranslation();

// Replace SORT_FIELDS:
const SORT_FIELDS = [
  { value: 'date' as SortField,          label: t('expenses.sortFields.date') },
  { value: 'amount' as SortField,        label: t('expenses.sortFields.amount') },
  { value: 'description' as SortField,  label: t('expenses.sortFields.description') },
  { value: 'category' as SortField,     label: t('expenses.sortFields.category') },
  { value: 'payer' as SortField,        label: t('expenses.sortFields.payer') },
  { value: 'paymentType' as SortField,  label: t('expenses.sortFields.paymentType') },
  { value: 'splitStrategy' as SortField,label: t('expenses.sortFields.splitStrategy') },
];
// Move SORT_FIELDS inside the component body.

"Sort"     → {t('expenses.sort')}
"Payer"    → {t('expenses.payer')}
"Category" → {t('expenses.category')}
"All"      → {t('expenses.all')}
```

- [ ] **Step 4: Apply to `src/pages/ExpensesDashboard.tsx`**

```tsx
const { t } = useTranslation();

"Expenses"                      → {t('expenses.title')}
"Export PDF"                    → {t('expenses.exportPdf')}
"Transfer"                      → {t('expenses.transfer')}
"Add"                           → {t('expenses.add')}
"No expenses this month."       → {t('expenses.noExpenses')}
"Similar expense found"         → {t('expenses.duplicateTitle')}
"A similar expense already..."  → {t('expenses.duplicateDesc')}
"Yes, add it"                   → {t('expenses.addAnyway')}
"Cancel"                        → {t('common.cancel')}
// Settle confirm dialog:
"Settle {{month}} {{year}}?"    → {t('balance.settleConfirmTitle', { month: new Date(year, month-1).toLocaleString('default', {month:'long'}), year })}
"This will create..."           → {t('balance.settleConfirmDesc')}
"Settle up"  (confirm button)   → {t('balance.settleUp')}
// Toasts:
toast.success('Expense added')   → toast.success(t('toasts.expenseAdded'))
toast.success('Expense updated') → toast.success(t('toasts.expenseUpdated'))
toast.success('Expense deleted') → toast.success(t('toasts.expenseDeleted'))
toast.success('Month settled')   → toast.success(t('toasts.monthSettled'))
toast.success('Month reopened')  → toast.success(t('toasts.monthReopened'))
toast.error('Failed to settle')  → toast.error(t('toasts.failedSettle'))
toast.error('Failed to reopen')  → toast.error(t('toasts.failedReopen'))
toast.error(error ?? 'Failed to delete expense') → toast.error(error ?? t('toasts.failedDelete'))
toast.error('Failed to export PDF') → toast.error(t('toasts.failedExport'))
```

- [ ] **Step 5: Verify**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/expenses/MonthPicker.tsx src/components/expenses/BalancePanel.tsx src/components/expenses/ExpenseListHeader.tsx src/pages/ExpensesDashboard.tsx
git commit -m "feat(i18n): translate expense components and dashboard"
```

---

### Task 9: Apply translations — AddExpenseDialog, TransferDialog

**Files:** `src/components/expenses/AddExpenseDialog.tsx`, `src/components/expenses/TransferDialog.tsx`

- [ ] **Step 1: Apply to `AddExpenseDialog.tsx`**

```tsx
const { t } = useTranslation();

isEdit ? 'Edit expense' : 'Add expense'    → isEdit ? t('expenseForm.editExpense') : t('expenseForm.addExpense')
"Amount"             → {t('expenseForm.amount')}
"Description"        → {t('expenseForm.description')}
"Date"               → {t('expenseForm.date')}
"Category"           → {t('expenseForm.category')}
"Payer"              → {t('expenseForm.payer')}
"Payment type"       → {t('expenseForm.paymentType')}
"Debit"              → {t('expenseForm.debit')}
"Credit"             → {t('expenseForm.credit')}
"Installments"       → {t('expenseForm.installments')}
"Split type"         → {t('expenseForm.splitType')}
"Equal"              → {t('expenseForm.equal')}
"Percentage"         → {t('expenseForm.percentage')}
"Exact amounts"      → {t('expenseForm.exact')}
// SelectTrigger display text:
expense.paymentType === 'debit' ? 'Debit' : 'Credit'
→ expense.paymentType === 'debit' ? t('expenseForm.debit') : t('expenseForm.credit')
{{ equal: 'Equal', percentage: 'Percentage', exact: 'Exact amounts' }[expense.splitStrategy.type]}
→ ({ equal: t('expenseForm.equal'), percentage: t('expenseForm.percentage'), exact: t('expenseForm.exact') })[expense.splitStrategy.type]
// Participants label:
"Participants (leave all...)" → {t('expenseForm.participants')}
// Percentages label:
"Percentages (must sum to 100)" → {t('expenseForm.percentagesLabel')}
// Exact label:
"Exact amounts"  → {t('expenseForm.exactLabel')}
// Validation messages:
'✓ Amounts add up correctly' → t('expenseForm.amountsCorrect')
`$${exactRemaining.toFixed(2)} still unassigned` → t('expenseForm.unassigned', { amount: exactRemaining.toFixed(2) })
`Over by $${Math.abs(exactRemaining).toFixed(2)}` → t('expenseForm.overBy', { amount: Math.abs(exactRemaining).toFixed(2) })
// Buttons:
"Cancel"       → {t('common.cancel')}
isEdit ? 'Update expense' : 'Add expense' → isEdit ? t('expenseForm.update') : t('expenseForm.addExpense')
// Error:
'Exact amounts must add up to the total.' → t('expenseForm.exactError')
// Category select placeholder:
'Select…' → t('expenseForm.selectPlaceholder')
// loadingCats ? 'Loading…' :
loadingCats ? t('common.loading') :
```

- [ ] **Step 2: Apply to `TransferDialog.tsx`**

```tsx
const { t } = useTranslation();

"Money transfer"          → {t('transfer.title')}
"Lender (who paid)"       → {t('transfer.lender')}
"Borrower (who owes)"     → {t('transfer.borrower')} (if field exists)
"Amount"                  → {t('transfer.amount')}
"Date"                    → {t('transfer.date')}
"Description"             → {t('transfer.description')}
"Save transfer"           → {t('transfer.save')}
"Saving…"                 → {t('transfer.saving')}
"Cancel"                  → {t('common.cancel')}
'Failed to create transfer.' → stays as error state (already handled)
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/expenses/AddExpenseDialog.tsx src/components/expenses/TransferDialog.tsx
git commit -m "feat(i18n): translate expense form dialogs"
```

---

### Task 10: Apply translations — Members, Settings, Profile pages

**Files:** `src/pages/GroupMembersPage.tsx`, `src/pages/GroupSettingsPage.tsx`, `src/pages/ProfilePage.tsx`, `src/components/members/InviteDialog.tsx`, `src/components/members/JoinLinkCard.tsx`

- [ ] **Step 1: Apply to `GroupMembersPage.tsx`**

```tsx
const { t } = useTranslation();

"Members"                        → {t('members.title')}
"Invite"                         → {t('members.invite')}
"Pending"  (badge)               → {t('members.pending')}
"Pending invitations"            → {t('members.pendingInvitations')}
"Leave group"                    → {t('members.leaveGroup')}
"Leave group?" (dialog title)    → {t('members.leaveTitle')}
"You'll lose access..."          → {t('members.leaveDesc')}
"Leave group" (confirm button)   → {t('members.leaveGroup')}
"Leaving…"                       → {t('members.leaving')}
// Toasts:
toast.success('Invitation revoked') → toast.success(t('toasts.invitationRevoked'))
toast.error('Failed to revoke')    → stays
toast.success('Left group')        → toast.success(t('toasts.leftGroup'))
```

- [ ] **Step 2: Apply to `InviteDialog.tsx`**

```tsx
const { t } = useTranslation();

"Invite member"              → {t('members.inviteTitle')}
"Channel"                    → {t('members.channel')}
"Email"  (SelectItem)        → {t('members.emailChannel')}
"WhatsApp / Phone"           → {t('members.whatsappChannel')}
"Email address"              → {t('members.emailAddress')}
"WhatsApp number"            → {t('members.phoneNumber')}
"Include country code..."    → {t('members.phoneHelp')}
"Send invite"                → {t('members.sendInvite')}
"Sending…"                   → {t('members.sending')}
"Cancel"                     → {t('common.cancel')}
// Toasts:
toast.success('Invitation sent!') → toast.success(t('toasts.invitationSent'))
toast.error('Failed to send invitation') → stays
```

- [ ] **Step 3: Apply to `JoinLinkCard.tsx`**

```tsx
const { t } = useTranslation();

"Shareable join link"  → {t('members.joinLinkTitle')}
"Copy"                 → {t('members.copy')}
"Rotate"               → {t('members.rotate')}
"Create join link"     → {t('members.createLink')}
// Toasts:
toast.success('Link copied')       → toast.success(t('toasts.linkCopied'))
toast.success('Join link rotated') → toast.success(t('toasts.linkRotated'))
```

- [ ] **Step 4: Apply to `GroupSettingsPage.tsx`**

```tsx
const { t } = useTranslation();

"Group name"        → {t('settings.groupName')}
"Danger zone"       → {t('settings.dangerZone')}
"Save"  (button)    → {t('settings.save')}
"Saving…"           → {t('settings.saving')}
"Leave group?"      → {t('members.leaveTitle')}
// Reuse members.leaveDesc and members.leaveGroup for consistency
// Toast:
toast.success('Group renamed') → toast.success(t('toasts.groupRenamed'))
```

- [ ] **Step 5: Apply to `ProfilePage.tsx`**

```tsx
const { t } = useTranslation();

"Profile"                    → {t('profile.title')}
"Full name"                  → {t('profile.fullName')}
"Email"                      → {t('profile.email')}
"WhatsApp phone"             → {t('profile.phone')}
"Notification preference"    → {t('profile.notifPref')}
"WhatsApp" (SelectItem)      → {t('profile.notifWhatsapp')}
"Email" (SelectItem)         → {t('profile.notifEmail')}
"None"                       → {t('profile.notifNone')}
"Save profile"               → {t('profile.saveProfile')}
"Saving…"                    → {t('profile.saving')}
"Change password"            → {t('profile.changePassword')}
"Current password"           → {t('profile.currentPassword')}
"New password"               → {t('profile.newPassword')}
"Confirm new password"       → {t('profile.confirmNewPassword')}
"Change password" (button)   → {t('profile.changePasswordBtn')}
"Changing…"                  → {t('profile.changingPassword')}
// Toasts:
toast.success('Profile updated')  → toast.success(t('toasts.profileUpdated'))
toast.success('Password changed') → toast.success(t('toasts.passwordChanged'))
```

- [ ] **Step 6: Verify**

```bash
npm run build && npm run lint
```

Expected: 0 TypeScript errors, 0 lint errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/GroupMembersPage.tsx src/pages/GroupSettingsPage.tsx src/pages/ProfilePage.tsx src/components/members/InviteDialog.tsx src/components/members/JoinLinkCard.tsx
git commit -m "feat(i18n): translate members, settings, profile pages"
```

---

### Task 11: Push and verify

- [ ] **Step 1: Final build + lint**

```bash
npm run build && npm run lint
```

Expected: build succeeds, 0 errors.

- [ ] **Step 2: Push**

```bash
git push -u origin feat/mobile-fixes-i18n
```

- [ ] **Step 3: Manual smoke test** (start dev server, test EN↔ES switch)

```bash
npm run dev
```

Open http://localhost:5173. Verify:
- [ ] Sidebar footer shows language button (shows `ES` in English mode, `EN` in Spanish mode)
- [ ] Clicking toggles all visible strings to Spanish / English
- [ ] Reload preserves language preference
- [ ] Expense badges visible on narrow viewport (mobile simulation via devtools)
- [ ] Settle Up button is outlined green, clicking shows confirmation dialog
- [ ] "Learn more" button is readable in light mode
- [ ] "Save as web app" on phone shows Jirens icon (after staging deploy)
