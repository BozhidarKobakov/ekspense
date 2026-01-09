import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, AccountSummary, MONTH_NAMES } from '../types';
import { getTranslation } from '../translations';

interface AccountsViewProps {
  transactions: Transaction[];
  accounts: AccountSummary[];
  onAddAccount: (account: AccountSummary) => void;
  onUpdateAccount: (oldName: string, account: AccountSummary) => void;
  onDeleteAccount: (name: string) => void;
  onEditAccount: (account: AccountSummary) => void;
  language: string;
}

const AccountsView: React.FC<AccountsViewProps> = ({ transactions, accounts, onAddAccount, onUpdateAccount, onDeleteAccount, onEditAccount, language }) => {
  const [selectedAccountNames, setSelectedAccountNames] = useState<string[]>(accounts.map(a => a.name));
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Sync selected accounts if accounts change
  useEffect(() => {
    if (selectedAccountNames.length === 0 && accounts.length > 0) {
      setSelectedAccountNames(accounts.map(a => a.name));
    }
  }, [accounts]);

  const toggleAccount = (name: string) => {
    setSelectedAccountNames(prev =>
      prev.includes(name)
        ? (prev.length > 1 ? prev.filter(n => n !== name) : prev) // keep at least one
        : [...prev, name]
    );
  };

  // Calculate current balances dynamically based on history
  const getBalance = (accountName: string, upToDate: Date = new Date(8640000000000000)) => {
    let balance = 0;
    for (const t of transactions) {
      if (t.date > upToDate) continue;
      if (t.toAccount === accountName) balance += t.amount;
      if (t.fromAccount === accountName) balance -= t.amount;
    }
    return balance;
  };

  // Calculate total net worth for selected accounts
  const netWorth = selectedAccountNames.reduce((total, name) => total + getBalance(name), 0);

  // --- Historical Net Worth Calculation ---
  const historyData = useMemo(() => {
    if (transactions.length === 0) return [];

    const sortedTs = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
    const start = sortedTs[0].date;
    const end = new Date();
    const spanDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    let interval: 'day' | 'month' | 'year' = 'month';
    if (spanDays < 60) interval = 'day';
    else if (spanDays < 730) interval = 'month';
    else interval = 'year';

    const points: { label: string; value: number; date: Date }[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);

    // Helper to jump to next interval
    const nextInterval = (d: Date) => {
      const next = new Date(d);
      if (interval === 'day') next.setDate(next.getDate() + 1);
      else if (interval === 'month') next.setMonth(next.getMonth() + 1);
      else next.setFullYear(next.getFullYear() + 1);
      return next;
    };

    // Helper to get label
    const getLabel = (d: Date) => {
      if (interval === 'day') return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
      if (interval === 'month') return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      return `${d.getFullYear()}`;
    };

    // Generate points
    let safety = 0;
    let tempDate = new Date(current);
    while (tempDate <= end && safety < 500) {
      safety++;
      const endOfInterval = new Date(tempDate);
      if (interval === 'day') endOfInterval.setHours(23, 59, 59, 999);
      else if (interval === 'month') {
        endOfInterval.setMonth(endOfInterval.getMonth() + 1, 0);
        endOfInterval.setHours(23, 59, 59, 999);
      } else {
        endOfInterval.setFullYear(endOfInterval.getFullYear(), 11, 31);
        endOfInterval.setHours(23, 59, 59, 999);
      }

      const val = selectedAccountNames.reduce((sum, name) => sum + getBalance(name, endOfInterval), 0);
      points.push({
        label: getLabel(tempDate),
        value: val,
        date: new Date(tempDate)
      });

      tempDate = nextInterval(tempDate);
    }

    return points;
  }, [transactions, selectedAccountNames]);

  const maxVal = Math.max(...historyData.map(p => p.value), 1);
  const minVal = Math.min(...historyData.map(p => p.value), 0);
  const range = maxVal - minVal;

  const [hoveredPoint, setHoveredPoint] = useState<typeof historyData[0] | null>(null);

  const handleEdit = (acc: AccountSummary) => {
    onEditAccount(acc);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Net Worth Hero Card + History Chart */}
      <div className="relative group bg-white dark:bg-gray-950 rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-2xl overflow-hidden" onMouseLeave={() => setHoveredPoint(null)}>
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>

        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col lg:flex-row justify-between gap-10">
            {/* Left: Total Balance & Filtering */}
            <div className="space-y-8 min-w-[300px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">{getTranslation(language, 'net_worth')}</h2>

                  {/* Account Selector Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(p => !p)}
                      className="flex items-center space-x-2 text-[10px] font-black text-primary hover:text-primary-dark transition-colors uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-100 dark:border-white/5"
                    >
                      <span>{selectedAccountNames.length === accounts.length ? 'Combined' : 'Filtered'}</span>
                      <svg className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {dropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95">
                        {accounts.map(acc => (
                          <button
                            key={acc.name}
                            onClick={() => toggleAccount(acc.name)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group"
                          >
                            <span className={`text-[10px] font-bold uppercase tracking-tight ${selectedAccountNames.includes(acc.name) ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{acc.name}</span>
                            {selectedAccountNames.includes(acc.name) && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(163,230,53,0.8)]"></div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline space-x-3">
                  <span className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                    {(hoveredPoint ? hoveredPoint.value : netWorth).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-primary leading-none">EUR</span>
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 mt-1 uppercase leading-none">.{(hoveredPoint ? hoveredPoint.value : netWorth).toFixed(2).split('.')[1]}</span>
                  </div>
                </div>
                {hoveredPoint && (
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2 animate-pulse">{hoveredPoint.label}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl px-4 py-3 border border-gray-100 dark:border-white/5 backdrop-blur-sm">
                  <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Accounts</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{selectedAccountNames.length} <span className="text-[10px] text-gray-500 dark:text-gray-400">Selected</span></p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl px-4 py-3 border border-gray-100 dark:border-white/5 backdrop-blur-sm">
                  <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Status</p>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{hoveredPoint ? 'Scrubbing' : 'Live'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Trend Chart (Smooth Line SVG with Interactive Elements) */}
            <div className="flex-1 min-h-[180px] relative mt-10 lg:mt-0 flex gap-4">
              {/* Y-Axis Legend */}
              <div className="hidden md:flex flex-col justify-between py-2 border-r border-gray-100 dark:border-white/5 pr-4 shrink-0">
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">{maxVal > 1000 ? (maxVal / 1000).toFixed(1) + 'k' : maxVal}</span>
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">{(minVal + range / 2) > 1000 ? ((minVal + range / 2) / 1000).toFixed(1) + 'k' : (minVal + range / 2).toFixed(0)}</span>
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">{minVal > 1000 ? (minVal / 1000).toFixed(1) + 'k' : minVal}</span>
              </div>

              <div className="flex-1 relative h-full">
                {historyData.length > 1 ? (
                  <svg className="w-full h-full min-h-[180px]" preserveAspectRatio="none" viewBox="0 0 400 120">
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a3e635" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Area Fill (Smooth) */}
                    <path
                      d={(() => {
                        const points = historyData.map((p, i) => ({
                          x: (i / (historyData.length - 1)) * 400,
                          y: range === 0 ? 60 : 110 - ((p.value - minVal) / range) * 100
                        }));

                        if (points.length < 2) return '';

                        let d = `M ${points[0].x},${points[0].y}`;

                        for (let i = 0; i < points.length - 1; i++) {
                          const p0 = points[i];
                          const p1 = points[i + 1];
                          const cpX = p0.x + (p1.x - p0.x) / 2;
                          d += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
                        }

                        return d + ` L 400,120 L 0,120 Z`;
                      })()}
                      fill="url(#lineGradient)"
                    />

                    {/* The Line (Smooth) */}
                    <path
                      d={(() => {
                        const points = historyData.map((p, i) => ({
                          x: (i / (historyData.length - 1)) * 400,
                          y: range === 0 ? 60 : 110 - ((p.value - minVal) / range) * 100
                        }));

                        if (points.length < 2) return '';

                        let d = `M ${points[0].x},${points[0].y}`;

                        for (let i = 0; i < points.length - 1; i++) {
                          const p0 = points[i];
                          const p1 = points[i + 1];
                          const cpX = p0.x + (p1.x - p0.x) / 2;
                          d += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
                        }

                        return d;
                      })()}
                      fill="none"
                      stroke="#a3e635"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Hover Vertical Line */}
                    {hoveredPoint && (
                      <line
                        x1={(historyData.indexOf(hoveredPoint) / (historyData.length - 1)) * 400}
                        y1="0"
                        x2={(historyData.indexOf(hoveredPoint) / (historyData.length - 1)) * 400}
                        y2="120"
                        stroke="rgba(163,230,53,0.3)"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                      />
                    )}

                    {/* Hover Point indicator */}
                    {hoveredPoint && (
                      <circle
                        cx={(historyData.indexOf(hoveredPoint) / (historyData.length - 1)) * 400}
                        cy={range === 0 ? 60 : 110 - ((hoveredPoint.value - minVal) / range) * 100}
                        r="4"
                        fill="#a3e635"
                        className="shadow-2xl"
                      />
                    )}

                    {/* Data Points (Invisible Trigger Rects) */}
                    {historyData.map((p, i) => {
                      const x = (i / (historyData.length - 1)) * 400;
                      return (
                        <rect
                          key={i}
                          x={i === 0 ? 0 : x - (400 / (historyData.length - 1) / 2)}
                          y="0"
                          width={400 / (historyData.length - 1)}
                          height="120"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPoint(p)}
                          onTouchStart={() => setHoveredPoint(p)}
                        />
                      );
                    })}
                  </svg>
                ) : (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Awaiting Movement Data</span>
                  </div>
                )}

                {/* X-Axis Labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 translate-y-6">
                  {historyData.filter((_, i) => i === 0 || i === historyData.length - 1 || (historyData.length > 5 && i === Math.floor(historyData.length / 2))).map((point, i) => (
                    <span key={i} className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">
                      {point.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => {
          const balance = getBalance(acc.name);
          const isSelected = selectedAccountNames.includes(acc.name);
          return (
            <div
              key={acc.name}
              onClick={() => toggleAccount(acc.name)}
              className={`bg-white dark:bg-gray-900 rounded-[2rem] p-6 border transition-all group relative overflow-hidden flex flex-col justify-between h-[160px] cursor-pointer
                ${isSelected ? 'border-primary/20 shadow-xl dark:shadow-primary/5' : 'border-gray-100 dark:border-white/5 opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'}`}
            >
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all
                    ${isSelected ? 'bg-primary/10 border-primary/20 text-primary-dark' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-white/10 text-gray-400'}`}>
                    {acc.type === 'fiat' ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    ) : acc.type === 'savings' ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-base font-black uppercase tracking-tighter truncate max-w-[120px] leading-tight transition-colors ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{acc.name}</h3>
                    <div className="flex space-x-1.5 mt-1.5">
                      <span className="text-[9px] font-black text-gray-400 uppercase px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">{acc.type}</span>
                      <span className="text-[9px] font-black text-primary-dark uppercase px-2 py-0.5 bg-primary/10 rounded-lg">{acc.currency}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(acc); }}
                    className="p-2 text-gray-400 hover:text-primary transition-colors bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-white/5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteAccount(acc.name); }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-white/5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-50 dark:border-white/5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Current Balance</span>
                <div className="flex items-baseline space-x-1.5 text-right">
                  <span className={`text-2xl font-black tracking-tighter transition-colors ${!isSelected ? 'text-gray-400' : balance < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-primary' : 'text-gray-500'}`}>{acc.currency}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AccountsView;