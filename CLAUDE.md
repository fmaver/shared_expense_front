# shared_expense_front — CLAUDE.md

React + TypeScript frontend for the `shared_expense_manager` backend. Companion repo lives at `/Users/franciscomaver/Documents/shared_expenses/shared_expense_manager`.

---

## Tech stack

- **Framework**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + MUI (Material UI v6) — mixed usage; prefer Tailwind for new components
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

## Directory map

```
src/
├── App.tsx                  # root component — auth state, month picker, modals
├── api/
│   ├── auth.ts              # POST /token, POST /register
│   ├── categories.ts        # GET /categories, GET /categories/with-emojis
│   ├── expenses.ts          # CRUD for expenses
│   ├── groups.ts            # CRUD, membership, invitations, join-link
│   ├── invitations.ts       # resolve + accept invitation token
│   ├── joinLinks.ts         # resolve + register-and-join via join link
│   ├── members.ts           # GET /members, GET /me, PATCH /me
│   └── shares.ts            # GET/settle/unsettle/recalculate monthly share
├── components/
│   ├── App.tsx              # ← entry; also defines all react-router-dom routes
│   ├── BalanceSummary.tsx   # monthly balance panel — settle + reopen buttons
│   ├── ConfirmationModal.tsx
│   ├── CreateGroupModal.tsx
│   ├── ExpenseContent.tsx   # orchestrates BalanceSummary + ExpenseList
│   ├── ExpenseForm.tsx      # create/edit expense — all split types
│   ├── ExpenseHeader.tsx
│   ├── ExpenseList.tsx      # sortable table + edit/delete per row
│   ├── ExpensesDashboard.tsx  # main view inside a group (month picker + expense list)
│   ├── FormModal.tsx
│   ├── GroupJoinLanding.tsx # public page for /join/:token (register + join group)
│   ├── GroupLayout.tsx      # authenticated group shell — nested router outlet
│   ├── GroupMembers.tsx     # member list + invite flow
│   ├── GroupSelector.tsx    # root authenticated page — pick or create a group
│   ├── GroupSettings.tsx    # rename group, manage join link
│   ├── InvitationLanding.tsx  # public page for /invite/:token (accept invitation)
│   ├── LoadingSpinner.tsx
│   ├── LoadingState.tsx
│   ├── Login.tsx
│   ├── MoneyTransferForm.tsx # submits a "prestamo" category expense
│   ├── MonthPicker.tsx
│   ├── Profile.tsx
│   └── Toast.tsx
├── config/env.ts            # reads VITE_API_URL
├── hooks/
│   ├── useCategories.ts
│   ├── useExpenses.ts
│   ├── useMembers.ts
│   └── useMonthlyBalance.ts
├── types/expense.ts         # all shared TS types
└── utils/
    ├── export.ts            # PDF export via jsPDF
    └── format.ts            # formatCurrency, formatDate, capitalize
```

---

## Routing

Routes defined in `src/App.tsx` via `react-router-dom`:

| Path | Component | Auth |
|------|-----------|------|
| `/invite/:token` | `InvitationLanding` | public |
| `/join/:token` | `GroupJoinLanding` | public |
| `/` | `GroupSelector` | required |
| `/profile` | `Profile` | required |
| `/groups/:groupId` | `GroupLayout` (outlet) | required |
| `/groups/:groupId` (index) | `ExpensesDashboard` | required |
| `/groups/:groupId/members` | `GroupMembers` | required |
| `/groups/:groupId/settings` | `GroupSettings` | required |

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

## Conventions

- All `fetch` calls need the bearer token header — see `src/api/expenses.ts` for the pattern.
- `axios` is set up with a global `Authorization` header, so axios calls don't need it explicitly.
- The backend sends camelCase JSON (`payerId`, `isSettled`, etc.).
- Money is `float` throughout — no Decimal.
- Credit installment expenses: only the parent (installmentNo === 1) can be edited or deleted. Editing/deleting the parent cascades to all children on the backend.

---

## Known issues / tech-debt

- `ExpenseList.tsx` still has a local `handleRecalculate` that duplicates the one in `ExpenseContent.tsx` — the list-level one can be removed once both are tested.
- The `settleMonthlyBalance` function in `expenses.ts` duplicates the `settleMonthlyShare` in `shares.ts` — they call the same endpoint. Use the one in `shares.ts` for new code; the one in `expenses.ts` is used by `ExpenseContent` and can be migrated in a future cleanup.
- Debug `console.log` calls remain in `App.tsx` and `ExpenseList.tsx`.

---

## Backend changes that have already been synced

The following backend changes are already reflected in this frontend as of 2026-06-07:

- **Bearer token** added to all `fetch` calls (`updateExpense`, `deleteExpense`, `settleMonthlyBalance`, `getMonthlyExpenses`, `getMonthlyBalance`, `settleMonthlyShare`, `recalculateMonthlyShare`).
- **`unsettleMonthlyShare`** added to `src/api/shares.ts` — calls `POST /shares/unsettle/{year}/{month}`.
- **Reopen Month button** in `BalanceSummary.tsx` — shown when `isSettled = true`, triggers a confirmation modal before calling unsettle.
- **`SplitStrategy` type** extended with `type: 'exact'`, `amounts`, and `participantIds` in `src/types/expense.ts`.
- **Exact amounts UI** in `ExpenseForm.tsx` — shown when split type is "Exact amounts"; per-member amount inputs.
- **Exact / participantIds display** in `ExpenseList.tsx` — renders correctly for all three split types.
- **Categories are dynamic** — loaded from `GET /categories/with-emojis`. No hardcoded list. The rename of `compras` → `supermercado` and the addition of `viajes` / `salud` are handled by the backend.
- **`transfers` in `MonthlyBalanceResponse`** — backend now returns a `transfers` array alongside `balances`. `BalancePanel.tsx` renders a "Quién le paga a quién" / "Who pays whom" section below the per-member balance rows when the month is unsettled and transfers are non-empty.
- **Transfer row layout** — each row uses `w-fit` (not full-width flex) so the amount stays close to the names on desktop. Avoid `ml-auto` in this section — it pushes the amount to the panel edge on wide screens.
