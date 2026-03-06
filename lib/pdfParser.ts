/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

export interface ParsedPDF {
    pages: string[];
    totalPages: number;
    wordCount: number;
}

export type ProgressCallback = (current: number, total: number) => void;

export async function parsePDF(
    file: File,
    onProgress?: ProgressCallback
): Promise<ParsedPDF> {
    // Dynamically import pdfjs-dist (client-side only, avoids SSR DOMMatrix error)
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker source from CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pages: string[] = [];
    let totalWordCount = 0;

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Build text from items, preserving paragraph structure
        let pageText = '';
        let lastY: number | null = null;

        for (const item of textContent.items) {
            const textItem = item as any;
            if (!textItem.str && textItem.str !== '') continue;

            const currentY = textItem.transform ? textItem.transform[5] : null;

            if (lastY !== null && currentY !== null) {
                const yDiff = Math.abs(currentY - lastY);
                if (yDiff > 5) {
                    // New line
                    pageText += '\n';
                    if (yDiff > 15) {
                        // Paragraph break
                        pageText += '\n';
                    }
                } else if (textItem.str && !pageText.endsWith(' ') && !textItem.str.startsWith(' ')) {
                    pageText += ' ';
                }
            }

            pageText += textItem.str;
            lastY = currentY;
        }

        pages.push(pageText.trim());
        totalWordCount += pageText
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;

        onProgress?.(i, totalPages);
    }

    return { pages, totalPages, wordCount: totalWordCount };
}
