# Jirens Frontend Redesign — Design Spec

**Date:** 2026-05-27  
**Status:** Approved  
**Scope:** Full visual redesign of `shared_expense_front`. No backend changes. No feature removals. All existing API calls, hooks, types, and business logic are preserved.

---

## 1. Goals

- Replace the current inconsistent MUI + Tailwind mix with a single coherent design system
- Introduce a professional, go-to-market-ready UI using Tailwind CSS + shadcn/ui
- Add a public marketing landing page
- Add a light/dark mode toggle
- Mock Google sign-in on the login page
- Redesign in-app navigation (remove the current top-right dropdown menu)

---

## 2. Tech Stack Changes

### Remove
- `@mui/material`
- `@mui/icons-material`
- `@emotion/react`
- `@emotion/styled`

### Add
- `shadcn/ui` (components copied into `src/components/ui/` via CLI — not a runtime dependency)
  - Components needed: `Button`, `Input`, `Label`, `Dialog`, `Sheet`, `DropdownMenu`, `Select`, `Badge`, `Skeleton`, `Separator`, `Sonner` (toasts)
- `tailwindcss-animate`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react` — already installed ✓

### Font
Inter loaded via Google Fonts in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```
Tailwind config: `fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }`

### Dark Mode
Tailwind `darkMode: 'class'` strategy. A toggle button in the sidebar footer writes `'dark'` to `document.documentElement.classList` and persists the preference in `localStorage('theme')`. No React context required — every dark style is a `dark:` Tailwind variant.

---

## 3. Color Palette

| Token | Hex | Usage |
|---|---|---|
| Zenith Lavender | `#CCBBDD` | Primary brand, buttons, active states, sidebar accent |
| Pride Crimson | `#EE3333` | Destructive actions, negative balances |
| Stone Charcoal | `#777777` | Secondary text, muted labels |
| Balanced Green | `#4CAF50` | Settle Up, positive balances, success states |
| Alabaster White | `#F5F5F5` | Page background (light mode) |
| Dark Sidebar | `#1E1B2E` | Sidebar background (dark mode), landing hero |
| Dark Surface | `#111827` | Page background (dark mode) |
| Dark Card | `#1F2937` | Card background (dark mode) |

Tailwind `tailwind.config.js` extends `colors` with these tokens so they can be used as `bg-brand`, `text-brand`, etc.

---

## 4. Typography

- **Font**: Inter
- **Headings**: `font-bold` to `font-extrabold`, `tracking-tight`
- **Body**: `font-normal`, `text-sm` / `text-base`
- **Labels / section headers**: `text-xs font-medium uppercase tracking-widest text-muted`
- **Monospaced amounts**: `font-semibold tabular-nums`

---

## 5. Page Inventory

### 5.1 Landing Page (public) — `/`

Unauthenticated users land here. Authenticated users are redirected to `/groups` (or their last group).

**Sections (single scroll):**

1. **Navbar** — fixed top, `#1E1B2E` background bleeding from hero
   - Left: ✦ icon + "Jirens" wordmark
   - Right: "Sign in" (ghost button) + "Get started" (lavender filled button)

2. **Hero** — dark `#1E1B2E` background
   - Pill badge: `✦ Now with WhatsApp AI`
   - H1: bold, large, tight tracking (e.g. "Shared expenses, finally simple.")
   - Subtitle: one line description
   - Two CTAs: "Get started free" (lavender) + "Learn more ↓" (ghost)
   - Transitions into the white features section below via a subtle gradient or angled cut

3. **Features** — white/`#F5F5F5` background
   - 4-column grid of feature cards (icon + title + one-line description):
     - 💬 WhatsApp bot — "Add expenses by chat, no app needed"
     - ⚖️ Monthly settle — "One-click balancing at end of month"
     - 📸 Receipt scan — "Photo to expense via WhatsApp"
     - 👥 Multiple groups — "Home, trips, friends — all separate"

4. **How it works** — 3 numbered steps, horizontal on desktop / stacked on mobile
   - 1. Add an expense (web or WhatsApp)
   - 2. Splits are calculated automatically
   - 3. Settle up at month end with one click

5. **Footer** — dark, simple
   - ✦ Jirens · "Shared Expenses" tagline
   - Links: About, Privacy, Contact

---

### 5.2 Login / Register — `/login`

Centered card on `#F5F5F5` background. No MUI — pure Tailwind + shadcn `Input`, `Button`, `Label`.

**Layout:**
- ✦ icon + "Jirens" + "Shared Expenses" tagline at top of card
- **Google sign-in button**: white button with Google SVG logo + "Continue with Google" — on click, fires a `Sonner` toast: "Google login coming soon 🚀" (mock only, no OAuth wired)
- Divider: `── or ──`
- Login form: Email, Password, "Sign in" button (lavender)
- Register form (toggled): Full name, Email, WhatsApp phone (optional), Password, Confirm password, "Create account" button
- Toggle link: "Don't have an account? Create one" / "Already have an account? Sign in"

**Auth flow unchanged**: JWT stored in `localStorage('token')`, axios default header set on login.

---

### 5.3 Authenticated App Shell

Two-panel layout: fixed sidebar + scrollable content area.

#### Sidebar (220px, fixed left)

**Header:**
```
[✦]  Jirens
     SHARED EXPENSES
```
- ✦ in a `#CCBBDD` rounded square (28×28px)
- "Jirens" in `font-extrabold text-lg tracking-tight`
- "SHARED EXPENSES" in `text-[10px] font-medium uppercase tracking-widest text-muted`
- Separated from group list by a `Separator`

**Groups section:**
- Section label: `GROUPS` (muted uppercase)
- Each group: emoji + name, clickable row
- Active group: lavender left-border accent (`border-l-2 border-brand bg-brand/10`)
- "+ New group" link at bottom of list (lavender text)

**Footer:**
- User avatar (initials in lavender circle) + name
- 🌙/☀️ theme toggle button (right side)

**Light mode**: white background, `#E5E7EB` right border  
**Dark mode**: `#1E1B2E` background, `rgba(255,255,255,0.07)` right border

#### Content area

Right of sidebar, `#F5F5F5` (light) / `#111827` (dark) background.

When no group is selected: centered empty state with "Select or create a group" prompt.

When a group is selected: tab bar + tab content (see §5.4).

---

### 5.4 Group View

#### Tab Bar

```
[ Expenses ]  [ Members ]  [ Settings ]
```
- Tabs sit at top of content area, below the content header
- Active tab: `text-brand border-b-2 border-brand font-semibold`
- Inactive: `text-muted hover:text-foreground`

#### Expenses Tab

**Month picker**: `← May 2026 →` — centered, chevron buttons on each side

**Balance panel** (card, above expense list):
- Row of member balances: green for positive, red for negative, `font-semibold tabular-nums`
- "Settle Up" button (green outlined) — triggers confirmation, then calls settle endpoint
- "Reopen" button (shown when `isSettled === true`) — triggers confirmation modal, calls unsettle
- When settled: green "Settled ✓" badge on the panel

**Expense list** (bordered card, `divide-y`):
- Each row:
  - Left: category emoji in a soft-colored rounded square (8×8, `rounded-lg`)
  - Middle: description (`font-medium`) + payer name + date (`text-muted text-xs`)
  - Right: amount (`font-semibold tabular-nums`) + **badge chips** (split type + category)
  - Row actions on hover: edit pencil icon + delete trash icon (right side)
- **Badge chips** (from Option A — preserved as requested):
  - Split type chip: colored background matching split type (equal = lavender, percentage = amber, exact = blue)
  - Category chip: muted background
- **Sort & filter controls** (preserved): sort by date/amount/payer, filter by category/payer — rendered as a small toolbar above the list

**Action buttons** (top-right of expenses section):
- "+ Add Expense" (lavender filled)
- "+ Transfer" (outlined)

**Add/Edit Expense Modal** (shadcn `Dialog`):
- All existing fields preserved: description, amount, date, category (`Select`), payer (`Select`), payment type (debit/credit toggle), installments, split strategy (equal / percentage / exact with per-member inputs)
- Duplicate detection: if similar expense found, replaces the dialog content with a warning + "Create anyway" / "Cancel" (no second modal layer)
- Error state shown inline inside the dialog

---

#### Members Tab

- Member list: avatar chip (initials) + name + email or phone (muted)
- Stub members (pending invites) shown with a "Pending" badge
- "Invite member" button → `Dialog` with channel choice (Email / WhatsApp) + input
- Pending invitations list with revoke (`×`) button per row
- "Share join link" row: URL display + copy-to-clipboard button + "Rotate" link
- "Leave group" button (red, bottom of page) — `Dialog` confirmation required

---

#### Settings Tab

- Group name: inline editable field with "Save" button
- Join link: display + copy + rotate (same as Members tab, deduplicated into a shared component)
- Danger zone: Leave group (same button as Members tab — one source of truth, `GroupDangerZone` component)

---

### 5.5 Profile Page — `/profile`

- Name (editable)
- Email (editable)
- WhatsApp phone (editable, optional)
- Change password section (current + new + confirm)
- Notification preference: segmented control (WhatsApp / Email / None)
- Save button per section or one global Save

---

### 5.6 Public Pages (redesigned)

Both pages share a centered card layout on `#F5F5F5` background with the ✦ Jirens header — no sidebar.

**`/invite/:token` — InvitationLanding:**
- Shows group name + inviter name from resolved token
- If existing user: "Sign in to accept" → login form inline
- If new user: registration form (name, password) → auto-accept on submit

**`/join/:token` — GroupJoinLanding:**
- Shows group name from resolved token
- Registration form: name, email, password, phone (optional) → register + join in one step

---

## 6. Component Map

| Old (MUI) | New (shadcn/Tailwind) |
|---|---|
| `<Button variant="contained">` | `<Button>` (shadcn, lavender via `bg-brand`) |
| `<TextField>` | `<Input>` + `<Label>` (shadcn) |
| `<Dialog>` / `<Modal>` | `<Dialog>` (shadcn) |
| `<Select>` | `<Select>` (shadcn) |
| `<AppBar>` / `<Toolbar>` | Custom Tailwind sidebar header |
| `<Menu>` / `<MenuItem>` | `<DropdownMenu>` (shadcn) |
| `<Chip>` | `<Badge>` (shadcn) or custom `span` with Tailwind |
| `<CircularProgress>` | `<Skeleton>` (shadcn) or Tailwind `animate-spin` |
| Custom `Toast.tsx` | `<Sonner>` (shadcn toast) |
| `<Alert>` | Tailwind alert `div` with color variants |

---

## 7. Routing (unchanged)

| Path | Component | Auth |
|---|---|---|
| `/` | `LandingPage` | public (redirects to `/groups` if authenticated) |
| `/login` | `Login` | public |
| `/invite/:token` | `InvitationLanding` | public |
| `/join/:token` | `GroupJoinLanding` | public |
| `/groups` | `GroupSelector` (inside app shell) | required |
| `/profile` | `Profile` (inside app shell) | required |
| `/groups/:groupId` | `GroupLayout` → `ExpensesDashboard` | required |
| `/groups/:groupId/members` | `GroupLayout` → `GroupMembers` | required |
| `/groups/:groupId/settings` | `GroupLayout` → `GroupSettings` | required |

`GroupLayout` now renders the sidebar + tab bar. Individual tab routes map to the same paths as today.

---

## 8. Features Preserved (explicit checklist)

- [ ] Login / Register (email + password)
- [ ] Google sign-in (mocked with toast)
- [ ] Create group / list groups
- [ ] Add expense (all split types: equal, percentage, exact)
- [ ] Partial equal split (`participantIds`)
- [ ] Credit card installments (N rows)
- [ ] Edit expense (parent only for installments)
- [ ] Delete expense (cascades children)
- [ ] Duplicate expense detection
- [ ] Add money transfer (prestamo category)
- [ ] Month picker navigation
- [ ] Sort expenses (date / amount / payer)
- [ ] Filter expenses (category / payer)
- [ ] Balance panel per month
- [ ] Settle month (creates balancing expenses)
- [ ] Reopen / unsettle month
- [ ] Recalculate balances
- [ ] Invite member (email or WhatsApp)
- [ ] Pending invitations list + revoke
- [ ] Share group join link + rotate
- [ ] Leave group (blocked if outstanding balance)
- [ ] Member list
- [ ] Rename group
- [ ] Profile edit (name, email, phone, notification preference)
- [ ] Change password
- [ ] PDF export of expense list (existing `utils/export.ts` preserved, button kept in expense header)
- [ ] Light / dark mode toggle (new)
- [ ] Accept invitation landing page
- [ ] Register via join link landing page

---

## 9. What Is NOT in Scope

- Backend changes of any kind
- New API endpoints
- Mobile responsive sidebar (deferred — Sheet component is installed and ready for a follow-up sprint)
- Real Google OAuth integration (mocked only)
- PDF export redesign (existing `export.ts` util stays, button preserved in UI)
