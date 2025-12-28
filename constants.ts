
import { Transaction, AccountSummary } from './types';

export const INITIAL_ACCOUNTS: AccountSummary[] = [
  { name: 'DSK', type: 'fiat', currency: 'BGN' },
  { name: 'DSK Savings', type: 'savings', currency: 'BGN' },
  { name: 'Revolut', type: 'fiat', currency: 'BGN' },
  { name: 'Apartment', type: 'other', currency: 'BGN' },
  { name: 'Cash', type: 'cash', currency: 'BGN' },
  { name: 'DSK USD', type: 'fiat', currency: 'USD' },
  { name: 'Nastya', type: 'other', currency: 'BGN' },
];

export const EXPENSE_CATEGORIES = [
  'Food', 'Banking', 'Transport', 'Bills', 'Car', 'Entertainment', 'Household', 'Gifts', 'Other'
];

export const INCOME_CATEGORIES = [
  'Salary', 'Income', 'Bonus', 'Gifts', 'Freelance', 'Investment', 'Other'
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // --- HISTORICAL / INITIAL ---
  { id: 't1', date: new Date('2020-01-01'), description: 'Initial Deposit', fromAccount: 'Bozhidar', toAccount: 'DSK Savings', amount: 30915.95, category: 'Income' },

  // --- NOVEMBER 2025 ---
  // Income
  { id: 't2', date: new Date('2025-11-03'), description: 'Babushka money', fromAccount: 'Babushka', toAccount: 'Apartment', amount: 600.00, category: 'Income' },
  { id: 't3', date: new Date('2025-11-03'), description: 'Babushka money', fromAccount: 'Babushka', toAccount: 'Apartment', amount: 200.00, category: 'Income' },
  { id: 't4', date: new Date('2025-11-06'), description: 'Tek Salary', fromAccount: 'TeKnowledge', toAccount: 'DSK', amount: 2083.14, category: 'Salary' },
  { id: 't5', date: new Date('2025-11-08'), description: 'Sveta Money', fromAccount: 'Sveta', toAccount: 'Apartment', amount: 50.00, category: 'Income' },
  { id: 't6', date: new Date('2025-11-28'), description: 'Cash Money in Box', fromAccount: 'Bozhidar', toAccount: 'Cash', amount: 6250.00, category: 'Income' },

  // DSK External Expenses Nov
  { id: 't7', date: new Date('2025-11-06'), description: 'Fee', fromAccount: 'DSK', toAccount: 'DSK Bank', amount: 5.87, category: 'Banking' },
  { id: 't8', date: new Date('2025-11-09'), description: 'Public Transport', fromAccount: 'DSK', toAccount: 'ЦГМ', amount: 3.20, category: 'Transport' },
  { id: 't9', date: new Date('2025-11-10'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'Fantastico', amount: 7.80, category: 'Food' },
  { id: 't10', date: new Date('2025-11-10'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'T Market', amount: 21.59, category: 'Food' },
  { id: 't11', date: new Date('2025-11-12'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'T Market', amount: 4.04, category: 'Food' },
  { id: 't12', date: new Date('2025-11-13'), description: 'Rent', fromAccount: 'DSK', toAccount: 'Albena Dush', amount: 400.00, category: 'Bills' },
  { id: 't13', date: new Date('2025-11-13'), description: 'Internet', fromAccount: 'DSK', toAccount: 'Albena Dush', amount: 12.00, category: 'Bills' },
  { id: 't14', date: new Date('2025-11-13'), description: 'Fee', fromAccount: 'DSK', toAccount: 'DSK Bank', amount: 0.70, category: 'Banking' },
  { id: 't15', date: new Date('2025-11-14'), description: 'Insurance', fromAccount: 'DSK', toAccount: 'Lev Ins', amount: 114.04, category: 'Car' },
  { id: 't16', date: new Date('2025-11-14'), description: 'Gas', fromAccount: 'DSK', toAccount: 'EKO', amount: 21.57, category: 'Car' },
  { id: 't17', date: new Date('2025-11-17'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'T Market', amount: 5.59, category: 'Food' },
  { id: 't18', date: new Date('2025-11-18'), description: 'Electricity', fromAccount: 'DSK', toAccount: 'ePay', amount: 47.14, category: 'Bills' },
  { id: 't19', date: new Date('2025-11-18'), description: 'Water', fromAccount: 'DSK', toAccount: 'ePay', amount: 7.39, category: 'Bills' },
  { id: 't20', date: new Date('2025-11-20'), description: 'Online Shopping', fromAccount: 'DSK', toAccount: 'Temu', amount: 33.94, category: 'Entertainment' },
  { id: 't21', date: new Date('2025-11-22'), description: 'Eating Out', fromAccount: 'DSK', toAccount: 'Pizza Lab', amount: 20.70, category: 'Food' },
  { id: 't22', date: new Date('2025-11-22'), description: 'Eating Out', fromAccount: 'DSK', toAccount: 'Christmas Market', amount: 16.00, category: 'Food' },
  { id: 't23', date: new Date('2025-11-23'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'T Market', amount: 22.50, category: 'Food' },
  { id: 't24', date: new Date('2025-11-26'), description: 'Voyo', fromAccount: 'DSK', toAccount: 'Voyo', amount: 8.00, category: 'Bills' },
  { id: 't25', date: new Date('2025-11-26'), description: 'Bed Sheets', fromAccount: 'DSK', toAccount: 'Jysk', amount: 152.00, category: 'Household' },
  { id: 't26', date: new Date('2025-11-27'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'Grosh', amount: 1.45, category: 'Food' },
  { id: 't27', date: new Date('2025-11-30'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'Billa', amount: 4.54, category: 'Food' },
  { id: 't28', date: new Date('2025-11-30'), description: 'Sladkarnitsa', fromAccount: 'DSK', toAccount: 'Sladkarnitsa', amount: 9.40, category: 'Food' },
  { id: 't29', date: new Date('2025-11-30'), description: 'Fee', fromAccount: 'DSK', toAccount: 'DSK Bank', amount: 2.99, category: 'Banking' },
  { id: 't30', date: new Date('2025-11-30'), description: "Mother's Phone", fromAccount: 'DSK', toAccount: 'A1', amount: 22.97, category: 'Bills' },

  // Revolut External Expenses Nov
  { id: 't31', date: new Date('2025-11-07'), description: 'Supermarket', fromAccount: 'Revolut', toAccount: 'Family Market', amount: 6.52, category: 'Food' },
  { id: 't32', date: new Date('2025-11-07'), description: 'Supermarket', fromAccount: 'Revolut', toAccount: 'Linella', amount: 5.28, category: 'Food' },
  { id: 't33', date: new Date('2025-11-08'), description: 'Supermarket', fromAccount: 'Revolut', toAccount: 'Linella', amount: 32.83, category: 'Food' },
  { id: 't34', date: new Date('2025-11-12'), description: 'Lunch', fromAccount: 'Revolut', toAccount: 'Incubator', amount: 19.62, category: 'Food' },
  { id: 't35', date: new Date('2025-11-20'), description: 'Supermarket', fromAccount: 'Revolut', toAccount: 'T Market', amount: 4.88, category: 'Food' },
  { id: 't36', date: new Date('2025-11-24'), description: 'Tek Market', fromAccount: 'Revolut', toAccount: 'Tek Market', amount: 1.56, category: 'Food' },
  { id: 't37', date: new Date('2025-11-24'), description: 'YouTube Premium', fromAccount: 'Revolut', toAccount: 'YouTube', amount: 4.17, category: 'Bills' },
  { id: 't38', date: new Date('2025-11-28'), description: 'Transfer', fromAccount: 'Revolut', toAccount: 'Transfr', amount: 0.14, category: 'Entertainment' },

  // Transfers Nov (Calculated only once)
  { id: 't39', date: new Date('2025-11-07'), description: 'DSK --> Rev', fromAccount: 'DSK', toAccount: 'Revolut', amount: 25.00, category: 'Transfer' },
  { id: 't40', date: new Date('2025-11-08'), description: 'DSK --> Rev', fromAccount: 'DSK', toAccount: 'Revolut', amount: 25.00, category: 'Transfer' },
  { id: 't41', date: new Date('2025-11-12'), description: 'Transfer', fromAccount: 'DSK', toAccount: 'Revolut', amount: 25.00, category: 'Transfer' },

  // --- DECEMBER 2025 ---
  // Income
  { id: 't42', date: new Date('2025-12-01'), description: 'USD from DSK', fromAccount: 'Bozhidar', toAccount: 'DSK USD', amount: 1460.00, category: 'Income' },
  { id: 't43', date: new Date('2025-12-03'), description: 'Tek Salary', fromAccount: 'TeKnowledge', toAccount: 'DSK', amount: 2083.13, category: 'Salary' },
  { id: 't44', date: new Date('2025-12-04'), description: 'Nastya Money', fromAccount: 'Bozhidar', toAccount: 'Nastya', amount: 10900.00, category: 'Income' },
  { id: 't45', date: new Date('2025-12-22'), description: 'Deposit (Nastya)', fromAccount: 'Bozhidar', toAccount: 'Nastya', amount: 4300.00, category: 'Income' },

  // DSK External Expenses Dec
  { id: 't46', date: new Date('2025-12-02'), description: 'TekMarket', fromAccount: 'DSK', toAccount: 'Tek Market', amount: 2.09, category: 'Food' },
  { id: 't47', date: new Date('2025-12-02'), description: 'TekMarket', fromAccount: 'DSK', toAccount: 'Tek Market', amount: 1.64, category: 'Food' },
  { id: 't48', date: new Date('2025-12-04'), description: '7 Days', fromAccount: 'DSK', toAccount: 'Tek Market', amount: 1.87, category: 'Food' },
  { id: 't49', date: new Date('2025-12-04'), description: 'lunch', fromAccount: 'DSK', toAccount: 'TheMall', amount: 16.70, category: 'Food' },
  { id: 't50', date: new Date('2025-12-05'), description: 'Nastya Graduation', fromAccount: 'DSK', toAccount: 'Nastya Grad', amount: 130.30, category: 'Gifts' },
  { id: 't51', date: new Date('2025-12-05'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'T Market', amount: 5.76, category: 'Food' },
  { id: 't52', date: new Date('2025-12-07'), description: 'IKEA Shopping', fromAccount: 'DSK', toAccount: 'IKEA', amount: 11.28, category: 'Household' },
  { id: 't53', date: new Date('2025-12-07'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'T Market', amount: 6.68, category: 'Food' },
  { id: 't54', date: new Date('2025-12-10'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'T Market', amount: 10.11, category: 'Food' },
  { id: 't55', date: new Date('2025-12-11'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'Billa', amount: 4.86, category: 'Food' },
  { id: 't56', date: new Date('2025-12-11'), description: 'Electronics', fromAccount: 'DSK', toAccount: 'Technomarket', amount: 8.09, category: 'Household' },
  { id: 't57', date: new Date('2025-12-12'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'T Market', amount: 4.53, category: 'Food' },
  { id: 't58', date: new Date('2025-12-12'), description: 'Christmas Decor', fromAccount: 'DSK', toAccount: 'Jumbo', amount: 20.69, category: 'Household' },
  { id: 't59', date: new Date('2025-12-14'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'Lidl', amount: 73.51, category: 'Food' },
  { id: 't60', date: new Date('2025-12-15'), description: 'Drink', fromAccount: 'DSK', toAccount: 'Tek Market', amount: 2.09, category: 'Food' },
  { id: 't61', date: new Date('2025-12-15'), description: 'Drink', fromAccount: 'DSK', toAccount: 'T Market', amount: 4.73, category: 'Food' },
  { id: 't62', date: new Date('2025-12-16'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'T Market', amount: 6.77, category: 'Food' },
  { id: 't63', date: new Date('2025-12-17'), description: 'Drink', fromAccount: 'DSK', toAccount: 'Tek Market', amount: 1.89, category: 'Food' },
  { id: 't64', date: new Date('2025-12-18'), description: 'Drink', fromAccount: 'DSK', toAccount: 'Tek Market', amount: 1.89, category: 'Food' },
  { id: 't65', date: new Date('2025-12-18'), description: 'Temu iPhone Shopping', fromAccount: 'DSK', toAccount: 'Temu', amount: 27.31, category: 'Entertainment' },
  { id: 't66', date: new Date('2025-12-19'), description: 'Rent', fromAccount: 'DSK', toAccount: 'Albena Dush', amount: 400.00, category: 'Bills' },
  { id: 't67', date: new Date('2025-12-19'), description: 'Internet', fromAccount: 'DSK', toAccount: 'Albena Dush', amount: 12.70, category: 'Bills' },
  { id: 't68', date: new Date('2025-12-19'), description: 'Help Cleaning Nikola', fromAccount: 'DSK', toAccount: 'ЦГМ', amount: 1.60, category: 'Transport' },
  { id: 't69', date: new Date('2025-12-20'), description: 'Thermo', fromAccount: 'DSK', toAccount: 'ЦГМ', amount: 1.00, category: 'Transport' },
  { id: 't70', date: new Date('2025-12-21'), description: 'Supermarket', fromAccount: 'DSK', toAccount: 'Fantastico', amount: 20.47, category: 'Food' },
  { id: 't71', date: new Date('2025-12-22'), description: 'Google AI Plus', fromAccount: 'DSK', toAccount: 'Google', amount: 5.57, category: 'Entertainment' },

  // Other External Dec
  { id: 't72', date: new Date('2025-12-03'), description: 'Fee', fromAccount: 'DSK Savings', toAccount: 'DSK Bank', amount: 3.91, category: 'Banking' },
  { id: 't73', date: new Date('2025-12-07'), description: 'iPhone Credit', fromAccount: 'Cash', toAccount: 'Technomarket', amount: 211.58, category: 'Entertainment' },
  { id: 't74', date: new Date('2025-12-08'), description: 'Vaccum Cleaner', fromAccount: 'Nastya', toAccount: 'Dreame', amount: 350.00, category: 'Entertainment' },

  // Transfers Dec (Calculated only once)
  { id: 't75', date: new Date('2025-12-03'), description: 'Transfer (to Savings)', fromAccount: 'DSK', toAccount: 'DSK Savings', amount: 1058.99, category: 'Transfer' },
  { id: 't76', date: new Date('2025-12-21'), description: 'Deposit', fromAccount: 'Bozhidar', toAccount: 'Nastya', amount: 150.00, category: 'Transfer' },
];
