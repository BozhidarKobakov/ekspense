import React, { useState, useEffect, useMemo } from 'react';
import { Transaction } from '../types';
import { formatDateColumn } from '../utils';
import { getTranslation } from '../translations';


interface TransactionListProps {
  transactions: Transaction[];
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  language: string;
}

type SortKey = keyof Transaction | 'date';
type SortDirection = 'asc' | 'desc';

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onUpdateTransaction, onEdit, onDelete, language }) => {
  const [filterText, setFilterText] = useState('');

  // Specific Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'desc' });

  const uniqueCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  // Handle sorting column click
  const handleSort = (key: SortKey) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' }; // Default to asc for new column
    });
  };

  const uniqueFromAccounts = useMemo(() => {
    const accs = new Set(transactions.map(t => t.fromAccount));
    return Array.from(accs).sort();
  }, [transactions]);

  const uniqueToAccounts = useMemo(() => {
    const accs = new Set(transactions.map(t => t.toAccount));
    return Array.from(accs).sort();
  }, [transactions]);

  // Process data (filter + sort)
  const processedTransactions = useMemo(() => {
    let data = [...transactions];

    // 1. Apply Specific Filters
    if (filterCategory) {
      data = data.filter(t => t.category === filterCategory);
    }
    if (filterFrom) {
      data = data.filter(t => t.fromAccount === filterFrom);
    }
    if (filterTo) {
      data = data.filter(t => t.toAccount === filterTo);
    }

    // 2. Apply Text Search (Broad search over remaining items)
    if (filterText) {
      const lower = filterText.toLowerCase();
      data = data.filter(t =>
        t.description.toLowerCase().includes(lower) ||
        t.fromAccount.toLowerCase().includes(lower) ||
        t.toAccount.toLowerCase().includes(lower) ||
        t.amount.toString().includes(lower)
      );
    }

    // 3. Sort
    data.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Transaction];
      let bValue: any = b[sortConfig.key as keyof Transaction];

      // Handle specific types
      if (sortConfig.key === 'date') {
        aValue = a.date.getTime();
        bValue = b.date.getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [transactions, filterText, filterCategory, filterFrom, filterTo, sortConfig]);

  // Helper for rendering sort arrow
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <span className="w-4 h-4 inline-block ml-1 opacity-20">↕</span>;
    return (
      <span className="w-4 h-4 inline-block ml-1 text-primary-dark">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const HeaderCell = ({ label, sortKey, align = 'left' }: { label: string, sortKey: SortKey, align?: string }) => (
    <th
      scope="col"
      onClick={() => handleSort(sortKey)}
      className={`px-6 py-3 text-${align} text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none group`}
    >
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        <SortIcon columnKey={sortKey} />
      </div>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-4 transition-colors">

        {/* Row 1: Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            placeholder="Search description, amount..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="pl-10 block w-full border border-gray-200 dark:border-white/5 bg-white dark:bg-gray-900 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none text-gray-900 dark:text-gray-100 transition-all shadow-sm"
          />
        </div>

        {/* Row 2: Specific Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* From Account Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 ml-1 uppercase tracking-wider">From Account</label>
            <select
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="block w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm focus:ring-primary focus:border-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
            >
              <option value="">All Accounts</option>
              {uniqueFromAccounts.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* To Account Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 ml-1 uppercase tracking-wider">To Account</label>
            <select
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="block w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm focus:ring-primary focus:border-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
            >
              <option value="">All Accounts</option>
              {uniqueToAccounts.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 ml-1 uppercase tracking-wider">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm focus:ring-primary focus:border-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <HeaderCell label={getTranslation(language, 'date')} sortKey="date" />
                <HeaderCell label={getTranslation(language, 'description')} sortKey="description" />
                <HeaderCell label={getTranslation(language, 'from')} sortKey="fromAccount" />
                <HeaderCell label={getTranslation(language, 'to')} sortKey="toAccount" />
                <HeaderCell label={getTranslation(language, 'amount')} sortKey="amount" align="right" />
                <HeaderCell label={getTranslation(language, 'category')} sortKey="category" />
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  {getTranslation(language, 'actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {processedTransactions.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => onEdit(t)}
                  className="hover:bg-gray-100/80 dark:hover:bg-gray-800/50 transition-all cursor-pointer group border-b border-gray-100 dark:border-gray-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 font-medium">
                    {formatDateColumn(t.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {t.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded text-xs border border-gray-200 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-300">
                      {t.fromAccount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded text-xs border border-gray-200 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-300">
                      {t.toAccount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                    {t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${t.category === 'Food' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        t.category === 'Bills' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          t.category === 'Salary' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {t.category}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2 relative z-20">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                        className="text-gray-400 hover:text-primary-dark dark:hover:text-primary p-2 bg-transparent hover:bg-primary/10 rounded-xl transition-colors"
                        title="Edit transaction"
                      >
                        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                        className="text-red-400 hover:text-red-900 dark:hover:text-red-300 p-2 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete transaction"
                      >
                        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {processedTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    No transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-3">
        {processedTransactions.map((t) => (
          <div
            key={t.id}
            onClick={() => onEdit(t)}
            className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 pr-2">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-tight text-sm">{t.description}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{formatDateColumn(t.date)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="block font-bold text-gray-900 dark:text-gray-100">{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium mt-1 ${t.category === 'Food' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  t.category === 'Bills' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    t.category === 'Salary' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                  {t.category}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg mb-3 border border-gray-200 dark:border-gray-800">
              <span className="truncate max-w-[40%] font-medium">{t.fromAccount}</span>
              <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              <span className="truncate max-w-[40%] font-medium text-right">{t.toAccount}</span>
            </div>

            <div className="flex justify-end items-center relative z-10">
              <div className="flex space-x-2 relative z-20">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                  className="p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                  className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {processedTransactions.length === 0 && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No transactions match your filters.
          </div>
        )}
      </div>
    </div >
  );
};

export default TransactionList;