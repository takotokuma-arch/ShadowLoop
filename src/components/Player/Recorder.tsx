import { useState, useRef } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Recorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                chunksRef.current = [];
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Cannot access microphone. Please allow permissions.');
        }
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {!audioUrl ? (
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
                            isRecording
                                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                                : "bg-indigo-600 hover:bg-indigo-500"
                        )}
                    >
                        {isRecording ? <Square className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <audio src={audioUrl} controls className="h-8 w-48 md:w-64" />
                        <button
                            onClick={deleteRecording}
                            className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="text-sm">
                    {isRecording ? (
                        <span className="text-red-400 font-medium">Recording...</span>
                    ) : audioUrl ? (
                        <span className="text-teal-400 font-medium">Recorded</span>
                    ) : (
                        <span className="text-slate-500">Record your voice</span>
                    )}
                </div>
            </div>
        </div>
    );
}
