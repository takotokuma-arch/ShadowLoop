import express from 'express';
import cors from 'cors';
import { YoutubeTranscript } from 'youtube-transcript';

const app = express();
const PORT = 3000;

app.use(cors());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Transcript endpoint
app.get('/api/transcript', async (req, res) => {
    try {
        const videoId = req.query.videoId;

        if (!videoId || typeof videoId !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid videoId' });
        }

        const lang = req.query.lang || 'en';
        console.log(`[Server] Fetching transcript for video: ${videoId}, lang: ${lang}`);

        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: lang }); // removed 'as string'

        console.log(`[Server] Found ${transcriptItems.length} transcript items`);

        const fullText = transcriptItems.map(item => item.text).join(' ');

        res.json({
            transcript: fullText,
            items: transcriptItems
        });

    } catch (error) {
        console.error('[Server] Error fetching transcript:', error);
        res.status(500).json({ error: 'Failed to fetch transcript', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
