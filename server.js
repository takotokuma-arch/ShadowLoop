import express from 'express';
import cors from 'cors';
import { Innertube, UniversalCache } from 'youtubei.js';

const app = express();
app.use(cors());

let youtube = null;

// Initialize Innertube
(async () => {
    try {
        youtube = await Innertube.create({
            cache: new UniversalCache(false),
            // generate_session_locally: true,
            // client_type: 'ANDROID'
        });
        console.log('[Server] Innertube initialized successfully.');
    } catch (error) {
        console.error('[Server] Failed to initialize Innertube:', error);
    }
})();

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', youtube_ready: !!youtube });
});

app.get('/api/transcript', async (req, res) => {
    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });

    if (!youtube) {
        return res.status(503).json({ error: 'YouTube client not ready yet. Please try again in a moment.' });
    }

    console.log(`[Server] Fetching transcript for video: ${videoId}`);

    try {
        console.log('[Server] call getInfo...');
        const info = await youtube.getInfo(videoId);
        console.log('[Server] getInfo success. Title:', info.basic_info.title);

        // Try to find captions manually from info
        const captions = info.captions;
        if (captions && captions.caption_tracks && captions.caption_tracks.length > 0) {
            console.log(`[Server] Found ${captions.caption_tracks.length} caption tracks.`);
            // Priority: English -> First
            const track = captions.caption_tracks.find(t => t.language_code === 'en') || captions.caption_tracks[0];

            console.log(`[Server] Fetching manual track: ${track.language_code} from ${track.base_url}`);

            // Manual fetch
            const fetchRes = await fetch(track.base_url);
            if (!fetchRes.ok) throw new Error(`Failed to fetch caption track: ${fetchRes.status}`);
            const rawXml = await fetchRes.text();

            // Basic XML parsing (YouTube returns XML/TTML usually for these URLs)
            // We can just strip tags for now to satisfy the "transcript" requirement.
            // Or better, simple regex.
            const text = rawXml
                .replace(/<[^>]+>/g, ' ') // remove tags
                .replace(/\s+/g, ' ') // normalize whitespace
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .trim();

            return res.json({ transcript: text });
        }

        console.log('[Server] No captions found in info, trying getTranscript()...');
        const transcriptData = await info.getTranscript();

        if (!transcriptData || !transcriptData.transcript) {
            return res.status(404).json({ error: 'No transcript found for this video.' });
        }

        // Navigate the response based on youtubei.js types (defensive coding)
        // Usually: transcriptData.transcript.content.body.initial_segments
        const initialSegments = transcriptData?.transcript?.content?.body?.initial_segments;

        if (!initialSegments || !Array.isArray(initialSegments)) {
            console.warn('[Server] Unexpected transcript format:', JSON.stringify(transcriptData, null, 2));
            return res.status(404).json({ error: 'Transcript data format unrecognized.' });
        }

        // Extract text
        const cleanText = initialSegments.map(segment => {
            return segment.snippet.text;
        }).join(' ');

        // Clean up common whitespace issues
        const normalizedText = cleanText.replace(/\s+/g, ' ').trim();

        console.log(`[Server] Successfully fetched transcript, length: ${normalizedText.length}`);

        res.json({ transcript: normalizedText });

    } catch (error) {
        console.error("[Server] Error:", error);
        res.status(500).json({ error: "Failed to fetch transcript via Innertube.", details: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
