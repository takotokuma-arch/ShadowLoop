import { GoogleGenerativeAI } from "@google/generative-ai";
import { MaterialJSONSchema, cleanAndParseJSON } from "./schema_validation";

const SYSTEM_PROMPT = `
# Role
You are an expert English coach specializing in Shadowing techniques. Your task is to convert a raw YouTube transcript into a structured JSON learning material tailored for Japanese learners.

# Output Format (Strict JSON)
You must output ONLY a valid JSON object. Do not encompass the JSON in markdown code blocks. Do not add conversational text. Use the following schema:

{
  "youtube_id": "{{VIDEO_ID}}",
  "title": "Refined Title for Learning",
  "level": 3,
  "duration_info": "Estimated study time (e.g. '45 mins')",
  "tags": ["tag1", "tag2"],
  "overview": "Summary in Japanese...",
  "units": [
    {
      "id": 1,
      "title": "Unit Summary (Japanese)",
      "start": 0.00,
      "end": 30.50,
      "script": [
        {
          "text": "Long ago",
          "is_stressed": false,
          "is_sense_group_end": true
        },
        {
          "text": "in a land far away",
          "is_stressed": true,
          "is_sense_group_end": true
        }
      ],
      "japanese_translation": "Japanese translation of this unit...",
      "vocabulary": [
        {
          "word": "panicked",
          "pronunciation": "/ˈpænɪkt/",
          "definition": "パニックに陥った（文脈での意味）"
        }
      ],
      "grammar_note": "Optional brief grammar tip in Japanese"
    }
  ]
}

# Instructions
## Step 1: Segmentation
Split the transcript into "Learning Units".
- Length: Approx. 30 to 60 seconds per unit.
- Boundaries: Must end at a sentence completion (period). Do not split mid-sentence.
- Content: Ensure each unit has a coherent sub-topic or narrative flow.

## Step 2: Linguistic Analysis (Per Unit)
1. **Script Tokenization**: Break down the text into meaningful tokens (words or short phrases).
2. **Sense Grouping**: Mark \`is_sense_group_end: true\` at natural pause points (before prepositions, conjunctions, relative clauses, or at punctuation).
3. **Stress Marking**: Mark \`is_stressed: true\` for content words (nouns, verbs, adjectives, adverbs) that carry the sentence's primary rhythm.
4. **Translation**: Provide a natural Japanese translation.
5. **Vocabulary**: Extract 3-5 difficult or key words.

# Input Data
- **Video ID**: {{VIDEO_ID}}
- **Transcript**:
"""
{{TRANSCRIPT_TEXT}}
"""
`;

export async function generateMaterial(apiKey: string, videoId: string, transcript: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  // Basic truncation to avoid token limits (approx 15-20k chars is safe for standard usage, though 1.5 Pro has huge context)
  // 1.5 Pro has 1M+ context window, so we don't really need to truncate for typical YouTube videos (< 1 hour).
  // But to be safe and save cost/time, maybe warn if too long. For now pass all.

  const prompt = SYSTEM_PROMPT
    .replace("{{VIDEO_ID}}", videoId)
    .replace("{{TRANSCRIPT_TEXT}}", transcript);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const json = cleanAndParseJSON(text);
    return MaterialJSONSchema.parse(json);
  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
}
