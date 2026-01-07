import React, { useState, useEffect } from 'react';
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

// Circular Progress Ring Component
const ProgressRing = ({ progress, size = 120, strokeWidth = 10, color = '#39fb48' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200 dark:text-gray-800"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
        style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
      />
    </svg>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ transactions, targetMonth, onMonthChange, accounts, language }) => {
  const [excludedAccountNames, setExcludedAccountNames] = useState<string[]>([]);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [customLimitInput, setCustomLimitInput] = useState('');

  // Load custom limit from localStorage
  const [customLimit, setCustomLimit] = useState<number | null>(() => {
    const saved = localStorage.getItem('ekspense_spending_limit');
    return saved ? parseFloat(saved) : null;
  });

  // Save custom limit to localStorage
  useEffect(() => {
    if (customLimit !== null) {
      localStorage.setItem('ekspense_spending_limit', customLimit.toString());
    } else {
      localStorage.removeItem('ekspense_spending_limit');
    }
  }, [customLimit]);

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
    return amount;
  };

  // --- Summary Metrics ---
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

  // --- Safe to Spend Calculation ---
  const autoLimit = monthlyIncome * 0.7; // 70% of income for spending
  const spendingLimit = customLimit !== null ? customLimit : autoLimit;
  const safeToSpend = spendingLimit - monthlyExpenses;
  const isOverspent = safeToSpend < 0;
  const spentPercentage = spendingLimit > 0 ? Math.min((monthlyExpenses / spendingLimit) * 100, 100) : 0;

  // Dynamic ring color based on spending
  const getRingColor = () => {
    if (isOverspent) return '#ef4444'; // Red
    if (spentPercentage > 85) return '#f59e0b'; // Amber warning
    if (spentPercentage > 70) return '#eab308'; // Yellow caution
    return '#39fb48'; // Primary green
  };

  const handleSaveLimit = () => {
    const value = parseFloat(customLimitInput);
    if (!isNaN(value) && value > 0) {
      setCustomLimit(value);
    }
    setIsEditingLimit(false);
    setCustomLimitInput('');
  };

  const handleResetLimit = () => {
    setCustomLimit(null);
    setIsEditingLimit(false);
    setCustomLimitInput('');
  };

  // --- Per Account Detailed Breakdown ---
  const accountBreakdown = accounts.map(acc => {
    const income = filteredTransactions
      .filter(t => t.toAccount === acc.name && !isInternal(t.fromAccount))
      .reduce((sum, t) => sum + t.amount, 0);

    const externalExpense = filteredTransactions
      .filter(t => t.fromAccount === acc.name && !isInternal(t.toAccount))
      .reduce((sum, t) => sum + t.amount, 0);

    const transfersOut = filteredTransactions
      .filter(t => t.fromAccount === acc.name && isInternal(t.toAccount))
      .reduce((sum, t) => sum + t.amount, 0);

    const transfersIn = filteredTransactions
      .filter(t => t.toAccount === acc.name && isInternal(t.fromAccount))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...acc,
      monthlyIncome: income,
      monthlyExpense: externalExpense,
      transfersOut,
      transfersIn,
      totalOutflow: externalExpense + transfersOut,
      monthlyNet: income - externalExpense - transfersOut + transfersIn,
      currentBalance: getAccountBalance(acc.name)
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* SAFE TO SPEND - Hero Card (Mobile First) */}
      <div className="relative group overflow-hidden bg-gray-950 rounded-[2.5rem] p-6 md:p-10 border border-white/10 shadow-2xl">
        {/* Decorative blurs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/30 transition-all duration-500"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -ml-16 -mb-16 group-hover:bg-secondary/20 transition-all duration-500"></div>
        {isOverspent && <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>}

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-start gap-8 md:gap-12">
          {/* Left: Progress Ring */}
          <div className="relative flex-shrink-0">
            <div className="relative">
              <ProgressRing
                progress={spentPercentage}
                size={160}
                strokeWidth={14}
                color={getRingColor()}
              />
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Limit</span>
                <span className="text-xl font-black text-white tracking-tight leading-none">
                  {spendingLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[9px] font-bold text-gray-500 uppercase mt-1">BGN</span>
              </div>
            </div>
          </div>

          {/* Right: Text Content */}
          <div className="flex-1 text-center md:text-left w-full">
            {/* Status & Limit Edit Trigger */}
            <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-4 mb-6">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] ${isOverspent ? 'bg-red-500/20 text-red-400' : 'bg-primary/10 text-primary'}`}>
                <div className={`w-2 h-2 rounded-full ${isOverspent ? 'bg-red-500 animate-pulse' : 'bg-primary animate-pulse'}`}></div>
                <span>{isOverspent ? 'BUDGET EXCEEDED' : 'YOU ARE SAFE TO SPEND'}</span>
              </div>

              <button
                onClick={() => {
                  setIsEditingLimit(true);
                  setCustomLimitInput(spendingLimit.toString());
                }}
                className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Adjust Limit</span>
              </button>
            </div>

            {/* Main Amount */}
            <div className="mb-6">
              {isOverspent ? (
                <>
                  <p className="text-red-400/60 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Overspent by</p>
                  <div className="flex items-baseline justify-center md:justify-start space-x-2">
                    <span className="text-5xl md:text-7xl font-black text-red-400 tracking-tighter">
                      {Math.abs(safeToSpend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xl font-bold text-red-500/40">BGN</span>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline justify-center md:justify-start space-x-2">
                  <span className="text-5xl md:text-7xl font-black text-white tracking-tighter shadow-sm">
                    {safeToSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xl font-bold text-primary shadow-sm">BGN</span>
                </div>
              )}
            </div>

            {/* Spent Indicator */}
            <div className="flex flex-col md:flex-row items-center md:justify-start gap-4">
              <div className="flex items-center space-x-3 bg-white/5 rounded-2xl px-5 py-3 border border-white/5">
                <div className="p-2 bg-white/5 rounded-lg">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block leading-none mb-1">Spent Overall</span>
                  <span className="text-lg font-black text-white leading-none">{monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-bold text-gray-500">BGN</span></span>
                </div>
              </div>

              <div className="hidden md:block h-10 w-px bg-white/5"></div>

              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">{targetMonth}</p>
            </div>
          </div>
        </div>

        {/* Edit Limit Modal */}
        {isEditingLimit && (
          <div className="absolute inset-0 bg-gray-950/95 backdrop-blur-xl z-20 flex items-center justify-center rounded-[2.5rem] animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center p-6 max-w-xs w-full">
              <h4 className="text-white font-black text-lg uppercase tracking-tight mb-6">Set Spending Limit</h4>

              <div className="relative mb-4">
                <input
                  type="number"
                  value={customLimitInput}
                  onChange={(e) => setCustomLimitInput(e.target.value)}
                  placeholder={autoLimit.toFixed(0)}
                  className="w-full bg-white/10 border border-white/20 text-white text-center text-2xl font-black py-4 px-6 rounded-2xl focus:ring-2 focus:ring-primary outline-none placeholder:text-gray-600"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">BGN</span>
              </div>

              <p className="text-gray-500 text-xs mb-6">
                Auto-calculated: <span className="text-primary font-bold">{autoLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })} BGN</span> (70% of income)
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={handleResetLimit}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all"
                >
                  Use Auto
                </button>
                <button
                  onClick={() => setIsEditingLimit(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLimit}
                  className="flex-1 bg-primary hover:bg-primary-dark text-gray-950 text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Income Card */}
      <div className="relative group overflow-hidden bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-white/5 shadow-xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl -mr-12 -mt-12"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest mb-2">{getTranslation(language, 'income')}: {targetMonth}</h2>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                {monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-bold text-gray-400">BGN</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Expenses</span>
              <span className="text-lg font-black text-gray-900 dark:text-white">{monthlyExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800"></div>
            <div className="text-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Savings</span>
              <span className="text-lg font-black text-secondary">{(monthlyIncome - monthlyExpenses).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Dashboard */}
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

        <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden">
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