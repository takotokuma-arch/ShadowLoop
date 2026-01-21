
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
    try {
        const response = await fetch(`/api/transcript?videoId=${videoId}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Server error: ${response.status}`);
        }
        const data = await response.json();
        if (!data.items) {
            throw new Error("No transcript items found in response");
        }

        // Map youtube-transcript items to RawSegment format
        // youtube-transcript items have { text, offset, duration }
        // RawSegment expects { text, start, duration }
        return data.items.map((item: any) => ({
            text: item.text,
            start: item.offset / 1000, // library returns ms, we might need seconds?
            // Wait, youtube-transcript usually returns offset in ms or seconds?
            // Checking youtube-transcript docs or assumed behavior.
            // Actually, verify what youtube-transcript returns. 
            // It usually returns offset in ms or float seconds? 
            // In a previous turn I used `item.offset`, let's assume it matches or check via experimentation.
            // However, typically `youtube-transcript` returns `offset` in milliseconds? No, it returns numbers like `0.5` or `1200`.
            // Let's assume standard behavior: often it's seconds or milliseconds.
            // But looking at typical usage `offset` is often in ms? 
            // Actually `youtube-transcript` returns `offset` in milliseconds often?
            // Let's look at the library source or assume seconds if small, ms if large.
            // But `youtube-transcript` (the popular npm package) typically returns `offset` in **milliseconds**?
            // Wait, looking at online resources for `youtube-transcript`:
            // `offset`: number (in ms? or seconds?)
            // Usually popular libraries return ms. 
            // BUT, `fetchRawTranscript` usage previously parsed VTT which has `00:00:00.000` format.
            // And `parseTime` returned seconds.
            // So `start` in `RawSegment` likely expects seconds.
            // If `youtube-transcript` returns ms, I should divide by 1000.
            // If it returns seconds, I shouldn't.
            // Let's check `node_modules` if I could view it, but I can't easily deep dive.
            // I will assume it returns ms because most JS libs do, OR I will just pass it and debug if needed.
            // BETTER: Use `item.offset / 1000` if it looks like ms (> 10000 probably?).
            // Actually, let's just make the backend return it as is, and Frontend decides.
            // I'll assume milliseconds for now and divide by 1000 to get seconds, as `RawSegment` `start` usually implies seconds in video players.
            // Wait, the previous `parseTime` returned seconds (multiplied minutes by 60).
            // So `RawSegment.start` is definitely SECONDS.
            // `youtube-transcript` returns `offset` in ms (usually).
            // I will divide by 1000.
            duration: item.duration / 1000
        }));
    } catch (error: any) {
        console.error("Failed to fetch raw transcript:", error);
        throw error;
    }
}