// src/lib/youtube.ts

export function getVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function getThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// 【改善点1】括弧をカウントして正確にJSONを抜き出す関数
function extractYtData(html: string): any {
    try {
        const pattern = /ytInitialPlayerResponse\s*=\s*\{/;
        const match = html.match(pattern);
        if (!match || match.index === undefined) return null;

        const startIndex = match.index + match[0].length - 1; // '{' の位置
        let braceCount = 0;
        let jsonStr = '';

        for (let i = startIndex; i < html.length; i++) {
            const char = html[i];
            jsonStr += char;

            if (char === '{') braceCount++;
            if (char === '}') braceCount--;

            // 括弧のバランスが取れたら終了（これが正確なJSONの終わり）
            if (braceCount === 0) break;
        }

        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("JSON parse failed", e);
        return null;
    }
}

export async function fetchTranscript(videoId: string): Promise<string> {
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(videoUrl);

        // 1. 動画ページを取得
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Proxy fetch failed");
        const html = await response.text();

        // 2. 堅牢なロジックでJSONデータを抽出
        const playerResponse = extractYtData(html);
        if (!playerResponse) {
            throw new Error("Could not extract player response");
        }

        const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (!tracks || tracks.length === 0) {
            throw new Error("No captions found for this video");
        }

        // 3. 言語の優先順位決定 (英語 -> 日本語 -> その他)
        tracks.sort((a: any, b: any) => {
            if (a.languageCode === 'en') return -1;
            if (b.languageCode === 'en') return 1;
            if (a.languageCode === 'ja') return -1;
            if (b.languageCode === 'ja') return 1;
            return 0;
        });

        const track = tracks[0];
        if (!track || !track.baseUrl) {
            throw new Error("No usable caption track found");
        }

        // 4. XMLデータを取得
        const transcriptResponse = await fetch("https://corsproxy.io/?" + encodeURIComponent(track.baseUrl));
        if (!transcriptResponse.ok) throw new Error("Transcript XML fetch failed");
        const transcriptXml = await transcriptResponse.text();

        // 【改善点2】DOMParserを使って正確にテキスト化（文字化け防止）
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(transcriptXml, "text/xml");
        const textNodes = xmlDoc.getElementsByTagName("text");

        const texts = Array.from(textNodes).map(node => {
            // textContentなら自動的にエンティティ(&amp;等)がデコードされる
            return node.textContent || "";
        });

        const fullText = texts.join(' ').replace(/\s+/g, ' ').trim(); // 余計な空白を除去

        if (!fullText) throw new Error("Transcript text is empty");

        return fullText;

    } catch (e) {
        console.error("Transcript fetch error:", e);
        throw e;
    }
}