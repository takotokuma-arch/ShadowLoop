import YouTube, { type YouTubeProps } from 'react-youtube';

interface VideoPlayerProps {
    videoId: string;
    onReady: (event: any) => void;
    onStateChange: (event: any) => void;
}

export function VideoPlayer({ videoId, onReady, onStateChange }: VideoPlayerProps) {
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
                onReady={onReady}
                onStateChange={onStateChange}
                className="w-full h-full"
                iframeClassName="w-full h-full"
            />
        </div>
    );
}
