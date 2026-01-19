export function getVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function getThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Just a placeholder interface if library doesn't export one, but usually it returns array of objects
export interface TranscriptItem {
    text: string;
    duration: number;
    offset: number;
}

import { YoutubeTranscript } from 'youtube-transcript';

export async function fetchTranscript(videoId: string): Promise<string> {
    try {
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        return transcriptItems.map(item => item.text).join(' ');
    } catch (e) {
        console.error("Failed to fetch transcript", e);
        throw new Error("Could not fetch transcript automatically.");
    }
}
