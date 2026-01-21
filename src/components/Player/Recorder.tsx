import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Ear } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RecorderProps {
    onPlayModel?: () => void;
}

export function Recorder({ onPlayModel }: RecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [permissionError, setPermissionError] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Audio Visualization
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setPermissionError(false);

            // Setup Visualization
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;

            visualize();

            // Setup Recorder
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    const blob = e.data;
                    chunksRef.current.push(blob);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                chunksRef.current = [];

                // Stop visualization
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

                // Clear canvas
                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setPermissionError(true);
        }
    };

    const visualize = () => {
        if (!analyserRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isRecording) return;

            animationFrameRef.current = requestAnimationFrame(draw);
            analyserRef.current!.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;

                // Simple gradient based on height
                ctx.fillStyle = `rgb(${barHeight + 100}, 50, 200)`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const deleteRecording = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            {/* Visualizer Area */}
            {isRecording && (
                <div className="h-16 bg-slate-950 rounded-xl overflow-hidden relative w-full flex items-center justify-center">
                    <canvas ref={canvasRef} width={300} height={64} className="w-full h-full" />
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {!audioUrl ? (
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={cn(
                                "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ring-4 ring-offset-2 ring-offset-slate-900",
                                isRecording
                                    ? "bg-red-500 hover:bg-red-600 ring-red-500/20"
                                    : "bg-indigo-600 hover:bg-indigo-500 ring-indigo-500/20"
                            )}
                        >
                            {isRecording ? <Square className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                        </button>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                {/* Compare Actions */}
                                {onPlayModel && (
                                    <button
                                        onClick={onPlayModel}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Ear className="w-4 h-4" />
                                        Listen Model
                                    </button>
                                )}
                                <div className="h-4 w-px bg-slate-700 mx-1" />
                                <audio src={audioUrl} controls className="h-8 w-40" />
                            </div>
                        </div>
                    )}

                    <div className="text-sm">
                        {isRecording ? (
                            <span className="text-red-400 font-medium animate-pulse">Recording...</span>
                        ) : audioUrl ? (
                            <div className="flex items-center gap-2">
                                <span className="text-teal-400 font-medium">Recorded</span>
                                <button
                                    onClick={deleteRecording}
                                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-full hover:bg-slate-800 transition-colors"
                                    title="Discard"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <span className={cn("font-medium", permissionError ? "text-red-400" : "text-slate-300")}>
                                    {permissionError ? "Microphone Error" : "Record your voice"}
                                </span>
                                {permissionError && <span className="text-xs text-slate-500">Check permissions</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
