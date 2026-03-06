export interface DictionaryResult {
    word: string;
    phonetic: string;
    partOfSpeech: string;
    definitions: string[];
    found: boolean;
}

export async function lookupWord(word: string): Promise<DictionaryResult> {
    const cleanWord = word.toLowerCase().replace(/[^a-z'-]/g, '');

    if (!cleanWord || cleanWord.length < 2) {
        return { word: cleanWord, phonetic: '', partOfSpeech: '', definitions: [], found: false };
    }

    try {
        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`
        );

        if (!response.ok) {
            return { word: cleanWord, phonetic: '', partOfSpeech: '', definitions: [], found: false };
        }

        const data = await response.json();
        const entry = data[0];

        const phonetic =
            entry.phonetic ||
            entry.phonetics?.find((p: { text?: string }) => p.text)?.text ||
            '';

        // Gather definitions from all meanings
        const allDefinitions: string[] = [];
        let firstPartOfSpeech = '';

        for (const meaning of entry.meanings || []) {
            if (!firstPartOfSpeech) {
                firstPartOfSpeech = meaning.partOfSpeech || '';
            }
            for (const def of meaning.definitions || []) {
                if (def.definition) {
                    allDefinitions.push(def.definition);
                }
            }
        }

        return {
            word: cleanWord,
            phonetic,
            partOfSpeech: firstPartOfSpeech,
            definitions: allDefinitions.slice(0, 4), // Top 4 definitions
            found: true,
        };
    } catch {
        return { word: cleanWord, phonetic: '', partOfSpeech: '', definitions: [], found: false };
    }
}

/**
 * Extract context sentence around a word from page text.
 * Grabs ±100 chars and trims to nearest sentence boundary.
 */
export function extractContextSentence(
    pageText: string,
    word: string
): string {
    const idx = pageText.toLowerCase().indexOf(word.toLowerCase());
    if (idx === -1) return '';

    const start = Math.max(0, idx - 100);
    const end = Math.min(pageText.length, idx + word.length + 100);
    let snippet = pageText.slice(start, end);

    // Trim to sentence boundaries
    const sentenceStart = snippet.search(/[.!?]\s/);
    if (sentenceStart > 0 && sentenceStart < idx - start) {
        snippet = snippet.slice(sentenceStart + 2);
    }

    const sentenceEnd = snippet.search(/[.!?](?:\s|$)/);
    if (sentenceEnd > 0) {
        snippet = snippet.slice(0, sentenceEnd + 1);
    }

    return snippet.trim();
}
