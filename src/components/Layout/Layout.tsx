import { Outlet, Link, useLocation } from 'react-router-dom';
import { PlusCircle, Settings, Library, Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

export function Layout() {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { path: '/', icon: Library, label: 'Library' },
        { path: '/create', icon: PlusCircle, label: 'New' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col md:flex-row transition-colors duration-200">
            {/* Mobile Bottom Nav / Desktop Sidebar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 md:relative md:w-64 md:border-t-0 md:border-r md:flex-col md:p-6 z-50 flex flex-row items-center justify-between md:items-stretch md:justify-start">
                <div className="hidden md:block mb-8">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ShadowLoop</h1>
                </div>

                <ul className="flex justify-around md:flex-col md:space-y-2 flex-1 w-full">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={cn(
                                        "flex flex-col md:flex-row items-center p-2 rounded-xl transition-all duration-200",
                                        isActive
                                            ? "text-indigo-400 bg-indigo-500/10"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                                    )}
                                >
                                    <Icon className="w-6 h-6 md:w-5 md:h-5 md:mr-3" />
                                    <span className="text-xs md:text-sm font-medium mt-1 md:mt-0">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <button
                    onClick={toggleTheme}
                    className="hidden md:flex items-center gap-3 px-2 py-2 mt-auto text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
            </nav>

            <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                <div className="max-w-5xl mx-auto p-4 md:p-8 pt-6 pb-24 md:pb-8 relative">
                    {/* Mobile Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="md:hidden absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                    </button>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
