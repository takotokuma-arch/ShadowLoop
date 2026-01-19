import { useRef, useEffect } from 'react';
import YouTube, { type YouTubeProps } from 'react-youtube';

interface VideoPlayerProps {
    videoId: string;
    onReady: (event: any) => void;
    onStateChange: (event: any) => void;
    playbackRate: number;
}

export function VideoPlayer({ videoId, onReady, onStateChange, playbackRate }: VideoPlayerProps) {
    const playerRef = useRef<any>(null);

    // Update playback rate when prop changes
    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.setPlaybackRate(playbackRate);
        }
    }, [playbackRate]);

    // Intercept onReady to store ref
    const handleReady = (event: any) => {
        playerRef.current = event.target;
        event.target.setPlaybackRate(playbackRate); // Set initial rate
        onReady(event);
    };
    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
        },
    };

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
            <YouTube
                videoId={videoId}
                opts={opts}
                onReady={handleReady}
                onStateChange={onStateChange}
                className="w-full h-full"
                iframeClassName="w-full h-full"
            />
        </div>
    );
}
