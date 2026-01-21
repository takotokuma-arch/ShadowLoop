import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../db/db';
import { getVideoId, getThumbnailUrl, fetchTranscript, fetchRawTranscript } from '../lib/youtube';
import { generateMaterial } from '../lib/generator';
import { alignMaterial } from '../lib/alignment';
import { Search, PlayCircle, FileText, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'url' | 'transcript' | 'generating';

export function CreatePage() {
    const navigate = useNavigate();
    const { apiKey } = useAuth();
    const [url, setUrl] = useState('');
    const [videoId, setVideoId] = useState<string | null>(null);
    const [transcript, setTranscript] = useState('');
    const [step, setStep] = useState<Step>('url');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Analyze URL
    const handleAnalyze = async () => {
        setError('');
        const id = getVideoId(url);
        if (!id) {
            setError('Invalid YouTube URL. Please format as provided in the browser.');
            return;
        }
        setVideoId(id);

        setLoading(true);
        try {
            const text = await fetchTranscript(id);
            setTranscript(text);
            toast.success("Transcript fetched automatically!");
        } catch (e) {
            console.log("Auto-fetch failed", e);
            // Fallback to manual input (implicit as transcript remains empty)
            setError('Could not fetch transcript automatically. Please paste it manually.');
            toast.error("Could not fetch transcript. Please paste manually.");
        } finally {
            setLoading(false);
            setStep('transcript');
        }
    };

    // Generate Material
    const handleGenerate = async () => {
        if (!apiKey) {
            setError('Please set your Gemini API Key in Settings first.');
            return;
        }
        if (!videoId || !transcript.trim()) {
            setError('Please provide a transcript.');
            return;
        }

        setLoading(true);
        setStep('generating');
        setError('');

        try {
            let material = await generateMaterial(apiKey, videoId, transcript);

            // Attempt Karaoke Alignment
            try {
                const rawSegments = await fetchRawTranscript(videoId);
                material = alignMaterial(material, rawSegments);
                console.log("Aligned material with raw timestamps");
            } catch (alignErr) {
                console.warn("Alignment failed (skipping karaoke mode):", alignErr);
            }

            // Save to DB
            const id = await db.materials.add({
                ...material,
                id: undefined, // Let Dexie generate ID
                created_at: Date.now()
            });

            // Redirect
            navigate(`/player/${id}`);
        } catch (err) {
            console.error(err);
            const msg = (err as Error).message;
            setError('Generation failed. ' + msg);
            toast.error("Generation failed: " + msg);
            setStep('transcript');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white">New Study Material</h2>
                <p className="text-slate-400">Turn any YouTube video into a shadowing lesson.</p>
            </div>

            {step === 'url' && (
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Paste YouTube URL here..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                    </div>
                    <button
                        onClick={handleAnalyze}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <PlayCircle className="w-5 h-5" />
                        {loading ? 'Analyzing...' : 'Analyze Video'}
                    </button>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm justify-center">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            )}

            {(step === 'transcript' || step === 'generating') && videoId && (
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Video Preview */}
                    <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <img
                            src={getThumbnailUrl(videoId)}
                            alt="Thumbnail"
                            className="w-32 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 overflow-hidden">
                            <p className="font-medium truncate text-slate-200">Target Video ID: {videoId}</p>
                            <button
                                onClick={() => setStep('url')}
                                className="text-xs text-indigo-400 hover:text-indigo-300 mt-1"
                            >
                                Change Video
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                Transcript
                            </h3>
                            <p className="text-sm text-slate-400">
                                {transcript ? 'Review the fetched transcript below.' : 'Could not fetch automatically. Please paste transcript manually.'}
                            </p>
                        </div>

                        <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Paste transcript here..."
                            className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
                            disabled={loading}
                        />

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Generating Learning Materials...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
                                    Generate with AI
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm justify-center bg-red-900/20 p-3 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
