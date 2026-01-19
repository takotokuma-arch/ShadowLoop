import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { validateApiKey } from '../lib/gemini';
import { db } from '../db/db';
import { CheckCircle, AlertCircle, Download, Upload, Loader2, Save } from 'lucide-react';

export function SettingsPage() {
    const { apiKey, setApiKey } = useAuth();
    const [inputKey, setInputKey] = useState(apiKey || '');
    const [isValidating, setIsValidating] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSave = async () => {
        if (!inputKey.trim()) {
            setApiKey(null);
            setStatus('idle');
            return;
        }

        setIsValidating(true);
        setStatus('idle');
        setErrorMsg('');

        const isValid = await validateApiKey(inputKey);

        if (isValid) {
            setApiKey(inputKey);
            setStatus('success');
        } else {
            setStatus('error');
            setErrorMsg('Invalid API Key. Please check and try again.');
        }
        setIsValidating(false);
    };

    const handleExport = async () => {
        const materials = await db.materials.toArray();
        const settings = await db.settings.toArray();
        const backup = {
            version: 1,
            date: new Date().toISOString(),
            materials,
            settings
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shadowloop_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('This will overwrite existing data. Are you sure?')) {
            e.target.value = ''; // Reset input
            return;
        }

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.materials || !Array.isArray(data.materials)) {
                throw new Error('Invalid backup file format');
            }

            await db.transaction('rw', db.materials, db.settings, async () => {
                await db.materials.clear();
                await db.materials.bulkAdd(data.materials);

                if (data.settings && Array.isArray(data.settings)) {
                    await db.settings.clear();
                    await db.settings.bulkAdd(data.settings);
                }
            });

            alert('Import successful!');
        } catch (err) {
            console.error(err);
            alert('Import failed: ' + (err as Error).message);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-12">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">Settings</h2>
                <p className="text-slate-400">Manage your API connections and data.</p>
            </div>

            {/* API Key Section */}
            <section className="space-y-6">
                <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-slate-200">Gemini API Key</h3>
                    <p className="text-sm text-slate-500">
                        Your key is stored locally in your browser. It is never sent to our servers.
                        <br />
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 underline"
                        >
                            Get a free API key here
                        </a>.
                    </p>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex gap-4">
                        <input
                            type="password"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <button
                            onClick={handleSave}
                            disabled={isValidating}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            {isValidating ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                            Save
                        </button>
                    </div>

                    {status === 'success' && (
                        <div className="flex items-center gap-2 text-teal-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span>API Key verified and saved.</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errorMsg}</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Data Management Section */}
            <section className="space-y-6">
                <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-slate-200">Data Management</h3>
                    <p className="text-sm text-slate-500">Export your materials for backup or transfer.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
                    >
                        <Download className="w-5 h-5" />
                        <div className="text-left">
                            <div className="font-medium">Export Data</div>
                            <div className="text-xs text-slate-500">Download JSON backup</div>
                        </div>
                    </button>

                    <label className="flex items-center justify-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors text-slate-300 hover:text-white cursor-pointer">
                        <Upload className="w-5 h-5" />
                        <div className="text-left">
                            <div className="font-medium">Import Data</div>
                            <div className="text-xs text-slate-500">Restore from JSON</div>
                        </div>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>
                </div>
            </section>

            {/* Danger Zone (Clear Data) could be added here */}
        </div>
    );
}
