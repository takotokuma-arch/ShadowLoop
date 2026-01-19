// 1. Script Token
export interface ScriptToken {
    text: string;
    is_stressed: boolean;
    is_sense_group_end: boolean;
    start?: number;
}

// 2. Vocabulary Item
export interface VocabularyItem {
    word: string;
    pronunciation: string;
    definition: string;
    example_sentence?: string;
}

// 3. Learning Unit
export interface LearningUnit {
    id: number;
    title: string;
    start: number;
    end: number;
    script: ScriptToken[];
    vocabulary: VocabularyItem[];
    grammar_note?: string;
    japanese_translation?: string; // Added based on prompt example
}

// 4. Root Object
export interface MaterialJSON {
    id?: number;
    youtube_id: string;
    title: string;
    level: number;
    duration_info: string;
    tags: string[];
    overview: string;
    units: LearningUnit[];
    created_at?: number;
}
