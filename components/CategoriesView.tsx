import React, { useState } from 'react';
import { getCategoryIcon } from './CategoryIcons';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';

interface CategoriesViewProps {
    expenseCategories: string[];
    incomeCategories: string[];
    onAddCategory: (type: 'expense' | 'income', name: string) => void;
    onDeleteCategory: (type: 'expense' | 'income', name: string) => void;
    onRenameCategory: (type: 'expense' | 'income', oldName: string, newName: string) => void;
}

const CategoriesView: React.FC<CategoriesViewProps> = ({
    expenseCategories,
    incomeCategories,
    onAddCategory,
    onDeleteCategory,
    onRenameCategory
}) => {
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
    const [newName, setNewName] = useState('');
    const [editingCat, setEditingCat] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const currentCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;
    const defaultList = activeTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            onAddCategory(activeTab, newName.trim());
            setNewName('');
        }
    };

    const startEditing = (cat: string) => {
        setEditingCat(cat);
        setEditValue(cat);
    };

    const submitRename = () => {
        if (editingCat && editValue.trim() && editValue !== editingCat) {
            onRenameCategory(activeTab, editingCat, editValue.trim());
        }
        setEditingCat(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Category Manager</h3>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Configure your financial buckets</p>
                </div>

                <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('expense')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'expense' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        EXPENSES
                    </button>
                    <button
                        onClick={() => setActiveTab('income')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'income' ? 'bg-primary text-gray-950 shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        INCOME
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Category List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentCategories.map((cat) => {
                            const isDefault = defaultList.includes(cat);
                            const isEditing = editingCat === cat;

                            return (
                                <div
                                    key={cat}
                                    className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-black/5"
                                >
                                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                                        <div className={`p-3 rounded-xl flex-shrink-0 ${activeTab === 'expense' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary-dark'}`}>
                                            {getCategoryIcon(cat, "w-5 h-5")}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {isEditing ? (
                                                <div className="relative flex items-center animate-in zoom-in-95 duration-200">
                                                    <input
                                                        autoFocus
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') submitRename();
                                                            if (e.key === 'Escape') setEditingCat(null);
                                                        }}
                                                        className={`w-full bg-gray-50 dark:bg-white/5 border-2 rounded-xl px-3 py-1.5 text-sm font-black text-gray-900 dark:text-white outline-none transition-all ${activeTab === 'expense'
                                                            ? 'border-red-500/50 focus:border-red-500 shadow-lg shadow-red-500/10'
                                                            : 'border-primary/50 focus:border-primary shadow-lg shadow-primary/10'
                                                            }`}
                                                    />
                                                    <div className="absolute right-2 flex items-center space-x-1">
                                                        <button
                                                            onMouseDown={(e) => { e.preventDefault(); submitRename(); }}
                                                            className={`p-1 rounded-md transition-colors ${activeTab === 'expense' ? 'text-red-500 hover:bg-red-500/10' : 'text-primary hover:bg-primary/10'}`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                        <button
                                                            onMouseDown={(e) => { e.preventDefault(); setEditingCat(null); }}
                                                            className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <h4
                                                        onClick={() => startEditing(cat)}
                                                        className="text-sm font-bold text-gray-900 dark:text-white truncate cursor-text hover:text-primary transition-colors"
                                                    >
                                                        {cat}
                                                    </h4>
                                                </div>
                                            )}
                                            {!isEditing && (
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">
                                                    {isDefault ? 'Default Category' : 'Custom Category'}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {!isEditing && (
                                        <div className="flex items-center space-x-1">
                                            <button
                                                onClick={() => startEditing(cat)}
                                                className={`p-2.5 rounded-xl text-gray-600 dark:text-gray-400 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 ${activeTab === 'expense'
                                                    ? 'hover:text-red-500 hover:bg-red-500/10'
                                                    : 'hover:text-primary hover:bg-primary/10'
                                                    }`}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => onDeleteCategory(activeTab, cat)}
                                                className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-white/5 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">Create New</h4>
                            <form onSubmit={handleAdd} noValidate className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest px-1">Category Name</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g. Subscriptions"
                                        className="w-full bg-white dark:bg-gray-850 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-gray-400 shadow-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all transform active:scale-95 shadow-xl ${activeTab === 'expense' ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-primary text-gray-950 shadow-primary/20'}`}
                                >
                                    Add {activeTab} Category
                                </button>
                            </form>
                        </div>
                        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 ${activeTab === 'expense' ? 'bg-red-500' : 'bg-primary'}`}></div>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 p-6 rounded-3xl text-center">
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed font-bold uppercase tracking-widest">
                            Broad categories = Better analytics
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoriesView;
