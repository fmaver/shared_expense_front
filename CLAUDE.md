# shared_expense_front — CLAUDE.md

React + TypeScript frontend for the `shared_expense_manager` backend. Companion repo lives at `/Users/franciscomaver/Documents/shared_expenses/shared_expense_manager`.

---

## Tech stack

- **Framework**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Base UI (Radix-based shadcn components) — prefer Tailwind for new components
- **Charts**: **recharts** — `PieChart/Pie/Cell`, `BarChart/Bar`, `XAxis/YAxis`, `Tooltip`, `Legend`, `ResponsiveContainer`
- **HTTP**: `axios` (sets default `Authorization` header on login) + `fetch` (used in `src/api/`)
- **PDF export**: jsPDF + jsPDF-autotable (client-side)
- **Dev server**: `npm run dev` → http://localhost:5173

---

## How to run

```bash
npm install
npm run dev       # dev server on :5173
npm run build     # production build
npm run lint      # ESLint
```

Backend URL: set `VITE_API_URL` in `.env` (defaults to `http://localhost:8000`).

---

## Desktop vs Mobile

The app serves two distinct experiences from the same codebase, gated by the `lg:` Tailwind breakpoint (≥1024px).

| Layer | Desktop (`lg:`) | Mobile (default) |
|---|---|---|
| **Shell** | `AppShell` — fixed left `Sidebar` + main content area | `AppShell` — no sidebar; `MobileHeader` fixed at top + `FloatingTabBar` fixed at bottom |
| **Navigation** | `Sidebar` — vertical nav list with group links | `FloatingTabBar` — floating pill that collapses to active-tab circle on scroll |
| **Header** | None (sidebar has branding) | `MobileHeader` — brand mark · `DynamicIsland` (centered) · `AccountMenu` |
| **Add expense** | Inline button in group header | FAB (plus button) in `FloatingTabBar` → speed-dial or direct group launcher |
| **Forms / dialogs** | Centered modal (zoom in/out) | Bottom sheet (slides up from bottom, drag down to dismiss) |

The breakpoint split is applied per-component with `lg:hidden` / `max-lg:` / `lg:` Tailwind prefixes. Never use JS to detect mobile — rely solely on CSS breakpoints.

---

## Directory map

```
src/
├── App.tsx                  # root component — auth state, routing, CurrencyProvider wrapper
├── api/
│   ├── auth.ts              # POST /token, POST /register
│   ├── categories.ts        # GET /categories, GET /categories/with-emojis
│   ├── currency.ts          # GET /currency/rate — live dolarapi blue rate
│   ├── expenses.ts          # CRUD for expenses
│   ├── groups.ts            # CRUD, membership, invitations, join-link
│   ├── invitations.ts       # resolve + accept invitation token
│   ├── joinLinks.ts         # resolve + register-and-join via join link
│   ├── members.ts           # GET /members, GET /me, PATCH /me
│   └── shares.ts            # GET/settle/unsettle/recalculate monthly share; getGroupTrend()
├── contexts/
│   ├── CurrencyContext.tsx  # useCurrency(): displayMode, setDisplayMode, blueRate, formatAmount
│   ├── ScrollContext.tsx    # useScroll(): isAtTop, tabBarCollapsed, notifyScroll(scrollTop)
│   ├── IslandContext.tsx    # useIsland(): island state machine for DynamicIsland display
│   └── FabActionsContext.tsx # useFabActions(): personalAdd callback (PersonalDashboard → FAB bridge)
├── components/
│   ├── expenses/
│   │   ├── AddExpenseDialog.tsx    # create/edit expense — all split types, currency selector
│   │   ├── BalancePanel.tsx        # monthly balances + "who pays whom" transfers
│   │   ├── ExpenseDetailDialog.tsx # tap-to-expand detail popup
│   │   ├── ExpenseListHeader.tsx   # filter/sort bar; currency filter + ARS/original toggle
│   │   ├── ExpenseRow.tsx          # single expense row; recurring badge, internal-category emoji
│   │   ├── MonthPicker.tsx
│   │   └── TransferDialog.tsx      # "prestamo" money-transfer form
│   ├── groups/
│   │   └── CreateGroupDialog.tsx
│   ├── layout/
│   │   ├── AppShell.tsx            # top-level shell; renders MobileHeader + FloatingTabBar on mobile, Sidebar on desktop
│   │   ├── MobileHeader.tsx        # mobile-only fixed top bar: brand · DynamicIsland (centered) · AccountMenu
│   │   ├── DynamicIsland.tsx       # animated pill showing current group name or app state
│   │   ├── AccountMenu.tsx         # avatar dropdown: profile, theme, logout
│   │   ├── FloatingTabBar.tsx      # mobile bottom nav pill; collapses to active-tab circle on scroll; FAB + speed-dial
│   │   ├── GroupExpenseLauncher.tsx # FAB target — opens AddExpenseDialog or TransferDialog for a group
│   │   ├── Sidebar.tsx             # desktop left nav: personal, groups list, profile, theme/lang toggles
│   │   └── TopBar.tsx              # legacy mobile header (hamburger → Sheet); kept for non-authenticated pages
│   ├── members/
│   │   ├── InviteDialog.tsx
│   │   └── JoinLinkCard.tsx
│   └── ui/                 # shadcn/Radix primitives: badge, button, dialog, input, select, sheet, etc.
├── hooks/
│   ├── useCategories.ts
│   ├── useGroups.ts
│   ├── useMembers.ts
│   ├── useMonthlyBalance.ts
│   └── useTheme.ts
├── i18n/
│   └── locales/            # en.json, es.json — includes expenses.currency, tabs.charts, charts.*
├── pages/
│   ├── ExpensesDashboard.tsx   # main group view — month picker + expense list + balance panel
│   ├── GroupChartsPage.tsx     # recharts: category donut, payer bar, payment-type bar, 6-month trend
│   ├── GroupLayout.tsx         # group shell — tabs: Expenses | Members | Charts | Settings
│   ├── GroupMembersPage.tsx
│   ├── GroupSelectorPage.tsx
│   ├── GroupSettingsPage.tsx
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── PersonalDashboard.tsx   # personal ledger + income-vs-expense bar + category donut (recharts)
│   └── ProfilePage.tsx
├── public-pages/
│   ├── GroupJoinLanding.tsx    # /join/:token — register + join group
│   └── InvitationLanding.tsx   # /invite/:token — accept invitation
├── types/expense.ts         # all shared TS types (includes currency field on expenses)
└── utils/
    ├── export.ts            # PDF export via jsPDF
    └── format.ts            # formatAmount (currency-aware, es-AR locale), formatDate, capitalize
```

---

## Routing

Routes defined in `src/App.tsx` via `react-router-dom`:

| Path | Component | Auth |
|------|-----------|------|
| `/invite/:token` | `InvitationLanding` | public |
| `/join/:token` | `GroupJoinLanding` | public |
| `/` | redirect → `/groups` | — |
| `/login` | `LoginPage` | — |
| `/groups` | `GroupSelectorPage` | required |
| `/personal` | `PersonalDashboard` | required |
| `/profile` | `ProfilePage` | required |
| `/groups/:groupId` | `GroupLayout` (outlet) | required |
| `/groups/:groupId` (index) | `ExpensesDashboard` | required |
| `/groups/:groupId/members` | `GroupMembersPage` | required |
| `/groups/:groupId/settings` | `GroupSettingsPage` | required |
| `/groups/:groupId/charts` | `GroupChartsPage` | required |

---

## Auth

- Login stores JWT in `localStorage` key `token` with a 30-minute expiration in `tokenExpiration`.
- `axios.defaults.headers.common['Authorization']` is set on login.
- All `fetch`-based calls in `src/api/` must explicitly read `localStorage.getItem('token')` and set the `Authorization: Bearer <token>` header.

---

## API contract (backend)

All endpoints are under `${VITE_API_URL}/api/v1/`. All responses are wrapped:
```json
{ "data": <payload> }
```

### Key types

```ts
type SplitStrategy =
  | { type: 'equal'; participantIds?: number[] | null }
  | { type: 'percentage'; percentages: Record<string, number> }
  | { type: 'exact'; amounts: Record<string, number> }

interface ExpenseCreate {
  description: string;
  amount: number;
  date: string;           // ISO "YYYY-MM-DD"
  category: { name: string };
  payerId: number;
  paymentType: 'debit' | 'credit';
  installments: number;
  splitStrategy: SplitStrategy;
  currency?: string;      // "ARS" (default) | "USD"
}

interface DebtTransfer {
  fromMemberId: number;
  toMemberId: number;
  amount: number;
}

interface MonthlyBalanceResponse {
  year: number;
  month: number;
  expenses: ExpenseResponse[];
  balances: Record<string, number>;   // memberId → float
  isSettled: boolean;
  transfers: DebtTransfer[];          // minimum transfers to settle; empty when settled or balanced
}
```

### Shares endpoints

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/shares/{year}/{month}` | fetch monthly data |
| `POST` | `/shares/settle/{year}/{month}` | close month, create balancing expenses |
| `POST` | `/shares/unsettle/{year}/{month}` | reopen month, delete balancing expenses |
| `POST` | `/shares/recalculate/{year}/{month}` | recalculate balances from current expenses |

### Groups endpoints (JWT required)

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/groups/` | create group |
| `GET` | `/groups/` | list groups for current member |
| `GET` | `/groups/{id}` | get group |
| `PUT` | `/groups/{id}` | rename group |
| `GET` | `/groups/{id}/members` | list members |
| `POST` | `/groups/{id}/invitations` | create invitation (email or WhatsApp) |
| `GET` | `/groups/{id}/invitations` | list pending invitations |
| `DELETE` | `/groups/{id}/invitations/{token}` | revoke invitation |
| `POST` | `/groups/{id}/join-link` | get or create join link |
| `POST` | `/groups/{id}/join-link/rotate` | rotate join link token |
| `DELETE` | `/groups/{id}/members/leave` | leave group |

### Invitation / join-link endpoints (public — no JWT)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/invitations/resolve/{token}` | resolve token → group + stub member info |
| `POST` | `/invitations/{token}/accept` | accept; returns `{ data: { accessToken, tokenType } }` |
| `GET` | `/join/resolve/{token}` | resolve join-link → group info |
| `POST` | `/join/{token}` | register new member and join; returns `{ data: { accessToken, tokenType } }` |

### Categories

`GET /categories/with-emojis` returns `[{ name, emoji }]`. Internal categories (`balance`, `prestamo`) are filtered out by the backend — do not add them to any dropdown. The `prestamo` category is used internally only by `MoneyTransferForm` when submitting.

Current non-internal categories (as of 2026-05): `comida`, `supermercado`, `entretenimiento`, `servicios`, `transporte`, `viajes`, `salud`, `otros`.

---

## Mobile UX patterns

### Scroll-aware tab bar collapse

`ScrollContext` tracks scroll position across all pages. Pages must notify the context by calling `notifyScroll(scrollTop)` from their scroll container's `onScroll` handler. Failure to do this means `FloatingTabBar` never collapses on that page.

**Required scroll container pattern** (copy from `GroupLayout` / `PersonalDashboard`):
```tsx
// Outer div: flex column, no overflow — fills remaining space
<div className="flex flex-col flex-1">
  {/* Inner div: the ONLY element with overflow-y-auto */}
  <div
    className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0"
    onScroll={(e) => notifyScroll((e.target as HTMLDivElement).scrollTop)}
  >
    {/* Page content */}
  </div>
</div>
```
Never put `overflow-y-auto` on the same element as `flex flex-col flex-1` — that makes the content a flex child that shrinks instead of scrolling. `pb-24` provides clearance for the floating tab bar on mobile; `lg:pb-0` removes it on desktop.

### Liquid Glass material

The `.liquid-glass` CSS class (defined in `src/index.css`) implements the iOS 26 "Liquid Glass" frosted material used on `FloatingTabBar` and any surface that should float above the content:

```css
.liquid-glass { /* heavy backdrop blur, subtle white tint, inset highlights */ }
.dark .liquid-glass { /* same with purple-shifted tint for dark mode */ }
```

Use it on floating pills/panels that sit over content. Do not use it on cards or inline elements.

### Bottom sheet dialogs + drag-to-dismiss

On mobile, all `DialogContent` from `src/components/ui/dialog.tsx` renders as a bottom sheet (slides up from the bottom via a CSS keyframe animation). A drag handle is automatically included at the top — users can grab it and swipe down to dismiss.

The drag-to-dismiss logic lives in the `useDragToDismiss` hook inside `dialog.tsx`. Key implementation details:

- **Callback ref** (not `useRef + useEffect`): listeners are attached the instant the handle mounts inside the open dialog, not on component mount when `open=false`.
- **rAF animation loop for dismiss**: CSS transitions on iOS Safari are unreliable when the `transition` property and the animated value change in the same synchronous block. The dismiss exit is driven entirely by a `requestAnimationFrame` loop (no CSS transition). Only the spring-back (below threshold) uses a CSS transition.
- **`e.preventDefault()` on touchend** (`passive: false`): prevents iOS from synthesising a click event at the finger's release position, which would otherwise hit the backdrop and close the dialog via the normal (non-animated) path.
- **`data-drag-dismiss` attribute**: set on the popup before the rAF loop starts; the CSS rule `[data-drag-dismiss] { animation: none }` suppresses `sheet-exit` so it doesn't fight the JS-driven slide.

---

## Conventions

- All `fetch` calls need the bearer token header — see `src/api/expenses.ts` for the pattern.
- `axios` is set up with a global `Authorization` header, so axios calls don't need it explicitly.
- The backend sends camelCase JSON (`payerId`, `isSettled`, etc.).
- Money is `float` throughout — no Decimal.
- Credit installment expenses: only the parent (installmentNo === 1) can be edited or deleted. Editing/deleting the parent cascades to all children on the backend.
- **Currency display**: use `useCurrency()` from `CurrencyContext` — never format amounts directly with hardcoded currency. `formatAmount(amount, currency)` applies the current `displayMode` and blue rate automatically.
- **Safari flex height**: use `h-screen` directly on the AppShell root div. Never chain `h-full` through nested flex parents — Safari silently collapses them.
- **iOS animations**: never rely on CSS `transition` for gesture-driven animations (drag, swipe). Use a `requestAnimationFrame` loop with `performance.now()` timing — CSS batching on iOS Safari will silently skip transitions when `transition` and the animated property change in the same JS block.
- **Button elements**: plain `<button type="button">` for icon-only actions; add `cursor-pointer` to any button containing only an SVG.
- **No SelectValue**: for Radix Select, render the selected value in a `<span>` inside the trigger instead of `<SelectValue>`.
- **CSS tokens**: always use Tailwind CSS-variable tokens (`bg-card`, `text-foreground`, `border-border`, etc.) — they switch automatically for dark mode.
- **Mobile breakpoint**: all mobile-specific code uses `lg:hidden` / `max-lg:` / `lg:` Tailwind prefixes. Never detect mobile in JavaScript.

---

## Known issues / tech-debt

- Debug `console.log` calls remain in various components — should be removed before production.

---

## Backend changes that have already been synced

The following backend changes are already reflected in this frontend as of 2026-05-07:

- **Bearer token** added to all `fetch` calls (`updateExpense`, `deleteExpense`, `settleMonthlyBalance`, `getMonthlyExpenses`, `getMonthlyBalance`, `settleMonthlyShare`, `recalculateMonthlyShare`).
- **`unsettleMonthlyShare`** added to `src/api/shares.ts` — calls `POST /shares/unsettle/{year}/{month}`.
- **Reopen Month button** in `BalanceSummary.tsx` — shown when `isSettled = true`, triggers a confirmation modal before calling unsettle.
- **`SplitStrategy` type** extended with `type: 'exact'`, `amounts`, and `participantIds` in `src/types/expense.ts`.
- **Exact amounts UI** in `ExpenseForm.tsx` — shown when split type is "Exact amounts"; per-member amount inputs.
- **Exact / participantIds display** in `ExpenseList.tsx` — renders correctly for all three split types.
- **Categories are dynamic** — loaded from `GET /categories/with-emojis`. No hardcoded list. The rename of `compras` → `supermercado` and the addition of `viajes` / `salud` are handled by the backend.
- **`transfers` in `MonthlyBalanceResponse`** — backend now returns a `transfers` array alongside `balances`. `BalancePanel.tsx` renders a "Quién le paga a quién" / "Who pays whom" section below the per-member balance rows when the month is unsettled and transfers are non-empty.
