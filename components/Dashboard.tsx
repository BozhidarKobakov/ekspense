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

// Tactical HUD-style Segmented Gauge
const TacticalGauge = ({ progress, size = 180, color = '#39fb48' }: { progress: number; size?: number; color?: string }) => {
  const segments = 28;
  const radius = size / 2 - 15;
  const startAngle = -220;
  const endAngle = 40;
  const range = endAngle - startAngle;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          <filter id="neon-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {Array.from({ length: segments }).map((_, i) => {
          const angle = startAngle + (range / (segments - 1)) * i;
          const rad = (angle * Math.PI) / 180;

          // Outer points
          const x2 = size / 2 + radius * Math.cos(rad);
          const y2 = size / 2 + radius * Math.sin(rad);

          // Inner points
          const x1 = size / 2 + (radius - 12) * Math.cos(rad);
          const y1 = size / 2 + (radius - 12) * Math.sin(rad);

          const isActive = (i / (segments - 1)) * 100 <= progress;

          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              className={`transition-all duration-700 ease-out ${isActive ? '' : 'text-gray-200 dark:text-white/15'}`}
              stroke={isActive ? color : 'currentColor'}
              strokeWidth={isActive ? "4" : "2"} // Slightly thicker track
              strokeLinecap="round"
              style={{
                filter: isActive ? 'url(#neon-glow)' : 'none',
                opacity: 1 // Keep track fully opaque for better visibility
              }}
            />
          );
        })}
      </svg>
    </div>
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
  const getEUR = (amount: number, currency: string) => {
    return amount;
  };

  // --- Summary Metrics ---
  const monthlyExpenses = filteredTransactions
    .filter(t => {
      const isOutboundFromActive = isInternal(t.fromAccount) && !isExcluded(t.fromAccount);
      const isToExternal = !isInternal(t.toAccount);
      return isOutboundFromActive && isToExternal;
    })
    .reduce((sum, t) => sum + getEUR(t.amount, 'EUR'), 0);

  const monthlyIncome = filteredTransactions
    .filter(t => {
      const isInboundToActive = isInternal(t.toAccount) && !isExcluded(t.toAccount);
      const isFromExternal = !isInternal(t.fromAccount);
      return isInboundToActive && isFromExternal;
    })
    .reduce((sum, t) => sum + getEUR(t.amount, 'EUR'), 0);

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
      <div className="relative group overflow-hidden bg-white dark:bg-gray-950 rounded-[2.5rem] p-6 md:p-8 border border-gray-200 dark:border-white/10 shadow-2xl">
        {/* Decorative blurs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/30 transition-all duration-500"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -ml-16 -mb-16 group-hover:bg-secondary/20 transition-all duration-500"></div>
        {isOverspent && <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>}

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-start gap-8 md:gap-14">
          {/* Left: Progress Ring */}
          <div className="relative flex-shrink-0 flex flex-col items-center">
            <span className="text-[11px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.3em] mb-4">{targetMonth}</span>
            <div className="relative flex items-center justify-center">
              <TacticalGauge
                progress={spentPercentage}
                size={220}
                color={getRingColor()}
              />
              {/* Interactive Center Content */}
              <div className="absolute flex flex-col items-center justify-center">
                <button
                  onClick={() => {
                    setIsEditingLimit(true);
                    setCustomLimitInput(spendingLimit.toString());
                  }}
                  className="bg-primary/10 dark:bg-[#0f2a15] px-3 py-1.5 rounded-full flex items-center shadow-sm dark:shadow-lg border border-primary/20 dark:border-primary/10 hover:border-primary/40 transition-all hover:scale-105 active:scale-95 group/limit mb-2"
                >
                  <span className="text-[11px] font-bold text-primary-dark dark:text-primary tracking-tight group-hover/limit:text-primary dark:group-hover/limit:text-white transition-colors">
                    Limit: <span className="opacity-80 text-[9px]">EUR</span> {spendingLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </button>

                <div className="flex items-center text-[9px] font-black uppercase tracking-[0.2em]">
                  <span className="text-gray-400 dark:text-white/20">Spent:</span>
                  <span className="text-gray-900 dark:text-white/60 ml-1.5">{monthlyExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[8px] opacity-30">Eur</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Text Content */}
          <div className="flex-1 text-center md:text-left w-full -mt-6 md:-mt-8">
            {/* Status Label (Right above the amount) */}
            <div className={`inline-flex items-center px-0 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.25em] mb-1 text-gray-400 dark:text-white/40`}>
              <span>{isOverspent ? 'BUDGET EXCEEDED' : 'YOU ARE SAFE TO SPEND'}</span>
            </div>

            {/* Main Amount */}
            <div className="mb-0">
              {isOverspent ? (
                <div className="flex items-baseline justify-center md:justify-start space-x-2">
                  <span className="text-5xl md:text-[80px] font-black text-red-500 tracking-tighter leading-none">
                    {Math.abs(safeToSpend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xl font-black text-red-500/40 uppercase">Bgn</span>
                </div>
              ) : (
                <div className="flex items-baseline justify-center md:justify-start space-x-2">
                  <span className="text-5xl md:text-[80px] font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                    {safeToSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xl font-black text-primary uppercase">Bgn</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Limit Modal */}
        {isEditingLimit && (
          <div className="absolute inset-0 bg-white dark:bg-gray-950/95 backdrop-blur-xl z-20 flex items-center justify-center rounded-[2.5rem] animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center p-6 max-w-xs w-full">
              <h4 className="text-gray-900 dark:text-white font-black text-lg uppercase tracking-tight mb-6">Set Spending Limit</h4>

              <div className="relative mb-4">
                <input
                  type="number"
                  value={customLimitInput}
                  onChange={(e) => setCustomLimitInput(e.target.value)}
                  placeholder={autoLimit.toFixed(0)}
                  className="w-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white text-center text-2xl font-black py-4 px-6 rounded-2xl focus:ring-2 focus:ring-primary outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold">EUR</span>
              </div>

              <p className="text-gray-500 text-xs mb-6">
                Auto-calculated: <span className="text-primary font-bold">{autoLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })} EUR</span> (70% of income)
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={handleResetLimit}
                  className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all"
                >
                  Use Auto
                </button>
                <button
                  onClick={() => setIsEditingLimit(false)}
                  className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLimit}
                  className="flex-1 bg-primary hover:bg-primary-dark text-gray-950 text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
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
              <span className="text-sm font-bold text-gray-400">EUR</span>
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