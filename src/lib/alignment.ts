import diff from 'fast-diff';
import type { MaterialJSON, ScriptToken } from '../types';
import type { RawSegment } from './youtube';

export function alignMaterial(material: MaterialJSON, rawSegments: RawSegment[]): MaterialJSON {
    // 1. Construct Raw Map
    // We map every character index in the "Raw String" to a specific time.
    let rawString = "";
    const rawTimeMap: number[] = []; // index -> timestamp (seconds)

    for (const seg of rawSegments) {
        // Clean text slightly to match AI better (lowercase?)
        // Let's keep case but maybe normalize whitespace
        const text = seg.text;
        const start = seg.start;
        const duration = seg.duration;
        const charDuration = duration / Math.max(1, text.length);

        for (let i = 0; i < text.length; i++) {
            rawString += text[i];
            rawTimeMap.push(start + (i * charDuration));
        }

        // Add a space between segments effectively? 
        // YouTube raw often has no spaces between segments if we just concat?
        // Actually segments are usually lines. We should insert space.
        rawString += " ";
        rawTimeMap.push(start + duration); // Space gets end time of prev segment
    }

    // 2. Construct AI Map
    // We need to know which ScriptToken each character in "AI String" belongs to.
    let aiString = "";
    const aiTokenMap: { unitId: number, tokenIndex: number }[] = [];

    for (let u = 0; u < material.units.length; u++) {
        const unit = material.units[u];
        for (let t = 0; t < unit.script.length; t++) {
            const token = unit.script[t];
            const text = token.text;

            for (let i = 0; i < text.length; i++) {
                aiString += text[i];
                aiTokenMap.push({ unitId: u, tokenIndex: t });
            }
            // Add space between tokens usually
            // ScriptTokens usually don't have trailing spaces, script is joined by logic?
            // "Long ago" + "in a land" -> "Long agoin a land" if no space.
            // We should add space for diffing context.
            aiString += " ";
            aiTokenMap.push({ unitId: u, tokenIndex: t }); // Space belongs to prev token
        }
    }

    // 3. Run Diff
    // diff(text1, text2) -> calculates changes to turn text1 into text2
    // We want to map AI (text2) back to Raw (text1).
    const diffs = diff(rawString, aiString);

    // 4. Walk the diff to assign times
    let rawIdx = 0;
    let aiIdx = 0;

    // Temporary storage for start/end times for each token
    // map[unitId][tokenIndex] = { starts: [], ends: [] }
    const tokenTimes: Record<string, number[]> = {};

    for (const [type, text] of diffs) {
        const length = text.length;

        if (type === diff.EQUAL) {
            // Match!
            // Map rawTimeMap[rawIdx ... rawIdx+len] to aiTokenMap[aiIdx ... aiIdx+len]
            for (let i = 0; i < length; i++) {
                const rTime = rawTimeMap[rawIdx + i];
                const aiMap = aiTokenMap[aiIdx + i];

                if (aiMap && rTime !== undefined) {
                    const key = `${aiMap.unitId}-${aiMap.tokenIndex}`;
                    if (!tokenTimes[key]) tokenTimes[key] = [];
                    tokenTimes[key].push(rTime);
                }
            }
            rawIdx += length;
            aiIdx += length;
        } else if (type === diff.DELETE) {
            // Present in Raw, missing in AI.
            // Just advance raw pointer.
            rawIdx += length;
        } else if (type === diff.INSERT) {
            // Present in AI, missing in Raw.
            // Advance AI pointer. No time mapping (interpolation needed).
            aiIdx += length;
        }
    }

    // 5. Apply Times to Tokens
    for (let u = 0; u < material.units.length; u++) {
        const unit = material.units[u];

        // Unit boundaries enforcement
        // We should clamp tokens to be within unit start/end potentially?
        // Or trust the alignment more? 
        // Alignment is often better than the rough 30s unit slice.
        // But let's be safe.

        for (let t = 0; t < unit.script.length; t++) {
            const key = `${u}-${t}`;
            const times = tokenTimes[key];

            if (times && times.length > 0) {
                // Remove outliers? No, simple min/max
                let start = Math.min(...times);
                let end = Math.max(...times);

                // Assign
                unit.script[t].start = start;
                unit.script[t].end = end;
            }
        }

        // 6. Interpolation for missing tokens
        // Forward pass to fill gaps
        let lastEnd = unit.start;
        for (let t = 0; t < unit.script.length; t++) {
            const token = unit.script[t];
            if (token.start === undefined) {
                token.start = lastEnd;
            } else {
                if (token.start < lastEnd) token.start = lastEnd; // Monotonicity
                lastEnd = token.end!;
            }
        }

        // Backward/Final pass to fix ends? 
        // If a token has start but no end? (Implicit in logic above: if it has times, it has start & end)
        // If it was interpolated (INSERT), it has start=lastEnd. We need end.

        for (let t = 0; t < unit.script.length; t++) {
            const token = unit.script[t];
            if (token.end === undefined) {
                // Look ahead for next start
                let nextStart = unit.end;
                if (t + 1 < unit.script.length) {
                    // Find next token with a real start (or already interpolated start)
                    nextStart = unit.script[t + 1].start || nextStart;
                }
                token.end = nextStart;
            }

            // Safety clamp
            if (token.end < token.start!) token.end = token.start! + 0.1;
        }
    }

    return material;
}
