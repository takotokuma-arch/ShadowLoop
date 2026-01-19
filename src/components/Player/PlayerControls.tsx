import { Play, Pause, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PlayerControlsProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    playbackRate: number;
    onRateChange: (rate: number) => void;
    showSenseGroups: boolean;
    onToggleSenseGroups: () => void;
}

export function PlayerControls({
    isPlaying,
    onTogglePlay,
    playbackRate,
    onRateChange,
    showSenseGroups,
    onToggleSenseGroups
}: PlayerControlsProps) {
    const rates = [0.5, 0.75, 1.0];

    return (
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xl">
            <button
                onClick={onTogglePlay}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-3 transition-colors shadow-lg shadow-indigo-600/20"
            >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>

            <div className="flex items-center gap-4">
                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                    {rates.map(rate => (
                        <button
                            key={rate}
                            onClick={() => onRateChange(rate)}
                            className={cn(
                                "text-xs px-3 py-1.5 rounded-md transition-all font-medium",
                                playbackRate === rate ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {rate}x
                        </button>
                    ))}
                </div>

                <button
                    onClick={onToggleSenseGroups}
                    className={cn(
                        "p-2 rounded-lg border transition-colors flex items-center gap-2 text-xs font-medium",
                        showSenseGroups ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                    )}
                >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Sense Groups</span>
                </button>
            </div>
        </div>
    );
}
