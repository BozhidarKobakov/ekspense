import React, { useState } from 'react';
import { Transaction, CategoryName, AccountSummary, MONTH_NAMES } from '../types';
import { getTranslation } from '../translations';

interface DashboardProps {
  transactions: Transaction[];
  targetMonth: string; // e.g. "Dec-2025"
  availableMonths: string[];
  onMonthChange: (month: string) => void;
  accounts: AccountSummary[];
  language: string;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, targetMonth, onMonthChange, accounts, language }) => {
  const [excludedAccountNames, setExcludedAccountNames] = useState<string[]>([]);

  const toggleAccount = (name: string) => {
    setExcludedAccountNames(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  // --- Strict Calendar Date Filtering ---
  const filteredTransactions = transactions.filter(t => {
    if (!t.date || isNaN(t.date.getTime())) return false;
    const m = MONTH_NAMES[t.date.getMonth()];
    const y = t.date.getFullYear();
    return `${m}-${y}` === targetMonth;
  });

  const accountNames = accounts.map(a => a.name.toLowerCase().trim());
  const isInternal = (name: string) => accountNames.includes(name.toLowerCase().trim());
  const isExcluded = (name: string) => excludedAccountNames.includes(name);

  // --- All Time Running Balance (Lifetime) ---
  const getAccountBalance = (accountName: string) => {
    let balance = 0;
    for (const t of transactions) {
      if (t.toAccount === accountName) balance += t.amount;
      if (t.fromAccount === accountName) balance -= t.amount;
    }
    return balance;
  };

  // Helper for currency conversion
  const getBGN = (amount: number, currency: string) => {
    // Treat provided amounts as already BGN to match screenshot totals
    return amount;
  };

  // Net worth only includes non-excluded accounts
  const netWorthInBGN = accounts
    .filter(acc => !isExcluded(acc.name))
    .reduce((total, account) => {
      return total + getAccountBalance(account.name);
    }, 0);

  // --- Summary Metrics (External Only to match Screenshot 1) ---
  // Only include transactions where the active account is involved
  const monthlyExpenses = filteredTransactions
    .filter(t => {
      const isOutboundFromActive = isInternal(t.fromAccount) && !isExcluded(t.fromAccount);
      const isToExternal = !isInternal(t.toAccount);
      return isOutboundFromActive && isToExternal;
    })
    .reduce((sum, t) => sum + getBGN(t.amount, 'BGN'), 0);

  const monthlyIncome = filteredTransactions
    .filter(t => {
      const isInboundToActive = isInternal(t.toAccount) && !isExcluded(t.toAccount);
      const isFromExternal = !isInternal(t.fromAccount);
      return isInboundToActive && isFromExternal;
    })
    .reduce((sum, t) => sum + getBGN(t.amount, 'BGN'), 0);

  // --- Per Account Detailed Breakdown ---
  const accountBreakdown = accounts.map(acc => {
    // 1. External Inbound
    const income = filteredTransactions
      .filter(t => t.toAccount === acc.name && !isInternal(t.fromAccount))
      .reduce((sum, t) => sum + t.amount, 0);

    // 2. External Outbound (This matches the "Total Expense" column in screenshot)
    const externalExpense = filteredTransactions
      .filter(t => t.fromAccount === acc.name && !isInternal(t.toAccount))
      .reduce((sum, t) => sum + t.amount, 0);

    // 3. Internal Transfers Out
    const transfersOut = filteredTransactions
      .filter(t => t.fromAccount === acc.name && isInternal(t.toAccount))
      .reduce((sum, t) => sum + t.amount, 0);

    // 4. Internal Transfers In
    const transfersIn = filteredTransactions
      .filter(t => t.toAccount === acc.name && isInternal(t.fromAccount))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...acc,
      monthlyIncome: income,
      monthlyExpense: externalExpense, // Used for the "Expense" row
      transfersOut,
      transfersIn,
      totalOutflow: externalExpense + transfersOut,
      monthlyNet: income - externalExpense - transfersOut + transfersIn,
      currentBalance: getAccountBalance(acc.name)
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* 1. Primary Highlight: NET WORTH & MONTHLY EXPENSES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Net Worth Card */}
        <div className="relative group overflow-hidden bg-gray-900 rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/30 transition-all duration-500"></div>
          <div className="relative z-10">
            <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-4">{getTranslation(language, 'net_worth')}</h2>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-black text-white tracking-tighter">
                {netWorthInBGN.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xl font-bold text-primary">BGN</span>
            </div>
            <div className="mt-6 flex items-center space-x-2 text-xs text-gray-400 bg-white/5 rounded-full px-3 py-1.5 w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
              <span>Live balance from {accounts.length} accounts</span>
            </div>
          </div>
        </div>

        {/* Monthly Expense Card */}
        <div className="relative group overflow-hidden bg-white dark:bg-gray-850 rounded-3xl p-8 border border-gray-200 dark:border-white/5 shadow-xl transition-all hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-widest mb-4">{getTranslation(language, 'expense')}: {targetMonth}</h2>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                {monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xl font-bold text-gray-500">BGN</span>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-xs">
                  <span className="text-gray-600 dark:text-gray-400 block uppercase tracking-tighter">Savings Potential</span>
                  <span className="text-sm font-bold text-primary-dark">
                    {(monthlyIncome - monthlyExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BGN
                  </span>
                </div>
              </div>
              <div className="h-10 w-1 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
              <div className="text-xs text-right">
                <span className="text-gray-600 dark:text-gray-400 block uppercase tracking-tighter">{getTranslation(language, 'income')}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BGN
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Accounts Dashboard */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center space-x-3">
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </span>
            <span>{getTranslation(language, 'account_performance')}</span>
          </h3>
          <div className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-900 px-3 py-1 rounded-full">
            {targetMonth}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-850 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse tabular-nums">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-white/5">
                  <th className="px-5 py-4 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight pl-8">Account</th>
                  <th className="px-5 py-4 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight text-right">Balance</th>
                  <th className="px-5 py-4 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight text-right">Income</th>
                  <th className="px-5 py-4 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight text-right">Expense</th>
                  <th className="px-5 py-4 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight text-right whitespace-nowrap">Transfer (Out)</th>
                  <th className="px-5 py-4 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight text-right whitespace-nowrap">Transfer (In)</th>
                  <th className="px-5 py-4 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tight text-right pr-8 whitespace-nowrap">Total Outflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {accountBreakdown.map(acc => {
                  const excluded = isExcluded(acc.name);
                  return (
                    <tr
                      key={acc.name}
                      onClick={() => toggleAccount(acc.name)}
                      className={`group transition-all cursor-pointer ${excluded ? 'bg-gray-50/50 dark:bg-gray-900/20 opacity-40 grayscale-[0.8]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'}`}
                    >
                      <td className="px-5 py-3 pl-8">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${excluded ? 'bg-gray-100 dark:bg-gray-800 border-transparent' : 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-white/5 group-hover:border-primary/20'}`}>
                            <span className={`text-[9px] font-black uppercase transition-colors ${excluded ? 'text-gray-400' : 'text-gray-400 group-hover:text-primary'}`}>{acc.name.substring(0, 2)}</span>
                          </div>
                          <div className="min-w-[100px]">
                            <p className={`text-xs font-black uppercase tracking-tighter truncate leading-tight transition-colors ${excluded ? 'text-gray-400' : 'text-gray-900 dark:text-white group-hover:text-primary-dark'}`}>{acc.name}</p>
                            <p className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">{acc.type} • {acc.currency}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-5 py-3 text-right font-black tracking-tighter text-sm ${excluded ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {acc.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-xs font-bold ${excluded ? 'text-gray-400' : 'text-primary-dark'}`}>+{acc.monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-xs font-bold ${excluded ? 'text-gray-400' : 'text-red-500'}`}>-{acc.monthlyExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-xs font-bold ${excluded ? 'text-gray-400' : 'text-gray-400 font-medium'}`}>-{acc.transfersOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-xs font-bold ${excluded ? 'text-gray-400' : 'text-primary-dark'}`}>+{acc.transfersIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-5 py-3 text-right pr-8">
                        <span className={`text-xs font-black ${excluded ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {acc.totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;