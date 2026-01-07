import React, { useState } from 'react';
import { Transaction, AccountSummary } from '../types';
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
  // Calculate current balances dynamically based on history
  const getBalance = (accountName: string) => {
    let balance = 0;
    for (const t of transactions) {
      if (t.toAccount === accountName) balance += t.amount;
      if (t.fromAccount === accountName) balance -= t.amount;
    }
    return balance;
  };

  // Calculate total net worth
  const netWorth = accounts.reduce((total, acc) => total + getBalance(acc.name), 0);

  const handleEdit = (acc: AccountSummary) => {
    onEditAccount(acc);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Net Worth Hero Card */}
      <div className="relative group overflow-hidden bg-gray-950 rounded-[2rem] p-8 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/30 transition-all duration-500"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -ml-16 -mb-16 group-hover:bg-secondary/20 transition-all duration-500"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-3">{getTranslation(language, 'net_worth')}</h2>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                {netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xl font-bold text-primary">EUR</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-white/5 rounded-full px-4 py-2 w-fit">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-xs text-gray-400 font-medium">Live balance from <span className="text-white font-black">{accounts.length}</span> accounts</span>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => {
          const balance = getBalance(acc.name);
          return (
            <div key={acc.name} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden flex flex-col justify-between h-[120px]">
              {/* Minimal Background Decoration */}
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all pointer-events-none"></div>

              <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-100 dark:border-white/5 shadow-inner transition-colors group-hover:bg-primary/5">
                    {acc.type === 'fiat' ? (
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    ) : acc.type === 'savings' ? (
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate max-w-[100px] leading-tight">{acc.name}</h3>
                    <div className="flex space-x-1 mt-1">
                      <span className="text-[8px] font-black text-gray-400 uppercase px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{acc.type}</span>
                      <span className="text-[8px] font-black text-primary-dark uppercase px-1.5 py-0.5 bg-primary/10 rounded">{acc.currency}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(acc)}
                    className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button
                    onClick={() => onDeleteAccount(acc.name)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>

              <div className="flex items-baseline justify-between mt-auto">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Balance</span>
                <div className="flex items-baseline space-x-1 text-right">
                  <span className={`text-xl font-black tracking-tighter ${balance < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">{acc.currency}</span>
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