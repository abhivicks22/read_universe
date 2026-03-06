'use client';

/**
 * Text formatting utility — converts raw PDF text items into structured
 * content blocks for book-quality rendering. Zero content loss.
 */

export type ContentBlock =
    | { type: 'heading'; text: string; level: 1 | 2 | 3 }
    | { type: 'paragraph'; text: string }
    | { type: 'quote'; text: string }
    | { type: 'separator' };

export interface TextLineItem {
    text: string;
    fontSize: number;
    yPosition: number;
}

/**
 * Format raw text items (with font metadata from pdf.js) into ContentBlocks.
 */
export function formatTextItems(items: TextLineItem[]): ContentBlock[] {
    if (items.length === 0) return [];

    // Find median font size (= body text size)
    const fontSizes = items.map((i) => i.fontSize).filter((s) => s > 0);
    fontSizes.sort((a, b) => a - b);
    const medianFontSize = fontSizes.length > 0
        ? fontSizes[Math.floor(fontSizes.length / 2)]
        : 12;

    // Group items into logical lines by Y-position proximity
    const lines: { text: string; fontSize: number; yPosition: number; maxFontSize: number }[] = [];
    let currentLine = { text: '', fontSize: items[0].fontSize, yPosition: items[0].yPosition, maxFontSize: items[0].fontSize };

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (i === 0) {
            currentLine.text = item.text;
            continue;
        }

        const yDiff = Math.abs(item.yPosition - currentLine.yPosition);

        if (yDiff < 3) {
            // Same line — append
            if (currentLine.text && !currentLine.text.endsWith(' ') && !item.text.startsWith(' ')) {
                currentLine.text += ' ';
            }
            currentLine.text += item.text;
            currentLine.maxFontSize = Math.max(currentLine.maxFontSize, item.fontSize);
        } else {
            // New line — push current, start new
            if (currentLine.text.trim()) {
                lines.push({ ...currentLine, text: currentLine.text.trim() });
            }
            currentLine = { text: item.text, fontSize: item.fontSize, yPosition: item.yPosition, maxFontSize: item.fontSize };
        }
    }
    if (currentLine.text.trim()) {
        lines.push({ ...currentLine, text: currentLine.text.trim() });
    }

    // Now classify lines into blocks
    const blocks: ContentBlock[] = [];
    let paragraphBuffer: string[] = [];

    const flushParagraph = () => {
        if (paragraphBuffer.length > 0) {
            const text = paragraphBuffer.join(' ').trim();
            if (text) {
                // Check if the entire paragraph is a quote
                if (isQuoteText(text)) {
                    blocks.push({ type: 'quote', text });
                } else {
                    blocks.push({ type: 'paragraph', text });
                }
            }
            paragraphBuffer = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const prevLine = i > 0 ? lines[i - 1] : null;
        const yGap = prevLine ? Math.abs(line.yPosition - prevLine.yPosition) : 0;

        // Check for separator patterns
        if (isSeparator(line.text)) {
            flushParagraph();
            blocks.push({ type: 'separator' });
            continue;
        }

        // Check for headings
        const headingLevel = detectHeadingLevel(line, medianFontSize, yGap);
        if (headingLevel) {
            flushParagraph();
            blocks.push({ type: 'heading', text: line.text, level: headingLevel });
            continue;
        }

        // Check for large Y-gap (paragraph break)
        if (prevLine && yGap > medianFontSize * 1.8) {
            flushParagraph();
        }

        // Accumulate into paragraph
        paragraphBuffer.push(line.text);
    }

    flushParagraph();
    return blocks;
}

/**
 * Fallback formatter for raw text strings (no font metadata).
 * Used for existing books stored as plain strings.
 */
export function formatRawText(pageText: string): ContentBlock[] {
    if (!pageText.trim()) return [];

    const lines = pageText.split('\n');
    const blocks: ContentBlock[] = [];
    let paragraphBuffer: string[] = [];

    const flushParagraph = () => {
        if (paragraphBuffer.length > 0) {
            const text = paragraphBuffer.join(' ').replace(/\s+/g, ' ').trim();
            if (text) {
                if (isQuoteText(text)) {
                    blocks.push({ type: 'quote', text });
                } else {
                    blocks.push({ type: 'paragraph', text });
                }
            }
            paragraphBuffer = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Empty line = paragraph break
        if (!line) {
            flushParagraph();
            continue;
        }

        // Separator
        if (isSeparator(line)) {
            flushParagraph();
            blocks.push({ type: 'separator' });
            continue;
        }

        // Heading detection (without font data, rely on patterns)
        const headingLevel = detectHeadingFromText(line);
        if (headingLevel) {
            flushParagraph();
            blocks.push({ type: 'heading', text: line, level: headingLevel });
            continue;
        }

        paragraphBuffer.push(line);
    }

    flushParagraph();
    return blocks;
}

/* ---- Helpers ---- */

function isSeparator(text: string): boolean {
    const cleaned = text.trim();
    return /^[\s*\-_=~•·]{3,}$/.test(cleaned) ||
        cleaned === '* * *' ||
        cleaned === '***' ||
        cleaned === '---' ||
        cleaned === '___' ||
        cleaned === '⁂';
}

function isQuoteText(text: string): boolean {
    // Text that starts with common dialogue markers
    return /^['""\u2018\u2019\u201C\u201D]/.test(text) && text.length < 500;
}

const CHAPTER_PATTERN = /^(chapter|part|book|section|prologue|epilogue|introduction|preface|foreword|afterword|appendix)\b/i;
const ROMAN_NUMERAL = /^[IVXLCDM]+\.?$/;

function detectHeadingLevel(
    line: { text: string; maxFontSize: number },
    medianFontSize: number,
    yGap: number
): 1 | 2 | 3 | null {
    const text = line.text.trim();
    if (text.length > 80) return null; // Headings are typically short
    if (text.length < 1) return null;

    // Font-size based detection (most reliable)
    const sizeRatio = line.maxFontSize / medianFontSize;

    if (sizeRatio >= 1.6) return 1; // Very large = chapter title
    if (sizeRatio >= 1.3) return 2; // Moderately large = section heading

    // Pattern-based detection
    if (CHAPTER_PATTERN.test(text)) return 1;
    if (ROMAN_NUMERAL.test(text)) return 2;

    // ALL CAPS short line with some spacing before it
    if (text.length < 60 && text === text.toUpperCase() && /[A-Z]{3,}/.test(text) && yGap > medianFontSize * 2) {
        return 2;
    }

    return null;
}

function detectHeadingFromText(text: string): 1 | 2 | 3 | null {
    if (text.length > 80 || text.length < 1) return null;

    // Chapter patterns
    if (CHAPTER_PATTERN.test(text)) return 1;

    // Roman numerals standalone
    if (ROMAN_NUMERAL.test(text)) return 2;

    // ALL CAPS short line
    if (text.length < 60 && text === text.toUpperCase() && /[A-Z]{3,}/.test(text) && !/[.!?]$/.test(text)) {
        return 2;
    }

    // Numbered sections like "1." or "1.1" at start of short line
    if (/^\d+\.\d*\s/.test(text) && text.length < 60) {
        return 3;
    }

    return null;
}
