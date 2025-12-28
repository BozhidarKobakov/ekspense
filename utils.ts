import { MONTH_NAMES } from './types';

// Format: "06-Nov-2025"
export const formatDateColumn = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Format: "Nov-2025"
export const formatMonthColumn = (date: Date): string => {
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${month}-${year}`;
};

export const parseDateFromStr = (str: string): Date => {
  // Simple parser assuming input is YYYY-MM-DD from HTML input
  return new Date(str);
}

export const clearLocalData = () => {
  localStorage.removeItem('ekspence_transactions');
  localStorage.removeItem('ekspence_accounts');
  localStorage.removeItem('ekspence_expense_categories');
  localStorage.removeItem('ekspence_income_categories');
};