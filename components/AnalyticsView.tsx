import React, { useState, useMemo } from 'react';
import { Transaction, MONTH_NAMES, AccountSummary } from '../types';
import { formatDateColumn } from '../utils';
import { generateSpendingInsights } from '../services/geminiService';
import { getTranslation } from '../translations';

interface AnalyticsViewProps {
  transactions: Transaction[];
  currentMonth: string;
  availableMonths: string[];
  onMonthChange: (month: string) => void;
  incomeCategories: string[];
  accounts: AccountSummary[];
  language: string;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  currentMonth,
  availableMonths,
  onMonthChange,
  incomeCategories,
  accounts,
  language
}) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'all'>('month');
  const [selectedAccountNames, setSelectedAccountNames] = useState<string[]>([]);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  // Handle dropdown change
  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setViewMode('all');
    } else {
      setViewMode('month');
      onMonthChange(value);
    }
  };

  // Filter transactions based on view mode and accounts
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // 1. View Mode Filter
    if (viewMode === 'month') {
      result = result.filter(t => {
        const m = MONTH_NAMES[t.date.getMonth()];
        const y = t.date.getFullYear();
        return `${m}-${y}` === currentMonth;
      });
    }

    // 2. Account Filter
    if (selectedAccountNames.length > 0) {
      result = result.filter(t =>
        selectedAccountNames.includes(t.fromAccount) ||
        selectedAccountNames.includes(t.toAccount)
      );
    }

    return result;
  }, [transactions, currentMonth, viewMode, selectedAccountNames]);

  // --- NEW: Financial Health Calculations ---
  const financialHealth = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredTransactions.forEach(t => {
      // Logic: 
      // Income = Category is Salary or Income
      // Expense = Not Income, Not Transfer, Not Internal (From Nastya is excluded based on user logic)
      if (t.fromAccount === 'Nastya') return; // Exclude internal logic

      if (incomeCategories.includes(t.category)) {
        income += t.amount;
      } else if (t.category !== 'Transfer') {
        expense += t.amount;
      }
    });

    const net = income - expense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;

    // Calculate Days
    let daysCount = 30; // Default approximation
    if (viewMode === 'month') {
      const [m, y] = currentMonth.split('-');
      const monthIndex = MONTH_NAMES.indexOf(m);
      const year = parseInt(y);
      const now = new Date();

      // If current month is the actual current calendar month, use days passed so far
      if (now.getMonth() === monthIndex && now.getFullYear() === year) {
        daysCount = now.getDate();
      } else {
        // Otherwise use total days in that month
        daysCount = new Date(year, monthIndex + 1, 0).getDate();
      }
    } else {
      // approximate for 'all' view
      daysCount = 365;
    }

    const dailyAvg = expense / Math.max(daysCount, 1);

    return { income, expense, net, savingsRate, dailyAvg };
  }, [filteredTransactions, currentMonth, viewMode]);

  // --- NEW: Average Spending Calculation ---
  const categoryAverages = useMemo(() => {
    if (viewMode === 'all') return [];

    // 1. Get all category totals for previous months
    const totalsByMonthAndCat: Record<string, Record<string, number>> = {};
    const monthCounts: Record<string, number> = {}; // How many months have data for this category?

    transactions.forEach(t => {
      const m = MONTH_NAMES[t.date.getMonth()];
      const y = t.date.getFullYear();
      const monthLabel = `${m}-${y}`;

      if (monthLabel === currentMonth) return; // Skip current month for average calc
      if (['Salary', 'Income', 'Transfer'].includes(t.category)) return;
      if (t.fromAccount === 'Nastya') return;

      if (!totalsByMonthAndCat[t.category]) totalsByMonthAndCat[t.category] = {};

      totalsByMonthAndCat[t.category][monthLabel] = (totalsByMonthAndCat[t.category][monthLabel] || 0) + t.amount;
    });

    // 2. Calculate Average per Category
    const averages: Record<string, number> = {};
    Object.keys(totalsByMonthAndCat).forEach(cat => {
      const months = Object.values(totalsByMonthAndCat[cat]);
      const sum = months.reduce((a, b) => a + b, 0);
      averages[cat] = sum / Math.max(months.length, 1);
    });

    // 3. Compare with Current Month
    const currentTotals: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      if (['Salary', 'Income', 'Transfer'].includes(t.category)) return;
      if (t.fromAccount === 'Nastya') return;
      currentTotals[t.category] = (currentTotals[t.category] || 0) + t.amount;
    });

    return Object.keys(currentTotals).map(cat => ({
      category: cat,
      current: currentTotals[cat],
      average: averages[cat] || 0,
      diff: currentTotals[cat] - (averages[cat] || 0)
    })).sort((a, b) => b.current - a.current);

  }, [transactions, currentMonth, filteredTransactions, viewMode]);


  // 1. Calculate Monthly Trends (Always show historical context regardless of view mode)
  const monthlyTrend = useMemo(() => {
    const monthsMap = new Map<string, number>();

    transactions.forEach(t => {
      // Exclude Income/Transfers from spending trend
      if (['Transfer', 'Income', 'Salary'].includes(t.category)) return;

      // Respect Account Filter
      if (selectedAccountNames.length > 0) {
        if (!selectedAccountNames.includes(t.fromAccount) && !selectedAccountNames.includes(t.toAccount)) return;
      } else {
        // Default exclusion if no filter (historical logic)
        if (t.fromAccount === 'Nastya') return;
      }

      const m = MONTH_NAMES[t.date.getMonth()];
      const y = t.date.getFullYear();
      const monthLabel = `${m}-${y}`;

      const currentValue = monthsMap.get(monthLabel) || 0;
      monthsMap.set(monthLabel, currentValue + t.amount);
    });

    const sortedMonths = Array.from(monthsMap.keys()).sort((a, b) => {
      const [ma, ya] = a.split('-');
      const [mb, yb] = b.split('-');

      const miA = MONTH_NAMES.indexOf(ma);
      const miB = MONTH_NAMES.indexOf(mb);

      const yA = parseInt(ya, 10);
      const yB = parseInt(yb, 10);

      if (yA !== yB) return yA - yB;
      return miA - miB;
    });

    // Determine the range of months to show
    let displayMonths = sortedMonths;
    if (viewMode === 'month') {
      const currentIndex = sortedMonths.indexOf(currentMonth);
      if (currentIndex !== -1) {
        displayMonths = sortedMonths.slice(0, currentIndex + 1);
      }
    }

    // If 'all' mode, show last 12 months for better density, otherwise last 6
    const sliceCount = viewMode === 'all' ? 12 : 6;
    const lastN = displayMonths.slice(-sliceCount);

    return lastN.map(m => ({ month: m, amount: monthsMap.get(m) || 0 }));
  }, [transactions, viewMode, currentMonth, selectedAccountNames]);

  // 2. Category Breakdown (Based on Filtered Data)
  const categoryBreakdown = useMemo(() => {
    const catMap = new Map<string, number>();
    let total = 0;

    filteredTransactions
      .filter(t => !incomeCategories.includes(t.category) && t.category !== 'Transfer' && t.fromAccount !== 'Nastya')
      .forEach(t => {
        const current = catMap.get(t.category) || 0;
        catMap.set(t.category, current + t.amount);
        total += t.amount;
      });

    const result = Array.from(catMap.entries())
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return { data: result, total };
  }, [filteredTransactions]);

  // 3. Top Expenses (Based on Filtered Data)
  const topExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => !incomeCategories.includes(t.category) && t.category !== 'Transfer')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredTransactions, incomeCategories]);

  const handleGenerateInsights = async () => {
    if (viewMode === 'all') {
      alert("AI Insights are currently optimized for single-month analysis to provide specific advice.");
      return;
    }

    setLoading(true);
    const recentTransactions = filteredTransactions
      .filter(t => !['Transfer', 'Income', 'Salary'].includes(t.category));

    const text = await generateSpendingInsights(recentTransactions, currentMonth);
    setInsights(text);
    setLoading(false);
  };

  const maxTrendAmount = Math.max(...monthlyTrend.map(d => d.amount), 1);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white capitalize tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>{getTranslation(language, 'analytics')}</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium h-5">
            Insights for <span className="text-primary-dark dark:text-primary font-bold">{viewMode === 'all' ? 'FULL HISTORY' : currentMonth}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Account Filter Dropdown */}
          <div className="relative flex-1 md:flex-none">
            <button
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white py-4 px-6 rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex justify-between items-center min-w-[180px]"
            >
              <span className="truncate">
                {selectedAccountNames.length === 0 ? 'All Accounts' :
                  selectedAccountNames.length === 1 ? selectedAccountNames[0] :
                    `${selectedAccountNames.length} Accounts`}
              </span>
              <svg className={`h-4 w-4 transition-transform ${accountDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {accountDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-3xl shadow-2xl z-50 p-3 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => {
                    setSelectedAccountNames([]);
                    setAccountDropdownOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-1 transition-colors ${selectedAccountNames.length === 0 ? 'bg-primary text-gray-950' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                  All Accounts
                </button>
                <div className="h-px bg-gray-100 dark:bg-white/5 my-2 mx-2"></div>
                {accounts.map(acc => {
                  const isSelected = selectedAccountNames.includes(acc.name);
                  return (
                    <button
                      key={acc.name}
                      onClick={() => {
                        const newSelected = isSelected
                          ? selectedAccountNames.filter(n => n !== acc.name)
                          : [...selectedAccountNames, acc.name];
                        setSelectedAccountNames(newSelected);
                      }}
                      className="w-full text-left p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-1 transition-colors flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <span className={isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>{acc.name}</span>
                      {isSelected && <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative flex-1 md:flex-none">
            <select
              value={viewMode === 'all' ? 'all' : currentMonth}
              onChange={handleViewChange}
              className="appearance-none w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white py-4 pl-6 pr-12 rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              <option value="all">Full Timeline</option>
              <optgroup label="Monthly Periods">
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </optgroup>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <button
            onClick={handleGenerateInsights}
            disabled={loading || viewMode === 'all'}
            className={`flex items-center justify-center space-x-2 px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/10
                    ${(loading || viewMode === 'all')
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-primary text-gray-950 hover:bg-primary-dark hover:scale-105 active:scale-95'}`}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            )}
            <span>{loading ? 'Processing' : 'Gen AI'}</span>
          </button>
        </div>
      </div>

      {/* Financial Health Overlays */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: getTranslation(language, 'monthly_income'), value: financialHealth.income, unit: 'EUR', color: 'text-gray-900 dark:text-white' },
          { label: getTranslation(language, 'monthly_expense'), value: financialHealth.expense, unit: 'EUR', color: 'text-gray-900 dark:text-white' },
          { label: getTranslation(language, 'savings_rate'), value: financialHealth.savingsRate.toFixed(1), unit: '%', color: financialHealth.savingsRate >= 20 ? 'text-primary' : 'text-accent' },
          { label: 'Burn Rate', value: Math.round(financialHealth.dailyAvg), unit: 'EUR/D', color: 'text-secondary' }
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-950 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] relative z-10">{card.label}</span>
            <div className="mt-2 flex items-baseline space-x-1 relative z-10">
              <span className={`text-3xl font-black tracking-tighter ${card.color}`}>{card.value.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">{card.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Intelligence Panel */}
      {insights && viewMode === 'month' && (
        <div className="bg-primary/10 dark:bg-primary/5 rounded-[3rem] p-10 text-gray-900 dark:text-white border border-primary/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[150px] -mr-64 -mt-64 pointer-events-none"></div>
          <div className="flex flex-col lg:flex-row items-start gap-10 relative z-10">
            <div className="p-5 bg-primary text-gray-950 rounded-[2rem] shadow-2xl shadow-primary/40 ring-8 ring-primary/10 shrink-0">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="flex-1">
              <h3 className="font-black text-3xl mb-8 tracking-tighter">AI Strategist Intelligence</h3>
              <div className="space-y-4 text-gray-700 dark:text-gray-300 font-medium leading-relaxed text-lg">
                {insights.split('\n').filter(line => line.trim()).map((line, i) => (
                  <p key={i} className={line.trim().startsWith('-') ? 'pl-6 border-l-4 border-primary/40 text-gray-800 dark:text-gray-200' : ''}>
                    {line.replace(/^-\s*/, '')}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Momentum Chart */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm relative group overflow-hidden">
          <div className="flex justify-between items-center mb-12 relative z-10">
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center">
              <div className="w-2 h-8 bg-primary rounded-full mr-4 shadow-[0_0_15px_rgba(180,255,0,0.5)]"></div>
              Spending Momentum
            </h3>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-950 px-4 py-2 rounded-full border border-gray-100 dark:border-white/5">
              MAX PEAK {maxTrendAmount.toLocaleString()} EUR
            </span>
          </div>

          <div className="relative h-72 flex items-end justify-between px-2">
            {/* Background Grid Lines */}
            <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none opacity-[0.05] dark:opacity-[0.07]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full border-t-2 border-gray-400 dark:border-white"></div>
              ))}
            </div>

            {monthlyTrend.map((item) => {
              const isSelected = item.month === currentMonth && viewMode === 'month';
              const heightPct = Math.max((item.amount / maxTrendAmount) * 100, 4);

              return (
                <div key={item.month} className="flex-1 flex flex-col items-center justify-end h-full z-10 group/bar">
                  <div className="relative w-full flex flex-col items-center justify-end h-full px-1">
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none z-20">
                      <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-950 text-[9px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                        {item.amount.toLocaleString()} EUR
                      </div>
                      <div className="w-2 h-2 bg-gray-900 dark:bg-white rotate-45 mx-auto -mt-1"></div>
                    </div>

                    <div
                      className={`w-full max-w-[42px] rounded-full transition-all duration-700 ease-out relative overflow-hidden
                        ${isSelected
                          ? 'bg-primary dark:bg-primary shadow-[0_10px_30px_rgba(180,255,0,0.3)] ring-4 ring-primary/20 cursor-default'
                          : 'bg-gray-200 dark:bg-gray-800/80 group-hover/bar:bg-primary/30 group-hover/bar:translate-y-[-4px]'}`}
                      style={{ height: `${heightPct}%` }}
                    >
                      {/* Glossy Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-white/10 opacity-50"></div>
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary to-white/30 animate-pulse"></div>
                      )}
                    </div>
                  </div>

                  <span className={`mt-6 text-[9px] font-black uppercase tracking-widest transition-all ${isSelected ? 'text-primary-dark dark:text-primary' : 'text-gray-400 group-hover/bar:text-gray-900 dark:group-hover/bar:text-white'}`}>
                    {item.month.split('-')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Abstract corner decoration */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
        </div>

        {/* Volume Distribution */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center">
              <div className="w-2 h-8 bg-gray-200 dark:bg-gray-700 rounded-full mr-4"></div>
              {getTranslation(language, 'category_breakdown')}
            </h3>
            <span className="text-[10px] font-black text-primary-dark uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full">
              {categoryBreakdown.total.toLocaleString()} EUR
            </span>
          </div>

          <div className="space-y-8 max-h-[320px] overflow-y-auto pr-6 custom-scrollbar">
            {categoryBreakdown.data.map((cat) => (
              <div key={cat.category} className="group">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{cat.category}</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">{cat.amount.toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">{cat.percentage.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-50 dark:bg-gray-900 h-4 rounded-full overflow-hidden border border-gray-100 dark:border-white/5 p-1">
                  <div
                    className="h-full bg-primary-dark rounded-full transition-all duration-1000 shadow-xl shadow-primary/20"
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {categoryBreakdown.data.length === 0 && (
              <div className="h-48 flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[2rem]">Empty Dataset</div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Records */}
      <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Large Capital Outflows</h3>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-full border border-gray-100 dark:border-white/5">TOP 5 AUDIT</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/30">
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descriptor</th>
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Taxonomy</th>
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {topExpenses.map((t) => (
                <tr key={t.id} className="hover:bg-primary/5 transition-all group">
                  <td className="px-10 py-8">
                    <div className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-dark transition-colors">{t.description}</div>
                    <div className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest flex items-center">
                      <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {formatDateColumn(t.date)}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-[10px] font-black text-primary-dark bg-primary/10 px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-primary/20">{t.category}</span>
                  </td>
                  <td className="px-10 py-8 text-right font-black text-gray-900 dark:text-white text-2xl tracking-tighter">
                    {t.amount.toLocaleString()} <span className="text-xs text-gray-400 uppercase">EUR</span>
                  </td>
                </tr>
              ))}
              {topExpenses.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-10 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No records for this timeframe</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;