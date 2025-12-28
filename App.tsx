import React, { useState, useMemo, useEffect, useRef } from 'react';
import { INITIAL_TRANSACTIONS, INITIAL_ACCOUNTS, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './constants';
import { Transaction, AccountName, CategoryName, AccountSummary, MONTH_NAMES } from './types';
import { formatMonthColumn } from './utils';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import AccountsView from './components/AccountsView';
import AnalyticsView from './components/AnalyticsView';
import CategoriesView from './components/CategoriesView';
import SettingsView from './components/SettingsView';
import { getCategoryIcon } from './components/CategoryIcons';
import { supabase } from './services/supabase';
import AuthView from './components/AuthView';
import { Session } from '@supabase/supabase-js';
import { getTranslation } from './translations';

// Icons
const DashboardIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const TransactionsIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const AccountsIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const AnalyticsIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>;
const CategoriesIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const SettingsIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'accounts' | 'analytics' | 'categories' | 'settings'>('dashboard');

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializingAuth(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Language State
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('ekspence_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('ekspence_language', language);
  }, [language]);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Initialize transactions from localStorage if available, otherwise use initial data
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('ekspence_transactions');
      if (saved) {
        // Parse JSON and revive Date objects
        return JSON.parse(saved, (key, value) => {
          if (key === 'date') return new Date(value);
          return value;
        });
      }
    } catch (error) {
      console.error("Failed to load transactions from localStorage:", error);
    }
    return INITIAL_TRANSACTIONS;
  });

  // Initialize accounts from localStorage
  const [accounts, setAccounts] = useState<AccountSummary[]>(() => {
    try {
      const saved = localStorage.getItem('ekspence_accounts');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load accounts from localStorage:", error);
    }
    return INITIAL_ACCOUNTS;
  });

  // Proactive fix for Revolut name and BGN currency as requested
  useEffect(() => {
    const normalize = accounts.map(a =>
      a.name.toLowerCase() === 'revolut'
        ? { ...a, name: 'Revolut', currency: 'BGN' }
        : a
    );

    // Only update if something actually changed to avoid loop
    if (JSON.stringify(normalize) !== JSON.stringify(accounts)) {
      setAccounts(normalize);
    }
  }, [accounts]);

  // Categories State
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ekspence_expense_categories');
      return saved ? JSON.parse(saved) : EXPENSE_CATEGORIES;
    } catch { return EXPENSE_CATEGORIES; }
  });

  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ekspence_income_categories');
      return saved ? JSON.parse(saved) : INCOME_CATEGORIES;
    } catch { return INCOME_CATEGORIES; }
  });

  useEffect(() => {
    localStorage.setItem('ekspence_expense_categories', JSON.stringify(expenseCategories));
    localStorage.setItem('ekspence_income_categories', JSON.stringify(incomeCategories));
  }, [expenseCategories, incomeCategories]);

  const [targetMonth, setTargetMonth] = useState(() => {
    return localStorage.getItem('ekspence_target_month') || 'Dec-2025';
  });

  useEffect(() => {
    localStorage.setItem('ekspence_target_month', targetMonth);
  }, [targetMonth]);

  // Sync targetMonth with availableMonths is moved down
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [entryType, setEntryType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [viewDate, setViewDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
  const [toDropdownOpen, setToDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  // Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountSummary | null>(null);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'fiat' | 'savings' | 'cash' | 'other'>('fiat');
  const [newAccCurrency, setNewAccCurrency] = useState('BGN');
  const [newAccInitialBalance, setNewAccInitialBalance] = useState('0');

  // Feedback System
  const [feedback, setFeedback] = useState<{ show: boolean, isExiting: boolean, type: 'success' | 'error', message: string }>({
    show: false,
    isExiting: false,
    type: 'success',
    message: ''
  });

  const triggerFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ show: true, isExiting: false, type, message });
    setTimeout(() => {
      setFeedback(prev => ({ ...prev, isExiting: true }));
      setTimeout(() => {
        setFeedback(prev => ({ ...prev, show: false, isExiting: false }));
      }, 500); // Wait for exit animation
    }, 2500);
  };

  // Refs for click-away detection
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Click-away listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(event.target as Node)) {
        setFromDropdownOpen(false);
      }
      if (toRef.current && !toRef.current.contains(event.target as Node)) {
        setToDropdownOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (fromDropdownOpen || toDropdownOpen || categoryDropdownOpen || showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fromDropdownOpen, toDropdownOpen, categoryDropdownOpen, showCalendar]);

  // New/Edit Transaction State
  const todayStr = new Date().toISOString().split('T')[0];
  const [newDate, setNewDate] = useState(todayStr);
  const [newDesc, setNewDesc] = useState('');
  const [newFrom, setNewFrom] = useState<string>('DSK');
  const [newTo, setNewTo] = useState<string>('External');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Food');
  const [extraCategoryName, setExtraCategoryName] = useState('');
  const [showAddCategoryField, setShowAddCategoryField] = useState(false);

  // Custom Account State
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Persist transactions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ekspence_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Persist accounts to localStorage
  useEffect(() => {
    localStorage.setItem('ekspence_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Extract unique available months for the selector
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, number>();

    transactions.forEach(t => {
      const mNum = t.date.getMonth();
      const y = t.date.getFullYear();
      const label = `${MONTH_NAMES[mNum]}-${y}`;
      const sortVal = y * 100 + mNum;
      monthsMap.set(label, sortVal);
    });

    return Array.from(monthsMap.entries())
      .sort((a, b) => b[1] - a[1]) // Newest first
      .map(entry => entry[0]);
  }, [transactions]);

  // Sync targetMonth with availableMonths to ensure valid selection
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(targetMonth)) {
      setTargetMonth(availableMonths[0]);
    }
  }, [availableMonths, targetMonth]);

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine final account names
    const finalFrom = newFrom === 'Custom' ? customFrom : newFrom;
    const finalTo = newTo === 'Custom' ? customTo : newTo;

    // Strict Validation
    const missingFields = [];
    if (!newDate) missingFields.push('Date Selection');
    if (!newAmount || parseFloat(newAmount) <= 0) missingFields.push('Amount');
    if (!finalFrom || (newFrom === 'Custom' && !customFrom)) missingFields.push(entryType === 'income' ? 'Source' : 'From Account');
    if (!finalTo || (newTo === 'Custom' && !customTo)) missingFields.push(entryType === 'expense' ? 'Recipient' : 'To Account');
    if (entryType !== 'transfer' && (!newCategory || newCategory.trim() === '')) missingFields.push('Category');

    if (missingFields.length > 0) {
      triggerFeedback('error', `Required: ${missingFields.join(', ')}`);
      return;
    }

    // Parse date as local time to avoid timezone shifts
    const [y, m, d] = newDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    // Smart default for description if empty
    const finalDesc = newDesc.trim() || (entryType === 'transfer'
      ? `Transfer: ${finalFrom} → ${finalTo}`
      : `${entryType.charAt(0).toUpperCase() + entryType.slice(1)} Entry`);

    if (editingTransaction) {
      // UPDATE existing transaction
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? {
        ...t,
        date: dateObj,
        description: finalDesc,
        fromAccount: finalFrom,
        toAccount: finalTo,
        amount: parseFloat(newAmount),
        category: newCategory
      } : t));
    } else {
      // CREATE new transaction
      const newTrans: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        date: dateObj,
        description: finalDesc,
        fromAccount: finalFrom,
        toAccount: finalTo,
        amount: parseFloat(newAmount),
        category: newCategory
      };
      setTransactions([newTrans, ...transactions]);
    }

    triggerFeedback('success', editingTransaction ? 'Entry updated' : 'Entry confirmed');
    closeModal();
  };

  const handleTypeChange = (type: 'expense' | 'income' | 'transfer') => {
    setEntryType(type);

    // Set smart defaults
    if (!editingTransaction) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      setNewDate(`${y}-${m}-${d}`);
    }

    if (type === 'expense') {
      setNewFrom('DSK');
      setNewTo('');
      setNewCategory('Food');
    } else if (type === 'income') {
      setNewFrom('');
      setNewTo('DSK');
      setNewCategory('Salary');
    } else {
      setNewFrom('DSK');
      setNewTo('Revolut');
      setNewCategory('Transfer');
    }
  };

  const startNewEntry = () => {
    handleTypeChange('expense'); // Default to expense
    setIsModalOpen(true);
  };

  const startNewEntryExplicit = (type: 'expense' | 'income' | 'transfer') => {
    handleTypeChange(type);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    // Directly delete without confirmation dialog to ensure functionality works
    setTransactions(prev => prev.filter(t => String(t.id) !== String(id)));
    triggerFeedback('success', 'Entry deleted');
  };

  const handleEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);

    // Format date for input "YYYY-MM-DD"
    const year = t.date.getFullYear();
    const month = String(t.date.getMonth() + 1).padStart(2, '0');
    const day = String(t.date.getDate()).padStart(2, '0');
    setNewDate(`${year}-${month}-${day}`);

    setNewDesc(t.description);
    setNewAmount(t.amount.toString());
    setNewCategory(t.category);

    // Handle From Account dropdown state
    const isKnownFrom = accounts.some(a => a.name === t.fromAccount) || t.fromAccount === 'External';
    if (isKnownFrom) {
      setNewFrom(t.fromAccount);
      setCustomFrom('');
    } else {
      setNewFrom('Custom');
      setCustomFrom(t.fromAccount);
    }

    // Handle To Account dropdown state
    const isKnownTo = accounts.some(a => a.name === t.toAccount) || t.toAccount === 'External';
    if (isKnownTo) {
      setNewTo(t.toAccount);
      setCustomTo('');
    } else {
      setNewTo('Custom');
      setCustomTo(t.toAccount);
    }

    // Determine entry type for UI
    if (t.category === 'Transfer') {
      setEntryType('transfer');
    } else if (incomeCategories.includes(t.category)) {
      setEntryType('income');
    } else {
      setEntryType('expense');
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setShowCalendar(false);
    setCategoryDropdownOpen(false);
    setShowAddCategoryField(false);
    setExtraCategoryName('');
    // Reset form
    setNewDate(new Date().toISOString().split('T')[0]);
    setViewDate(new Date());
    setNewDesc('');
    setNewAmount('');
    setCustomFrom('');
    setCustomTo('');
    setNewFrom('DSK');
    setNewTo('External');
    setNewCategory('Food');
    setEntryType('expense');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdateTransactionInline = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleAddAccount = (account: AccountSummary) => {
    setAccounts(prev => [...prev, account]);
    triggerFeedback('success', 'Account added');
  };

  const handleDeleteAccount = (name: string) => {
    setAccountToDelete(name);
  };

  const confirmDeleteAccount = () => {
    if (!accountToDelete) return;
    const name = accountToDelete;
    // Also delete all associated transactions
    setAccounts(prev => prev.filter(a => a.name !== name));
    setTransactions(prev => prev.filter(t => t.fromAccount !== name && t.toAccount !== name));
    triggerFeedback('success', 'Account removed');
    setAccountToDelete(null);
  };

  const handleUpdateAccount = (oldName: string, updatedAccount: AccountSummary) => {
    setAccounts(prev => prev.map(a => a.name === oldName ? updatedAccount : a));

    // If name changed, update all transactions associated with this account
    if (oldName !== updatedAccount.name) {
      setTransactions(prev => prev.map(t => {
        const newT = { ...t };
        if (t.fromAccount === oldName) newT.fromAccount = updatedAccount.name;
        if (t.toAccount === oldName) newT.toAccount = updatedAccount.name;
        return newT;
      }));
    }
    triggerFeedback('success', 'Account updated');
  };

  const startAddAccount = () => {
    setEditingAccount(null);
    setNewAccName('');
    setNewAccType('fiat');
    setNewAccCurrency('BGN');
    setNewAccInitialBalance('0');
    setIsAccountModalOpen(true);
  };

  const startEditAccount = (acc: AccountSummary) => {
    setEditingAccount(acc);
    setNewAccName(acc.name);
    setNewAccType(acc.type);
    setNewAccCurrency(acc.currency);
    setNewAccInitialBalance(''); // Not used during edit
    setIsAccountModalOpen(true);
  };

  const closeAccountModal = () => {
    setIsAccountModalOpen(false);
    setEditingAccount(null);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();

    // Manual Validation
    const missing = [];
    if (!newAccName.trim()) missing.push('Account Name');
    if (!newAccCurrency.trim()) missing.push('Currency/Unit');
    if (!newAccInitialBalance.trim()) missing.push('Starting Balance');

    if (missing.length > 0) {
      triggerFeedback('error', `Required: ${missing.join(' & ')}`);
      return;
    }

    const accountData: AccountSummary = {
      name: newAccName.trim(),
      type: newAccType,
      currency: newAccCurrency.trim().toUpperCase()
    };

    if (editingAccount) {
      handleUpdateAccount(editingAccount.name, accountData);
      closeAccountModal();
    } else {
      handleAddAccount(accountData);

      // Handle Initial Balance
      const initialAmt = parseFloat(newAccInitialBalance);
      if (!isNaN(initialAmt) && initialAmt > 0) {
        const initialTx: Transaction = {
          id: Date.now().toString(),
          date: new Date(),
          description: 'Opening Balance',
          amount: initialAmt,
          category: 'Income',
          fromAccount: 'Initial Balance',
          toAccount: accountData.name
        };
        setTransactions(prev => [initialTx, ...prev]);
        triggerFeedback('success', `Account created with ${initialAmt.toLocaleString()} starting balance`);
      } else {
        closeAccountModal();
      }
    }
  };

  const handleAddCategory = (type: 'expense' | 'income', name: string) => {
    if (type === 'expense') setExpenseCategories(prev => [...prev, name]);
    else setIncomeCategories(prev => [...prev, name]);
    triggerFeedback('success', 'Category added');
  };

  const handleDeleteCategory = (type: 'expense' | 'income', name: string) => {
    if (type === 'expense') setExpenseCategories(prev => prev.filter(c => c !== name));
    else setIncomeCategories(prev => prev.filter(c => c !== name));
    triggerFeedback('success', 'Category removed');
  };

  const handleRenameCategory = (type: 'expense' | 'income', oldName: string, newName: string) => {
    if (type === 'expense') {
      setExpenseCategories(prev => prev.map(c => c === oldName ? newName : c));
    } else {
      setIncomeCategories(prev => prev.map(c => c === oldName ? newName : c));
    }

    // Crucial: Update all transactions historical data to maintain integrity
    setTransactions(prev => prev.map(t =>
      t.category === oldName ? { ...t, category: newName } : t
    ));

    triggerFeedback('success', 'Category renamed');
  };

  const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center h-16 transition-all duration-300 font-black overflow-hidden group/btn relative
        ${active
            ? 'text-primary'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
      >
        {/* Active Indicator Bar */}
        {active && (
          <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full shadow-[0_0_15px_rgba(163,230,53,0.5)] animate-in slide-in-from-left-full duration-300" />
        )}

        {/* Fixed Width Icon Slot - No Background Square */}
        <div className="w-[85px] flex-shrink-0 flex items-center justify-center relative">
          <div className={`transition-all duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(163,230,53,0.3)]' : 'group-hover/btn:scale-110'}`}>
            {icon}
          </div>
        </div>

        {/* Label Slot */}
        <span className="ml-0 opacity-0 lg:group-hover:opacity-100 transition-all duration-500 uppercase text-[11px] tracking-[0.2em] whitespace-nowrap">
          {label}
        </span>
      </button>
    );
  };

  const MobileNavButton = ({ active, onClick, icon, label }: any) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full py-1 transition-colors ${active ? 'text-primary' : 'text-gray-500'}`}
    >
      <div className={`p-1.5 rounded-full transition-all ${active ? 'bg-primary/10' : ''}`}>
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
      <span className="text-[10px] font-bold mt-0.5 uppercase tracking-tighter">{label}</span>
    </button>
  );

  const ThemeToggle = () => (
    <button
      onClick={toggleDarkMode}
      className="p-2.5 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10"
      title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {darkMode ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
      )}
    </button>
  );

  if (isInitializingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6 transition-colors duration-500">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tighter text-primary mb-4 animate-pulse" style={{ fontFamily: "'Outfit', sans-serif" }}>
            EKSPENSE
          </h1>
          <div className="w-12 h-1 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthView onAuthSuccess={() => { }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row font-sans text-gray-900 dark:text-gray-100 transition-colors duration-500">

      {/* Mobile Header (Top) */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-white z-50 px-4 h-16 flex items-center justify-between shadow-xl border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-black tracking-tighter text-primary" style={{ fontFamily: "'Outfit', sans-serif" }}>EKSPENSE</h1>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={targetMonth}
            onChange={(e) => setTargetMonth(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[10px] font-bold rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none uppercase"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <button
            onClick={toggleDarkMode}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          <button
            onClick={() => startNewEntry()}
            className="bg-primary hover:bg-primary-dark active:scale-95 text-gray-950 p-2 rounded-lg shadow-lg shadow-primary/20 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          </button>

          {activeTab === 'accounts' && (
            <button
              onClick={() => startAddAccount()}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-950 p-2 rounded-lg shadow-lg active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </button>
          )}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex group w-[85px] hover:w-72 bg-white dark:bg-gray-950 text-gray-900 dark:text-white flex-shrink-0 h-screen sticky top-0 flex-col border-r border-gray-200 dark:border-white/5 shadow-2xl z-40 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden">
        <div className="py-10 flex items-center">
          <div className="w-[85px] flex-shrink-0 flex items-center justify-center">
            <div className="text-3xl font-black text-primary tracking-tighter transform lg:group-hover:scale-110 transition-transform duration-500 select-none">E</div>
          </div>
          <div className="opacity-0 lg:group-hover:opacity-100 transition-all duration-500 whitespace-nowrap hidden lg:group-hover:block">
            <h1 className="text-2xl font-black tracking-tighter text-primary" style={{ fontFamily: "'Outfit', sans-serif" }}>EKSPENSE</h1>
            <p className="text-gray-500 text-[8px] font-bold uppercase tracking-[0.2em] px-1">Modern Finance</p>
          </div>
        </div>

        <nav className="py-6 space-y-4 flex-1 overflow-x-hidden">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<DashboardIcon className="w-6 h-6" />} label={getTranslation(language, 'overview')} />
          <NavButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<TransactionsIcon className="w-6 h-6" />} label={getTranslation(language, 'transactions')} />
          <NavButton active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} icon={<AccountsIcon className="w-6 h-6" />} label={getTranslation(language, 'accounts')} />
          <NavButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<AnalyticsIcon className="w-6 h-6" />} label={getTranslation(language, 'analytics')} />
          <NavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} icon={<CategoriesIcon className="w-6 h-6" />} label={getTranslation(language, 'categories')} />
        </nav>

        {/* Bottom Utility Area */}
        <div className="pb-4 space-y-2">
          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon className="w-6 h-6" />} label={getTranslation(language, 'settings')} />
          <button
            onClick={handleLogout}
            className="w-full flex items-center h-16 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 font-black overflow-hidden group/logout"
          >
            <div className="w-[85px] flex-shrink-0 flex items-center justify-center">
              <svg className="w-6 h-6 group-hover/logout:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className="opacity-0 lg:group-hover:opacity-100 transition-all duration-500 uppercase text-[11px] tracking-[0.2em] whitespace-nowrap">
              Log Out
            </span>
          </button>
        </div>

        {/* Footer Controls: Period Only */}
        <div className="border-t border-gray-100 dark:border-white/5 py-6">
          <div className="flex flex-col space-y-1">
            {/* Period Selector */}
            <div className="flex items-center h-14 group/period cursor-pointer">
              <div className="w-[85px] flex-shrink-0 flex items-center justify-center text-gray-400 group-hover/period:text-primary transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className="opacity-0 lg:group-hover:opacity-100 transition-all duration-500 flex-1 pr-6 pointer-events-none lg:group-hover:pointer-events-auto">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-0.5">Period</label>
                <div className="relative flex items-center">
                  <select
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className="w-full bg-transparent border-none text-gray-900 dark:text-white text-xs font-black focus:ring-0 outline-none uppercase p-0 appearance-none cursor-pointer"
                  >
                    {availableMonths.map(m => (
                      <option key={m} value={m} className="bg-white dark:bg-gray-900">{m}</option>
                    ))}
                  </select>
                  <svg className="w-3 h-3 text-gray-400 absolute right-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl z-50 flex justify-around items-center h-20 px-2 shadow-2xl">
        <MobileNavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<DashboardIcon />} label="Home" />
        <MobileNavButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<TransactionsIcon />} label="Transactions" />
        <MobileNavButton active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} icon={<AccountsIcon />} label="Accounts" />
        <MobileNavButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<AnalyticsIcon />} label="Data" />
        <MobileNavButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} icon={<CategoriesIcon />} label="Config" />
        <MobileNavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon />} label="More" />
      </nav>

      {/* Main Content */}
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen scroll-smooth">
        <div className="max-w-7xl mx-auto p-6 pt-24 pb-32 md:p-12 md:pt-12 md:pb-12">
          <header className="hidden md:flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white capitalize tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {activeTab === 'dashboard' ? getTranslation(language, 'dashboard') : getTranslation(language, activeTab)}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium h-5">
                {activeTab === 'dashboard' ? `${getTranslation(language, 'financial_status')} ${targetMonth}` : `${getTranslation(language, 'manage_your')} ${getTranslation(language, activeTab)}`}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {activeTab === 'accounts' && (
                <button
                  onClick={() => startAddAccount()}
                  className="bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white px-6 py-3 rounded-2xl border border-gray-200 dark:border-white/10 flex items-center space-x-2 transition-all hover:bg-gray-200 dark:hover:bg-white/10 font-bold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                  <span>{getTranslation(language, 'add_account')}</span>
                </button>
              )}
              <button
                onClick={() => startNewEntry()}
                className="bg-primary hover:bg-primary-dark text-gray-950 px-6 py-3 rounded-2xl shadow-xl shadow-primary/20 flex items-center space-x-2 transition-all transform hover:scale-105 font-bold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                <span>{getTranslation(language, 'new_entry')}</span>
              </button>
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <Dashboard
              transactions={transactions}
              targetMonth={targetMonth}
              availableMonths={availableMonths}
              onMonthChange={setTargetMonth}
              accounts={accounts}
              language={language}
            />
          )}
          {activeTab === 'transactions' && (
            <TransactionList
              transactions={transactions}
              onUpdateTransaction={handleUpdateTransactionInline}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              language={language}
            />
          )}
          {activeTab === 'accounts' && (
            <AccountsView
              transactions={transactions}
              accounts={accounts}
              onAddAccount={handleAddAccount}
              onUpdateAccount={handleUpdateAccount}
              onDeleteAccount={handleDeleteAccount}
              onEditAccount={startEditAccount}
              language={language}
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsView
              transactions={transactions}
              currentMonth={targetMonth}
              availableMonths={availableMonths}
              onMonthChange={setTargetMonth}
              incomeCategories={incomeCategories}
              accounts={accounts}
              language={language}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesView
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onRenameCategory={handleRenameCategory}
              language={language}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              language={language}
              setLanguage={setLanguage}
            />
          )}
        </div>
      </main>


      {/* Add/Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-950/80 flex items-end sm:items-center justify-center z-[60] backdrop-blur-md p-0 sm:p-4">
          <div className="bg-slate-50 dark:bg-gray-900 rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/5 animate-in fade-in zoom-in-95 duration-400 relative">
            <div className="flex justify-between items-center mb-5 relative z-10">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${entryType === 'expense' ? 'bg-red-500/10 text-red-500' : entryType === 'income' ? 'bg-primary/10 text-primary-dark' : 'bg-blue-500/10 text-blue-500'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">
                    {editingTransaction ? 'Edit Entry' : `${entryType} Entry`}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Configure Details</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex p-1 bg-gray-100 dark:bg-gray-850 rounded-xl mb-6 border border-gray-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-[10px] font-black transition-all ${entryType === 'expense' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}
              >
                EXPENSE
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-[10px] font-black transition-all ${entryType === 'income' ? 'bg-primary text-gray-950 shadow-lg' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}
              >
                INCOME
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('transfer')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-[10px] font-black transition-all ${entryType === 'transfer' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}
              >
                TRANSFER
              </button>
            </div>


            <form onSubmit={handleSaveTransaction} noValidate className="space-y-4 relative z-10">
              <div ref={calendarRef}>
                <label className={`block text-[9px] font-black uppercase tracking-[0.2em] mb-2 px-1 ${entryType === 'expense' ? 'text-red-500' : entryType === 'income' ? 'text-primary' : 'text-blue-500'}`}>Date Selection</label>


                <button
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className={`w-full h-12 flex items-center justify-between bg-white dark:bg-gray-850 border border-gray-200 dark:border-white/5 rounded-xl px-4 transition-all group ${entryType === 'expense' ? 'hover:border-red-500/30' : entryType === 'income' ? 'hover:border-primary/30' : 'hover:border-blue-500/30'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg transition-all ${entryType === 'expense'
                      ? 'bg-red-500/20 text-red-400 group-hover:bg-red-500 group-hover:text-white'
                      : entryType === 'income'
                        ? 'bg-primary/20 text-primary group-hover:bg-primary group-hover:text-gray-950'
                        : 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white'
                      }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                      {(() => {
                        const [y, m, d] = newDate.split('-').map(Number);
                        return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
                      })()}
                    </span>
                  </div>
                  <svg className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${showCalendar ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {showCalendar && (
                  <div className="mt-3 bg-white dark:bg-gray-850 border border-gray-200 dark:border-white/5 rounded-[2.5rem] p-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6 px-2">
                      <div className="flex flex-col">
                        <span className={`text-xs font-black uppercase tracking-[0.2em] ${entryType === 'expense' ? 'text-red-500' : entryType === 'income' ? 'text-primary-dark' : 'text-blue-500'
                          }`}>
                          {viewDate.getFullYear()}
                        </span>
                        <span className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                          {viewDate.toLocaleDateString(undefined, { month: 'long' })}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(viewDate);
                            d.setMonth(d.getMonth() - 1);
                            setViewDate(d);
                          }}
                          className={`p-3 rounded-2xl bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 transition-all border border-gray-200 dark:border-white/5 hover:shadow-lg ${entryType === 'expense' ? 'hover:text-red-500' : entryType === 'income' ? 'hover:text-primary-dark' : 'hover:text-blue-500'
                            }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(viewDate);
                            d.setMonth(d.getMonth() + 1);
                            setViewDate(d);
                          }}
                          className={`p-3 rounded-2xl bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 transition-all border border-gray-200 dark:border-white/5 hover:shadow-lg ${entryType === 'expense' ? 'hover:text-red-500' : entryType === 'income' ? 'hover:text-primary-dark' : 'hover:text-blue-500'
                            }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 mb-2">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-[10px] font-black text-gray-500 dark:text-gray-400 py-2">{day}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const year = viewDate.getFullYear();
                        const month = viewDate.getMonth();
                        const firstDayDate = new Date(year, month, 1);
                        let firstDay = firstDayDate.getDay();
                        firstDay = firstDay === 0 ? 6 : firstDay - 1;
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const calendarDays = [];
                        for (let i = 0; i < firstDay; i++) {
                          calendarDays.push(<div key={`pad-${i}`} className="p-2"></div>);
                        }
                        for (let d = 1; d <= daysInMonth; d++) {
                          const dateObj = new Date(year, month, d);
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const isSelected = dateStr === newDate;

                          const today = new Date();
                          const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                          let cellClass = 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white';
                          if (isSelected) {
                            cellClass = entryType === 'expense'
                              ? 'bg-red-500 text-white shadow-xl shadow-red-500/30 scale-110 z-10'
                              : entryType === 'income'
                                ? 'bg-primary text-gray-950 shadow-xl shadow-primary/30 scale-110 z-10'
                                : 'bg-blue-500 text-white shadow-xl shadow-blue-500/30 scale-110 z-10';
                          } else if (isToday) {
                            cellClass = entryType === 'expense'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                              : entryType === 'income'
                                ? 'bg-primary/10 text-primary-dark border border-primary/20'
                                : 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
                          }

                          calendarDays.push(
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                setNewDate(dateStr);
                                setShowCalendar(false);
                              }}
                              className={`relative flex items-center justify-center aspect-square rounded-2xl text-sm font-bold transition-all ${cellClass}`}
                            >
                              {d}
                              {isToday && !isSelected && (
                                <div className={`absolute bottom-1.5 w-1 h-1 rounded-full animate-pulse ${entryType === 'expense' ? 'bg-red-500' : entryType === 'income' ? 'bg-primary' : 'bg-blue-500'
                                  }`}></div>
                              )}
                            </button>
                          );
                        }
                        return calendarDays;
                      })()}
                    </div>

                    <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/5 flex justify-between items-center px-2">
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const y = today.getFullYear();
                          const m = String(today.getMonth() + 1).padStart(2, '0');
                          const d = String(today.getDate()).padStart(2, '0');
                          setNewDate(`${y}-${m}-${d}`);
                          setViewDate(today);
                          setShowCalendar(false);
                        }}
                        className={`text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-all flex items-center space-x-1 ${entryType === 'expense' ? 'text-red-500' : entryType === 'income' ? 'text-primary-dark' : 'text-blue-500'
                          }`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        <span>Today</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-[9px] font-black uppercase tracking-[0.2em] mb-2 px-1 ${entryType === 'expense' ? 'text-red-500' : entryType === 'income' ? 'text-primary' : 'text-blue-500'}`}>Brief Description</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Groceries"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className={`w-full h-12 bg-white dark:bg-gray-850 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-xl px-4 focus:ring-2 outline-none placeholder:text-gray-400 font-bold shadow-sm focus:bg-white/10 transition-all ${entryType === 'expense' ? 'focus:ring-red-500 hover:border-red-500/30' : entryType === 'income' ? 'focus:ring-primary hover:border-primary/30' : 'focus:ring-blue-500 hover:border-blue-500/30'
                    }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* From Account or Source */}
                <div className="relative" ref={fromRef}>
                  <label className={`block text-[9px] font-black uppercase tracking-[0.2em] mb-2 px-1 ${entryType === 'expense' ? 'text-red-500' : entryType === 'income' ? 'text-primary' : 'text-blue-500'}`}>
                    {entryType === 'income' ? 'Source' : 'From Account'}
                  </label>

                  {entryType === 'income' ? (
                    <input
                      type="text"
                      placeholder="Source..."
                      value={newFrom}
                      onChange={(e) => setNewFrom(e.target.value)}
                      className={`w-full h-12 bg-white dark:bg-gray-850 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-xl px-4 focus:ring-2 outline-none font-bold placeholder:text-gray-400 shadow-sm focus:bg-white/10 transition-all ${entryType === 'expense' ? 'focus:ring-red-500 hover:border-red-500/30' : entryType === 'income' ? 'focus:ring-primary hover:border-primary/30' : 'focus:ring-blue-500 hover:border-blue-500/30'
                        }`}
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setFromDropdownOpen(!fromDropdownOpen);
                          setToDropdownOpen(false);
                        }}
                        className={`w-full h-12 flex items-center justify-between bg-white dark:bg-gray-850 border border-gray-200 dark:border-white/5 rounded-xl px-4 transition-all group shadow-sm ${entryType === 'expense' ? 'hover:border-red-500/30' : entryType === 'income' ? 'hover:border-primary/30' : 'hover:border-blue-500/30'
                          } ${fromDropdownOpen ? (entryType === 'expense' ? 'border-red-500/50' : 'border-blue-500/50') : ''
                          }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${newFrom === 'External' || newFrom === 'Custom'
                            ? 'bg-gray-400'
                            : (entryType === 'expense' ? 'bg-red-500' : 'bg-blue-500')
                            }`}></div>
                          <span className="text-sm font-black text-gray-900 dark:text-white truncate">
                            {newFrom}
                          </span>
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${fromDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>

                      {fromDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {accounts.map(a => (
                              <button
                                key={a.name}
                                type="button"
                                onClick={() => { setNewFrom(a.name); setFromDropdownOpen(false); }}
                                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${newFrom === a.name
                                  ? (entryType === 'expense' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500')
                                  : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                                  }`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full ${newFrom === a.name ? 'bg-current' : 'bg-gray-400'}`}></div>
                                <span>{a.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Right Side: Destination (To Account or Recipient) */}
                <div className="relative" ref={toRef}>
                  <label className={`block text-[9px] font-black uppercase tracking-[0.2em] mb-2 px-1 ${entryType === 'expense' ? 'text-red-500' : entryType === 'income' ? 'text-primary' : 'text-blue-500'}`}>Financial Target</label>
                  <div className="relative">
                    {entryType === 'expense' ? (
                      <input
                        type="text"
                        placeholder="Recipient..."
                        value={newTo}
                        onChange={(e) => setNewTo(e.target.value)}
                        className={`w-full h-12 bg-white dark:bg-gray-850 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-xl px-4 focus:ring-2 outline-none font-bold placeholder:text-gray-400 shadow-sm focus:bg-white/10 transition-all ${entryType === 'expense' ? 'focus:ring-red-500 hover:border-red-500/30' : entryType === 'income' ? 'focus:ring-primary hover:border-primary/30' : 'focus:ring-blue-500 hover:border-blue-500/30'
                          }`}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setToDropdownOpen(!toDropdownOpen);
                          setFromDropdownOpen(false);
                        }}
                        className={`w-full h-12 flex items-center justify-between bg-white dark:bg-gray-850 border border-gray-200 dark:border-white/5 rounded-xl px-4 transition-all group shadow-sm ${entryType === 'expense' ? 'hover:border-red-500/30' : entryType === 'income' ? 'hover:border-primary/30' : 'hover:border-blue-500/30'
                          } ${toDropdownOpen ? (entryType === 'income' ? 'border-primary/50' : 'border-blue-500/50') : ''
                          }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <div className={`p-2 rounded-lg ${entryType === 'income' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-400'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                          </div>
                          <span className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">
                            {newTo || 'Select Target'}
                          </span>
                        </div>
                        <svg className={`w-5 h-5 text-gray-500 transition-transform ${toDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    )}
                    {toDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                          {/* No External for Trans/Income landing side if forced to accounts */}
                          {accounts.map(a => (
                            <button
                              key={a.name}
                              type="button"
                              onClick={() => { setNewTo(a.name); setToDropdownOpen(false); }}
                              className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${newTo === a.name
                                ? (entryType === 'income' ? 'bg-primary/10 text-primary-dark' : 'bg-blue-500/10 text-blue-500')
                                : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${newTo === a.name ? 'bg-current' : 'bg-gray-400'}`}></div>
                              <span>{a.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={entryType === 'transfer' ? 'col-span-2' : ''}>
                  <label className={`block text-[9px] font-black uppercase tracking-[0.2em] mb-2 px-1 ${entryType === 'expense' ? 'text-red-500' : entryType === 'income' ? 'text-primary' : 'text-blue-500'}`}>Amount (BGN)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className={`w-full h-12 bg-white dark:bg-gray-850 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-xl px-4 focus:ring-2 outline-none font-bold placeholder:text-gray-400 shadow-sm focus:bg-white/10 transition-all ${entryType === 'expense' ? 'focus:ring-red-500 hover:border-red-500/30' : entryType === 'income' ? 'focus:ring-primary hover:border-primary/30' : 'focus:ring-blue-500 hover:border-blue-500/30'
                      }`}
                    placeholder="0.00"
                  />
                </div>

                {entryType !== 'transfer' && (
                  <div className="relative" ref={categoryRef}>
                    <label className={`block text-[9px] font-black uppercase tracking-[0.2em] mb-2 px-1 ${entryType === 'expense' ? 'text-red-500' : entryType === 'income' ? 'text-primary' : 'text-blue-500'}`}>Category</label>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryDropdownOpen(!categoryDropdownOpen);
                        setFromDropdownOpen(false);
                        setToDropdownOpen(false);
                      }}
                      className={`w-full h-12 flex items-center justify-between bg-white dark:bg-gray-850 border border-gray-200 dark:border-white/5 rounded-xl px-4 transition-all group shadow-sm ${entryType === 'expense' ? 'hover:border-red-500/30' : entryType === 'income' ? 'hover:border-primary/30' : 'hover:border-blue-500/30'
                        } ${categoryDropdownOpen ? (entryType === 'expense' ? 'border-red-500/50' : 'border-primary/50') : ''
                        }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className={`p-1.5 rounded-lg ${entryType === 'expense' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary-dark'
                          }`}>
                          {getCategoryIcon(newCategory, 'w-4 h-4')}
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {newCategory}
                        </span>
                      </div>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {categoryDropdownOpen && (
                      <div className="absolute bottom-full -left-[calc(100%+16px)] -right-0 mb-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                        <div className="max-h-80 overflow-y-auto p-3 grid grid-cols-1 gap-1 custom-scrollbar">
                          {(entryType === 'expense' ? expenseCategories : incomeCategories).map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => { setNewCategory(c); setCategoryDropdownOpen(false); }}
                              className={`w-full flex items-center space-x-4 p-3.5 rounded-xl text-left transition-all ${newCategory === c
                                ? (entryType === 'expense' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-primary text-gray-950 shadow-lg shadow-primary/20')
                                : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                              <div className={`flex-shrink-0 p-2 rounded-lg ${newCategory === c ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5'}`}>
                                {getCategoryIcon(c, 'w-5 h-5')}
                              </div>
                              <span className="text-sm font-bold">{c}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] shadow-2xl relative overflow-hidden group/submit ${entryType === 'expense'
                  ? 'bg-red-500 text-white shadow-red-500/30'
                  : entryType === 'income'
                    ? 'bg-primary text-gray-950 shadow-primary/30'
                    : 'bg-blue-500 text-white shadow-blue-500/30'
                  }`}
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/submit:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                <span className="relative z-10">
                  {editingTransaction ? 'Confirm Modification' : `Finalize ${entryType}`}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 bg-gray-950/80 flex items-center justify-center z-[160] backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-gray-950 border border-white/10 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-black text-white text-center mb-1 uppercase tracking-tighter">Liquidate Account?</h3>
            <p className="text-[11px] text-gray-500 text-center mb-6 font-medium leading-relaxed px-4">
              Permanent removal of <span className="text-white font-black">"{accountToDelete}"</span>. History will be erased.
            </p>
            <div className="flex flex-col space-y-2">
              <button
                onClick={confirmDeleteAccount}
                className="w-full bg-red-500 hover:bg-red-600 text-white text-[10px] font-black py-3.5 rounded-xl transition-all shadow-lg shadow-red-500/10 active:scale-95 uppercase tracking-widest"
              >
                Execute
              </button>
              <button
                onClick={() => setAccountToDelete(null)}
                className="w-full bg-white/5 text-gray-500 hover:text-white text-[10px] font-black py-3.5 rounded-xl transition-all uppercase tracking-widest"
              >
                Retain
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Status Feedback Overlay (Compact Toast) */}
      {feedback.show && (
        <div className={`fixed bottom-8 right-8 z-[100] pointer-events-none ${feedback.isExiting ? 'toast-exit' : 'toast-enter'}`}>
          <div className="bg-white/80 dark:bg-gray-900/40 backdrop-blur-3xl border border-gray-200 dark:border-white/20 p-6 rounded-3xl shadow-2xl flex flex-col items-center min-w-[200px]">
            <div className="relative w-16 h-16 mb-3">
              {/* Circular Progress SVG */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24" cy="24" r="21"
                  className="stroke-gray-100 dark:stroke-white/5"
                  strokeWidth="3"
                  fill="none"
                />
                <circle
                  cx="24" cy="24" r="21"
                  className={`${feedback.type === 'success' ? 'stroke-primary' : 'stroke-red-500'}`}
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="132"
                  strokeDashoffset="132"
                  strokeLinecap="round"
                  style={{ animation: 'timer-circle 2500ms linear forwards' }}
                />
              </svg>

              <div className={`absolute inset-0 flex items-center justify-center ${feedback.type === 'success' ? 'text-primary' : 'text-red-500'}`}>
                {feedback.type === 'success' ? (
                  <svg className="w-6 h-6 animate-in zoom-in-50 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-dash" strokeDasharray={100} strokeDashoffset={100} />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 animate-in slide-in-from-top-2 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white mb-1">
              {feedback.type === 'success' ? 'Success' : 'Task Failed'}
            </h4>
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 text-center">
              {feedback.message}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        .toast-enter {
          animation: toast-enter-spring 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .toast-exit {
          animation: toast-exit-warp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes toast-enter-spring {
          from { transform: translateX(100%) scale(0.9); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes toast-exit-warp {
          0% { transform: translateX(0) scale(1); opacity: 1; filter: blur(0px); }
          30% { transform: translateX(-10px) scale(1.02); opacity: 1; }
          100% { transform: translateX(120%) scale(0.8); opacity: 0; filter: blur(12px); }
        }
        .animate-dash {
          animation: dash 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
          animation-delay: 0.2s;
        }
        @keyframes timer-circle {
          from { stroke-dashoffset: 132; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
      {/* Add/Edit Account Modal Overlay */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-xl z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gray-50/50 dark:bg-gray-950/30 p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-inner">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">{editingAccount ? 'Modified Account' : 'New Account'}</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configure parameters</p>
                </div>
              </div>
              <button
                onClick={closeAccountModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSaveAccount} noValidate className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Identity & Naming</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Daily spending"
                    value={newAccName}
                    onChange={e => setNewAccName(e.target.value)}
                    className="w-full h-12 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-white/5 rounded-xl pl-12 pr-4 text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-800"
                    autoFocus
                  />
                </div>
              </div>

              {!editingAccount && (
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Starting Liquidity</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-xs font-black text-gray-400 group-focus-within:text-primary transition-colors">$</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={newAccInitialBalance}
                      onChange={e => setNewAccInitialBalance(e.target.value)}
                      className="w-full h-12 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-white/5 rounded-xl pl-12 pr-4 text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-800"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Asset Class</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <select
                      value={newAccType}
                      onChange={e => setNewAccType(e.target.value as any)}
                      className="w-full h-12 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-white/5 rounded-xl pl-12 pr-4 text-xs font-bold uppercase text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer focus:bg-white dark:focus:bg-gray-800 dark:text-white"
                    >
                      <option value="fiat" className="bg-white dark:bg-gray-900">Fiat</option>
                      <option value="savings" className="bg-white dark:bg-gray-900">Savings</option>
                      <option value="cash" className="bg-white dark:bg-gray-900">Cash</option>
                      <option value="other" className="bg-white dark:bg-gray-900">Other</option>
                    </select>
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Monetary Unit</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-xs font-black text-gray-400 group-focus-within:text-primary transition-colors">$</span>
                    </div>
                    <input
                      type="text"
                      placeholder="BGN"
                      value={newAccCurrency}
                      onChange={e => setNewAccCurrency(e.target.value)}
                      className="w-full h-12 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-white/5 rounded-xl pl-12 pr-4 text-xs font-bold uppercase text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeAccountModal}
                  className="px-6 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-950 text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-xl active:scale-95 hover:opacity-90"
                >
                  {editingAccount ? 'Apply Mods' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;


