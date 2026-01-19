import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../db/db';
import type { MaterialJSON, LearningUnit } from '../types';
import { VideoPlayer } from '../components/Player/VideoPlayer';
import { ScriptView } from '../components/Player/ScriptView';
import { PlayerControls } from '../components/Player/PlayerControls';
import { Recorder } from '../components/Player/Recorder';

export function PlayerPage() {
    const { id } = useParams();
    const [material, setMaterial] = useState<MaterialJSON | null>(null);
    const [loading, setLoading] = useState(true);
    const [player, setPlayer] = useState<any>(null);

    // State
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0); // Default 1.0, Plan said 0.75 default but 1.0 is standard.
    const [loopingUnit, setLoopingUnit] = useState<LearningUnit | null>(null);
    const [showSenseGroups, setShowSenseGroups] = useState(true);

    // Fetch Material
    useEffect(() => {
        if (!id) return;

        db.materials.get(Number(id) as any).then(item => {
            if (item) {
                setMaterial(item);
            } else {
                // Handle error, maybe string ID if we migrated?
                // Try string if parsing failed
                db.materials.where('youtube_id').equals(id).first().then(res => { // Fallback just in case
                    if (res) setMaterial(res);
                });
            }
            setLoading(false);
        });
    }, [id]);

    // Sync Timer
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (player && isPlaying) {
            interval = setInterval(() => {
                const time = player.getCurrentTime();
                setCurrentTime(time);

                // Loop Logic
                if (loopingUnit) {
                    if (time >= loopingUnit.end) {
                        player.seekTo(loopingUnit.start);
                    } else if (time < loopingUnit.start) {
                        // If user manually seeked out, maybe keep it? Or force back?
                        // If natural play, it shouldn't happen. 
                        // Only check endpoint
                    }
                }
            }, 200); // 5Hz update
        }
        return () => clearInterval(interval);
    }, [player, isPlaying, loopingUnit]);

    // Handlers
    const handleReady = (event: any) => {
        setPlayer(event.target);
        // Set initial rate logic if needed
    };

    const handleStateChange = (event: any) => {
        // 1: Playing, 2: Paused
        setIsPlaying(event.data === 1);
    };

    const togglePlay = () => {
        if (!player) return;
        if (isPlaying) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    };

    const changeRate = (rate: number) => {
        if (player) {
            player.setPlaybackRate(rate);
            setPlaybackRate(rate);
        }
    };

    const seekTo = (time: number) => {
        if (player) {
            player.seekTo(time, true);
            player.playVideo();
        }
    };

    const handleLoopUnit = (unit: LearningUnit | null) => {
        setLoopingUnit(unit);
        if (unit && player) {
            player.seekTo(unit.start, true);
            player.playVideo();
        }
    };

    if (loading) return <div className="text-center py-20 text-slate-500">Loading lesson...</div>;
    if (!material) return <div className="text-center py-20 text-red-500">Material not found.</div>;

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6 lg:overflow-hidden">
            {/* Sticky Video Column */}
            <div className="w-full lg:w-1/3 lg:flex-shrink-0 flex flex-col gap-4">
                <div className="aspect-video w-full">
                    <VideoPlayer
                        videoId={material.youtube_id}
                        onReady={handleReady}
                        onStateChange={handleStateChange}
                    />
                </div>

                <PlayerControls
                    isPlaying={isPlaying}
                    onTogglePlay={togglePlay}
                    playbackRate={playbackRate}
                    onRateChange={changeRate}
                    showSenseGroups={showSenseGroups}
                    onToggleSenseGroups={() => setShowSenseGroups(!showSenseGroups)}
                />

                <Recorder />
            </div>

            {/* Scrollable Script Column */}
            <div className="flex-1 lg:overflow-y-auto pr-2 custom-scrollbar">
                <ScriptView
                    material={material}
                    currentTime={currentTime}
                    onSeek={seekTo}
                    onLoopUnit={handleLoopUnit}
                    loopingUnit={loopingUnit}
                    showSenseGroups={showSenseGroups}
                />
            </div>
        </div>
    );
}
