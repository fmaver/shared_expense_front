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
│   ├── expenses.ts          # CRUD for expenses + settle/recalculate (shares)
│   ├── members.ts           # GET /members, GET /me, PATCH /me
│   └── shares.ts            # GET/settle/unsettle/recalculate monthly share
├── components/
│   ├── App.tsx              # ← entry
│   ├── BalanceSummary.tsx   # monthly balance panel — settle + reopen buttons
│   ├── ConfirmationModal.tsx
│   ├── ExpenseContent.tsx   # orchestrates BalanceSummary + ExpenseList
│   ├── ExpenseForm.tsx      # create/edit expense — all split types
│   ├── ExpenseHeader.tsx
│   ├── ExpenseList.tsx      # sortable table + edit/delete per row
│   ├── FormModal.tsx
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

interface MonthlyBalanceResponse {
  year: number;
  month: number;
  expenses: ExpenseResponse[];
  balances: Record<string, number>;   // memberId → float
  isSettled: boolean;
}
```

### Shares endpoints

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/shares/{year}/{month}` | fetch monthly data |
| `POST` | `/shares/settle/{year}/{month}` | close month, create balancing expenses |
| `POST` | `/shares/unsettle/{year}/{month}` | reopen month, delete balancing expenses |
| `POST` | `/shares/recalculate/{year}/{month}` | recalculate balances from current expenses |

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

The following backend changes are already reflected in this frontend as of 2026-05-07:

- **Bearer token** added to all `fetch` calls (`updateExpense`, `deleteExpense`, `settleMonthlyBalance`, `getMonthlyExpenses`, `getMonthlyBalance`, `settleMonthlyShare`, `recalculateMonthlyShare`).
- **`unsettleMonthlyShare`** added to `src/api/shares.ts` — calls `POST /shares/unsettle/{year}/{month}`.
- **Reopen Month button** in `BalanceSummary.tsx` — shown when `isSettled = true`, triggers a confirmation modal before calling unsettle.
- **`SplitStrategy` type** extended with `type: 'exact'`, `amounts`, and `participantIds` in `src/types/expense.ts`.
- **Exact amounts UI** in `ExpenseForm.tsx` — shown when split type is "Exact amounts"; per-member amount inputs.
- **Exact / participantIds display** in `ExpenseList.tsx` — renders correctly for all three split types.
- **Categories are dynamic** — loaded from `GET /categories/with-emojis`. No hardcoded list. The rename of `compras` → `supermercado` and the addition of `viajes` / `salud` are handled by the backend.
