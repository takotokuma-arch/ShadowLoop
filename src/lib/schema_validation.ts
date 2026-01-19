import { z } from "zod";

export const ScriptTokenSchema = z.object({
    text: z.string(),
    is_stressed: z.boolean(),
    is_sense_group_end: z.boolean(),
    start: z.number().optional()
});

export const VocabularyItemSchema = z.object({
    word: z.string(),
    pronunciation: z.string(),
    definition: z.string(),
    example_sentence: z.string().optional()
});

export const LearningUnitSchema = z.object({
    id: z.number(),
    title: z.string(),
    start: z.number(),
    end: z.number(),
    script: z.array(ScriptTokenSchema),
    vocabulary: z.array(VocabularyItemSchema),
    grammar_note: z.string().optional(),
    japanese_translation: z.string().optional()
});

export const MaterialJSONSchema = z.object({
    // Accept string or number for ID as it might come from AI as placeholder or not at all
    id: z.number().optional(),

    youtube_id: z.string(),
    title: z.string(),
    level: z.number().min(1).max(5),
    duration_info: z.string(),
    tags: z.array(z.string()),
    overview: z.string(),
    units: z.array(LearningUnitSchema)
});

export function cleanAndParseJSON(response: string): any {
    // Remove markdown code blocks
    let cleaned = response.replace(/```json/g, "").replace(/```/g, "");

    // Extract JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
        cleaned = match[0];
    }

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        throw new Error("Failed to parse JSON response: " + (e as Error).message);
    }
}
