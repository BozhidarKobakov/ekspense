import React from 'react';
import { getTranslation } from '../translations';

interface SettingsViewProps {
    darkMode: boolean;
    toggleDarkMode: () => void;
    language: string;
    setLanguage: (lang: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
    darkMode,
    toggleDarkMode,
    language,
    setLanguage
}) => {
    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'ru', name: 'Russian', flag: '🇷🇺' },
        { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
        { code: 'de', name: 'German', flag: '🇩🇪' }
    ];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-24">
            {/* Header */}
            <div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{getTranslation(language, 'settings')}</h3>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-2">Personalize your experience</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Theme Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 p-8 rounded-[2.5rem] shadow-xl shadow-black/5 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary-dark">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{getTranslation(language, 'appearance')}</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-3xl border border-transparent hover:border-primary/20 transition-all">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{getTranslation(language, 'dark_mode')}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Easier on the eyes</p>
                                </div>
                                <button
                                    onClick={toggleDarkMode}
                                    className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none ${darkMode ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Abstract background shape */}
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                </div>

                {/* Language Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 p-8 rounded-[2.5rem] shadow-xl shadow-black/5 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary-dark">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                            </div>
                            <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{getTranslation(language, 'localization')}</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setLanguage(lang.code)}
                                    className={`p-4 rounded-[1.5rem] border-2 transition-all text-left flex flex-col items-center justify-center space-y-2
                                        ${language === lang.code
                                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                            : 'border-transparent bg-gray-50 dark:bg-white/5 hover:border-primary/30'}`}
                                >
                                    <span className="text-2xl">{lang.flag}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${language === lang.code ? 'text-primary-dark' : 'text-gray-600'}`}>
                                        {lang.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Abstract background shape */}
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/2 rounded-full blur-3xl group-hover:bg-primary/5 transition-colors" />
                </div>
            </div>

            {/* Application Info */}
            <div className="bg-blue-600/5 dark:bg-primary/10 border border-blue-600/10 dark:border-primary/20 p-8 rounded-[2.5rem] flex items-center justify-between text-center md:text-left flex-col md:flex-row gap-6">
                <div>
                    <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">EKSPENSE v1.0.4</h4>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Built for modern financial mastery</p>
                </div>
                <div className="flex space-x-4">
                    <div className="px-6 py-3 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Update Channel</p>
                        <p className="text-sm font-black text-primary uppercase">Stable</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
