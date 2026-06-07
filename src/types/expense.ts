export interface Category {
  name: string;
}

export type PaymentType = 'debit' | 'credit';

export interface SplitStrategy {
  type: 'equal' | 'percentage' | 'exact';
  percentages?: Record<string, number> | null;
  participantIds?: number[] | null;
  amounts?: Record<string, number> | null;
}

export interface ExpenseCreate {
  description: string;
  amount: number;
  date: string;
  category: Category;
  payerId: number;
  paymentType: PaymentType;
  installments: number;
  splitStrategy: SplitStrategy;
}

export interface ExpenseResponse extends Omit<ExpenseCreate, 'category'> {
  id: number;
  category: string;
  installmentNo: number;
  parentExpenseId?: number | null;
  recurringTemplateId?: number | null;
}

export interface RecurringGroupExpenseCreate {
  description: string;
  amount: number;
  category: string;
  payerId: number;
  paymentType: 'debit' | 'credit';
  splitStrategy: SplitStrategy;
  startYear: number;
  startMonth: number;
}

export interface RecurringGroupExpenseUpdate {
  description?: string;
  amount?: number;
  category?: string;
  payerId?: number;
  paymentType?: 'debit' | 'credit';
  splitStrategy?: SplitStrategy;
  startYear?: number;
  startMonth?: number;
  active?: boolean;
}

export interface RecurringGroupExpenseResponse extends RecurringGroupExpenseCreate {
  id: number;
  groupId: number;
  active: boolean;
}

export interface CategoryWithEmoji extends Category {
  emoji: string;
}

export interface Member {
  id: number;
  name: string;
  telephone: string;
}

export interface DebtTransfer {
  fromMemberId: number;
  toMemberId: number;
  amount: number;
}

export interface MonthlyBalanceResponse {
  year: number;
  month: number;
  expenses: ExpenseResponse[];
  balances: Record<string, number>;
  isSettled: boolean;
  transfers: DebtTransfer[];
}

export interface GroupMember {
  memberId: number;
  name: string;
  email?: string | null;
  telephone?: string | null;
  isStub?: boolean;
  joinedAt?: string | null;
}

export type InvitationChannel = 'email' | 'phone';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Invitation {
  id: number;
  groupId: number;
  groupName: string;
  inviterName: string;
  channel: InvitationChannel;
  target: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  shareUrl: string;
}

export interface InvitationResolveResponse {
  groupName: string;
  inviterName: string;
  knownName?: string | null;
  knownEmail?: string | null;
  knownPhone?: string | null;
  requiresEmail: boolean;
  requiresPassword: boolean;
  isExistingMember: boolean;
  status: InvitationStatus;
}

export interface GroupJoinLink {
  token: string;
  url: string;
  createdAt: string;
}

export interface GroupJoinResolveResponse {
  groupName: string;
  inviterName?: string | null;
}

export type GroupStatus = 'active' | 'closed' | 'deleted';
export type GroupType = 'regular' | 'personal';

export interface Group {
  id: number;
  name: string;
  status: GroupStatus;
  groupType: GroupType;
  createdAt?: string | null;
  members: GroupMember[];
}

// Personal income types
export interface RecurringIncomeResponse {
  id: number;
  ownerMemberId: number;
  personalGroupId: number;
  label: string;
  amount: number;
  active: boolean;
  startYear?: number | null;
  startMonth?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface IncomeInstanceResponse {
  id: number;
  personalGroupId: number;
  ownerMemberId: number;
  year: number;
  month: number;
  source: 'recurring' | 'variable';
  recurringIncomeId?: number | null;
  label: string;
  amount: number;
}

export interface GroupBalanceItem {
  sourceGroupId: number;
  sourceGroupName: string;
  netBalance: number;   // positive = creditor (will receive), negative = debtor (will pay)
  isSettled: boolean;
}

export interface MirroredShareItem {
  sourceGroupId: number;
  sourceGroupName: string;
  sourceExpenseId: number;
  description: string;
  category: string;
  date: string;
  shareAmount: number;
  payerAmount: number;  // full expense amount paid by owner (0 if someone else paid)
  status: 'pending' | 'realized';
  installmentNo: number;
  installments: number;
  payerId: number;
  payerName: string;
  isRecurring: boolean;
}

export interface PersonalLedgerResponse {
  year: number;
  month: number;
  totalIncome: number;
  incomes: IncomeInstanceResponse[];
  totalPersonalExpenses: number;
  personalExpenses: ExpenseResponse[];
  totalSharesPending: number;
  totalSharesRealized: number;
  mirroredShares: MirroredShareItem[];
  recurringPersonalExpenses: RecurringPersonalExpenseInstanceResponse[];
  groupBalances: GroupBalanceItem[];
  totalPaidAsPayerUnsettled: number;
  projectedBalance: number;
  realizedBalance: number;
  currentBalance: number;
  pendingSettlementsTotal: number;
}

export interface RecurringIncomeCreate {
  label: string;
  amount: number;
  startYear: number;
  startMonth: number;
}

export interface RecurringIncomeUpdate {
  label?: string;
  amount?: number;
  active?: boolean;
}

export interface VariableIncomeCreate {
  year: number;
  month: number;
  label: string;
  amount: number;
}

export interface VariableIncomeUpdate {
  label?: string;
  amount?: number;
}

export interface RecurringPersonalExpenseCreate {
  label: string;
  amount: number;
  categoryName: string;
  startYear?: number;
  startMonth?: number;
}

export interface RecurringPersonalExpenseUpdate {
  label?: string;
  amount?: number;
  categoryName?: string;
  active?: boolean;
}

export interface RecurringPersonalExpenseResponse {
  id: number;
  personalGroupId: number;
  ownerMemberId: number;
  label: string;
  amount: number;
  categoryName: string;
  active: boolean;
  startYear?: number | null;
  startMonth?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RecurringPersonalExpenseInstanceResponse {
  id: number;
  personalGroupId: number;
  recurringExpenseId: number;
  year: number;
  month: number;
  label: string;
  amount: number;
  categoryName: string;
}