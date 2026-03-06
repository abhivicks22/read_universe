/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { formatTextItems, type ContentBlock, type TextLineItem } from './textFormatter';

export interface ParsedPDF {
    pages: string[];
    structuredPages: ContentBlock[][];
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

    // On some mobile browsers (iOS Safari), loading a local worker file from public/ can fail
    // due to strict mime-type checking or service worker conflicts. Fallback to unpkg CDN.
    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    } catch (e) {
        console.warn('Failed to set local worker, falling back to CDN', e);
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
    });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pages: string[] = [];
    const structuredPages: ContentBlock[][] = [];
    let totalWordCount = 0;

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Collect both raw text and font-enriched text items
        let pageText = '';
        let lastY: number | null = null;
        const textLineItems: TextLineItem[] = [];

        for (const item of textContent.items) {
            const textItem = item as any;
            if (textItem.str === undefined) continue;

            const currentY = textItem.transform ? textItem.transform[5] : null;
            const fontSize = textItem.transform ? Math.abs(textItem.transform[0]) : 12;

            // Collect items with font metadata for structured formatting
            if (textItem.str.trim()) {
                textLineItems.push({
                    text: textItem.str,
                    fontSize,
                    yPosition: currentY ?? 0,
                });
            }

            // Build raw text (unchanged from before — backward compat)
            if (lastY !== null && currentY !== null) {
                const yDiff = Math.abs(currentY - lastY);
                if (yDiff > 5) {
                    pageText += '\n';
                    if (yDiff > 15) {
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

        // Generate structured blocks from font-enriched items
        const structured = textLineItems.length > 0
            ? formatTextItems(textLineItems)
            : [{ type: 'paragraph' as const, text: pageText.trim() }];
        structuredPages.push(structured);

        totalWordCount += pageText
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;

        onProgress?.(i, totalPages);
    }

    return { pages, structuredPages, totalPages, wordCount: totalWordCount };
}
