import { useRef, useEffect } from 'react';
import type { MaterialJSON, LearningUnit } from '../../types';
import { cn } from '../../lib/utils';
import { PlayCircle, Repeat } from 'lucide-react';

interface ScriptViewProps {
    material: MaterialJSON;
    currentTime: number;
    onSeek: (time: number) => void;
    onLoopUnit: (unit: LearningUnit | null) => void;
    loopingUnit: LearningUnit | null;
    showSenseGroups: boolean;
}

export function ScriptView({
    material,
    currentTime,
    onSeek,
    onLoopUnit,
    loopingUnit,
    showSenseGroups
}: ScriptViewProps) {
    const activeUnitRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeUnitRef.current) {
            activeUnitRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [currentTime]); // Scroll when active unit changes implies currentTime moved significantly

    return (
        <div className="space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">{material.title}</h1>
                <p className="text-slate-400 text-sm">{material.overview}</p>
                <div className="flex flex-wrap gap-2">
                    {material.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 bg-slate-900 border border-slate-700 rounded-full text-slate-300">#{tag}</span>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                {material.units.map((unit) => {
                    const isActive = currentTime >= unit.start && currentTime < unit.end;
                    const isLooping = loopingUnit?.id === unit.id;

                    return (
                        <div
                            key={unit.id}
                            ref={isActive ? activeUnitRef : null}
                            className={cn(
                                "p-6 rounded-2xl border transition-all duration-300 relative group",
                                isActive
                                    ? "bg-slate-900/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10 scale-[1.01]"
                                    : "bg-slate-900/30 border-slate-800 hover:bg-slate-900/50"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4 border-b border-slate-800/50 pb-2">
                                <h3 className="text-indigo-300 font-semibold text-sm">Unit {unit.id}: {unit.title}</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onSeek(unit.start)}
                                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                        title="Play Unit"
                                    >
                                        <PlayCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onLoopUnit(isLooping ? null : unit)}
                                        className={cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            isLooping ? "text-indigo-400 bg-indigo-500/10" : "text-slate-400 hover:text-white hover:bg-slate-800"
                                        )}
                                        title="Loop Unit"
                                    >
                                        <Repeat className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="text-lg leading-relaxed text-slate-200 font-medium">
                                {unit.script.map((token, idx) => (
                                    <span
                                        key={idx}
                                        className={cn(
                                            "transition-colors hover:text-white hover:bg-white/5 rounded px-0.5",
                                            token.is_stressed ? "font-bold text-slate-50" : "font-normal",
                                            // Simple highlighting if we had word-level timestamps, but we don't for now.
                                        )}
                                    >
                                        {token.text}{" "}
                                        {showSenseGroups && token.is_sense_group_end && (
                                            <span className="text-indigo-500/50 font-light select-none">/ </span>
                                        )}
                                    </span>
                                ))}
                            </div>

                            {unit.japanese_translation && (
                                <p className="mt-4 text-sm text-slate-500 border-l-2 border-slate-700 pl-3">
                                    {unit.japanese_translation}
                                </p>
                            )}

                            {unit.vocabulary.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {unit.vocabulary.map((vocab, vIdx) => (
                                        <div key={vIdx} className="group/vocab relative inline-block">
                                            <span className="text-xs border-b border-dotted border-slate-500 hover:border-indigo-400 cursor-help text-slate-400 hover:text-indigo-300 transition-colors">
                                                {vocab.word}
                                            </span>
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-xl opacity-0 invisible group-hover/vocab:opacity-100 group-hover/vocab:visible transition-all z-10 text-xs">
                                                <div className="font-bold text-white mb-1">{vocab.word} <span className="font-normal text-slate-500">{vocab.pronunciation}</span></div>
                                                <div className="text-slate-300">{vocab.definition}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
