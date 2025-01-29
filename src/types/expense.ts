export interface Category {
  name: string;
}

export type PaymentType = 'debit' | 'credit';

export interface SplitStrategy {
  type: 'equal' | 'percentage';
  percentages?: Record<string, number> | null;
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
}

export interface CategoryWithEmoji extends Category {
  emoji: string;
}

export interface Member {
  id: number;
  name: string;
  telephone: string;
}

export interface MonthlyBalanceResponse {
  year: number;
  month: number;
  expenses: ExpenseResponse[];
  balances: Record<string, number>;
  isSettled: boolean;
}