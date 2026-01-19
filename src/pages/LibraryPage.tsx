import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db/db';
import type { MaterialJSON } from '../types';
import { getThumbnailUrl } from '../lib/youtube';
import { Clock, BarChart, Trash2, Play } from 'lucide-react';

export function LibraryPage() {
    const [materials, setMaterials] = useState<MaterialJSON[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMaterials = async () => {
        // Dexie: order by created_at desc
        const result = await db.materials.orderBy('created_at').reverse().toArray();
        setMaterials(result);
        setLoading(false);
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        // Allow null or undefined id just in case, but types say number. 
        // Plan says string or number. Schema_validation says string or number.
        // Dexie auto-increment is number, but we allow string in types.
        if (id === undefined) return;

        if (confirm('Are you sure you want to delete this material?')) {
            await db.materials.delete(id as any);
            fetchMaterials();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 text-slate-500">
                <div className="animate-pulse">Loading library...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-white">Library</h2>
                    <p className="text-slate-400">Your collection of shadowing materials.</p>
                </div>
            </div>

            {materials.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed flex flex-col items-center gap-4">
                    <p className="text-lg">No materials yet.</p>
                    <Link
                        to="/create"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg shadow-indigo-600/20"
                    >
                        Create your first lesson
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {materials.map((item) => (
                        <Link
                            key={item.id}
                            to={`/player/${item.id}`}
                            className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col h-full"
                        >
                            <div className="relative aspect-video bg-slate-950 overflow-hidden">
                                <img
                                    src={getThumbnailUrl(item.youtube_id || '')}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60" />

                                <div className="absolute bottom-3 left-3 flex gap-2">
                                    <span className="text-xs bg-slate-950/80 backdrop-blur px-2 py-1 rounded-md text-slate-300 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {item.duration_info}
                                    </span>
                                </div>

                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="bg-indigo-600/90 p-3 rounded-full text-white shadow-lg backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-transform">
                                        <Play className="w-6 h-6 fill-current pl-1" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg text-slate-100 line-clamp-2 mb-2 group-hover:text-indigo-400 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                                    {item.overview}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 mt-auto">
                                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                                        <BarChart className="w-3 h-3" />
                                        <span>Level {item.level}</span>
                                    </div>

                                    <button
                                        onClick={(e) => handleDelete(e, item.id as number)}
                                        className="text-slate-600 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
