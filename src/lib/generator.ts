import { GoogleGenerativeAI } from "@google/generative-ai";
import { MaterialJSONSchema } from "./schema_validation";
import { jsonrepair } from 'jsonrepair';

const SYSTEM_PROMPT = `
# Role
You are an expert English coach specializing in Shadowing techniques. Your task is to convert a raw YouTube transcript into a structured JSON learning material tailored for Japanese learners.

# Output Format (Strict JSON)
You must output ONLY a valid JSON object. 
- Do not encompass the JSON in markdown code blocks (e.g. no \`\`\`json).
- Do not add conversational text or preambles.
- Ensure all keys and string values are properly double-quoted.
- Handle trailing commas gracefully if possible, but try to avoid them.

Use the following schema:

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
  const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash-preview" }); // Setting to 3.0 preview as requested

  const prompt = SYSTEM_PROMPT
    .replace("{{VIDEO_ID}}", videoId)
    .replace("{{TRANSCRIPT_TEXT}}", transcript);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("Raw AI Response length:", text.length);

    // Robust JSON Parsing with jsonrepair
    try {
      // First try to strip markdown code blocks if present
      let cleanText = text.replace(/```json\n?|\n?```/g, '').trim();

      // If it looks like it has extra text, try to find the first { and last }
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }

      // Repair and Parse
      const repaired = jsonrepair(cleanText);
      const json = JSON.parse(repaired);

      return MaterialJSONSchema.parse(json);

    } catch (e) {
      console.error("JSON Parse/Validate Error", e);
      console.log("Failed Text:", text);
      throw new Error("Failed to parse AI response. The model output was invalid JSON.");
    }
  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
}
