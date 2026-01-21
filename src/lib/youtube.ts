
export function getVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function getThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}



export async function fetchTranscript(videoId: string): Promise<string> {
    try {
        const response = await fetch(`/api/transcript?videoId=${videoId}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Server error: ${response.status}`);
        }
        const data = await response.json();
        if (!data.transcript) {
            throw new Error("No transcript found in response");
        }
        return data.transcript;
    } catch (error: any) {
        console.error("Failed to fetch transcript:", error);
        throw error;
    }
}

function normalizeTranscript(raw: string): string {
    // Kept for backward compatibility if needed, but backend joins text now.
    return raw;
}

export interface RawSegment {
    text: string;
    start: number;
    duration: number;
}

export async function fetchRawTranscript(videoId: string): Promise<RawSegment[]> {
    // Current Piped backend only returns full text. 
    // Raw segment support needs to be re-implemented if Karaoke mode is required.
    console.warn("fetchRawTranscript is not yet supported with Piped backend.");
    return [];
}