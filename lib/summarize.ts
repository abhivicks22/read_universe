'use client';

export interface SummaryResult {
    sentences: string[];
    keyPhrases: string[];
}

/**
 * Extract key sentences from text using a TF-IDF-inspired scoring approach.
 * Fully client-side, no API needed.
 */
export function summarizePage(pageText: string, maxSentences = 3): SummaryResult {
    // Split into sentences
    const sentences = pageText
        .replace(/\n+/g, ' ')
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20 && s.length < 500);

    if (sentences.length === 0) {
        return { sentences: [], keyPhrases: [] };
    }

    if (sentences.length <= maxSentences) {
        return { sentences, keyPhrases: extractKeyPhrases(pageText) };
    }

    // Calculate word frequencies
    const wordFreq = new Map<string, number>();
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
        'should', 'may', 'might', 'must', 'can', 'could', 'to', 'of', 'in',
        'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
        'during', 'before', 'after', 'above', 'below', 'between', 'but',
        'and', 'or', 'not', 'no', 'nor', 'this', 'that', 'these', 'those',
        'it', 'its', 'he', 'she', 'they', 'them', 'their', 'his', 'her',
        'we', 'our', 'you', 'your', 'i', 'me', 'my', 'who', 'which', 'what',
        'when', 'where', 'how', 'if', 'so', 'than', 'then', 'just', 'also',
    ]);

    const allWords = pageText.toLowerCase().split(/\s+/);
    for (const word of allWords) {
        const clean = word.replace(/[^a-z]/g, '');
        if (clean.length > 2 && !stopWords.has(clean)) {
            wordFreq.set(clean, (wordFreq.get(clean) || 0) + 1);
        }
    }

    // Score each sentence
    const scored = sentences.map((sentence, index) => {
        const words = sentence.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z]/g, ''));
        let score = 0;
        for (const w of words) {
            score += wordFreq.get(w) || 0;
        }
        // Normalize by sentence length
        score = words.length > 0 ? score / words.length : 0;
        // Boost sentences near the start
        if (index < 3) score *= 1.3;
        // Boost longer sentences slightly (more informative)
        if (sentence.length > 100) score *= 1.1;
        return { sentence, score, index };
    });

    // Sort by score, take top N, then reorder by original position
    scored.sort((a, b) => b.score - a.score);
    const topSentences = scored
        .slice(0, maxSentences)
        .sort((a, b) => a.index - b.index)
        .map((s) => s.sentence);

    return {
        sentences: topSentences,
        keyPhrases: extractKeyPhrases(pageText),
    };
}

function extractKeyPhrases(text: string): string[] {
    const wordFreq = new Map<string, number>();
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
        'and', 'or', 'not', 'this', 'that', 'it', 'its', 'he', 'she',
        'they', 'we', 'you', 'i', 'me', 'my', 'so', 'but', 'if',
    ]);

    const words = text.toLowerCase().split(/\s+/);
    for (const w of words) {
        const clean = w.replace(/[^a-z]/g, '');
        if (clean.length > 3 && !stopWords.has(clean)) {
            wordFreq.set(clean, (wordFreq.get(clean) || 0) + 1);
        }
    }

    return [...wordFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word]) => word);
}

export function summarizeBook(pages: string[], maxSentencesPerPage = 2): string[] {
    const summaries: string[] = [];
    for (const page of pages) {
        if (page.trim().length < 50) continue;
        const { sentences } = summarizePage(page, maxSentencesPerPage);
        summaries.push(...sentences);
    }
    return summaries;
}
