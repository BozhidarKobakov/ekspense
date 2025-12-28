
export type AccountName = string;

export type CategoryName =
  | 'Food'
  | 'Banking'
  | 'Transport'
  | 'Bills'
  | 'Car'
  | 'Entertainment'
  | 'Household'
  | 'Gifts'
  | 'Salary'
  | 'Transfer'
  | 'Income'
  | 'Other';

export interface Transaction {
  id: string;
  date: Date; // Stored as object, formatted on render
  description: string;
  fromAccount: AccountName;
  toAccount: AccountName;
  amount: number;
  category: CategoryName | string;

}

export interface AccountSummary {
  name: AccountName;
  type: 'fiat' | 'savings' | 'cash' | 'other';
  currency: string;
}

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
