import { useRef, useEffect, useState } from 'react';
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
    const [activeVocab, setActiveVocab] = useState<string | null>(null);

    // Dismiss tooltip on click outside or touch outside (simple heuristic)
    useEffect(() => {
        const handleClick = () => setActiveVocab(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Find active unit ID for scroll dependency
    const activeUnitId = material.units.find(u => currentTime >= u.start && currentTime < u.end)?.id;

    useEffect(() => {
        if (activeUnitId && activeUnitRef.current) {
            activeUnitRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeUnitId]);

    return (
        <div className="space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{material.title}</h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{material.overview}</p>
                <div className="flex flex-wrap gap-2">
                    {material.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300">#{tag}</span>
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
                                "p-6 rounded-2xl border transition-all duration-500 ease-out relative group",
                                isActive
                                    ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-500/50 dark:shadow-[0_0_15px_rgba(99,102,241,0.1)] scale-[1.02] opacity-100 z-10"
                                    : "bg-white dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/50 opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4 border-b border-slate-200 dark:border-slate-800/50 pb-2">
                                <h3 className="text-indigo-600 dark:text-indigo-300 font-semibold text-sm">Unit {unit.id}: {unit.title}</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onSeek(unit.start)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Play Unit"
                                    >
                                        <PlayCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onLoopUnit(isLooping ? null : unit)}
                                        className={cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            isLooping ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10" : "text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                        title="Loop Unit"
                                    >
                                        <Repeat className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className={cn(
                                "text-lg leading-relaxed transition-colors duration-300",
                                isActive
                                    ? "font-bold text-slate-900 dark:text-white"
                                    : "font-medium text-slate-500 dark:text-slate-400"
                            )}>
                                {unit.script.map((token, idx) => {
                                    const isCurrentToken = token.start !== undefined && token.end !== undefined && currentTime >= token.start && currentTime < token.end;

                                    return (
                                        <span
                                            key={idx}
                                            className={cn(
                                                "transition-all duration-100 rounded px-0.5 inline-block origin-bottom",
                                                token.is_stressed ? "font-bold text-slate-900 dark:text-slate-50" : "font-normal",
                                                isCurrentToken
                                                    ? "text-indigo-600 dark:text-indigo-300 font-extrabold scale-110 bg-indigo-100/50 dark:bg-indigo-500/20"
                                                    : "hover:text-indigo-700 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/5"
                                            )}
                                        >
                                            {token.text}{" "}
                                            {showSenseGroups && token.is_sense_group_end && (
                                                <span className="text-indigo-400/50 dark:text-indigo-500/50 font-light select-none">/ </span>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>

                            {unit.japanese_translation && (
                                <p className="mt-4 text-sm text-slate-500 border-l-2 border-slate-300 dark:border-slate-700 pl-3">
                                    {unit.japanese_translation}
                                </p>
                            )}

                            {unit.vocabulary.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {unit.vocabulary.map((vocab, vIdx) => (
                                        <div key={vIdx} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveVocab(activeVocab === vocab.word ? null : vocab.word);
                                                }}
                                                className={cn(
                                                    "text-sm border-b border-dotted cursor-help transition-colors font-medium px-1 py-0.5 rounded",
                                                    activeVocab === vocab.word
                                                        ? "text-indigo-600 dark:text-indigo-300 border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                                                        : "border-slate-400 dark:border-slate-500 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-400"
                                                )}
                                            >
                                                {vocab.word}
                                            </button>

                                            {/* Tooltip (Click/Tap based) */}
                                            {activeVocab === vocab.word && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-xl z-20 text-sm animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="font-bold text-slate-900 dark:text-white mb-1 flex justify-between items-baseline">
                                                        <span>{vocab.word}</span>
                                                        <span className="font-normal text-xs text-slate-500">{vocab.pronunciation}</span>
                                                    </div>
                                                    <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">{vocab.definition}</div>
                                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-700 rotate-45"></div>
                                                </div>
                                            )}
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
