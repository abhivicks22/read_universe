/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import JSZip from 'jszip';
import { formatRawText, type ContentBlock } from './textFormatter';

export interface ParsedEPUB {
    pages: string[];
    structuredPages: ContentBlock[][];
    totalPages: number;
    wordCount: number;
    title: string;
}

export type ProgressCallback = (current: number, total: number) => void;

/**
 * Parse an EPUB file into pages (chapters).
 * EPUB is a zip archive containing HTML files. We:
 * 1. Unzip with JSZip
 * 2. Read container.xml to find the OPF file
 * 3. Read the OPF to get the spine (reading order)
 * 4. Extract text from each HTML chapter
 */
export async function parseEPUB(
    file: File,
    onProgress?: ProgressCallback
): Promise<ParsedEPUB> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 1. Find the OPF file via container.xml
    const containerXml = await zip.file('META-INF/container.xml')?.async('string');
    if (!containerXml) throw new Error('Invalid EPUB: missing container.xml');

    const opfPath = extractAttribute(containerXml, 'rootfile', 'full-path');
    if (!opfPath) throw new Error('Invalid EPUB: cannot find OPF path');

    const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

    // 2. Read the OPF to get metadata and spine
    const opfContent = await zip.file(opfPath)?.async('string');
    if (!opfContent) throw new Error('Invalid EPUB: cannot read OPF');

    const title = extractTagContent(opfContent, 'dc:title') || file.name.replace('.epub', '');

    // Get manifest items (id -> href mapping)
    const manifest = new Map<string, string>();
    const manifestMatches = opfContent.matchAll(/<item\s[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*\/?>/gi);
    for (const match of manifestMatches) {
        manifest.set(match[1], match[2]);
    }

    // Get spine order (list of itemref ids)
    const spineIds: string[] = [];
    const spineMatches = opfContent.matchAll(/<itemref\s[^>]*idref="([^"]+)"[^>]*\/?>/gi);
    for (const match of spineMatches) {
        spineIds.push(match[1]);
    }

    if (spineIds.length === 0) {
        throw new Error('Invalid EPUB: empty spine');
    }

    // 3. Read each chapter in spine order
    const pages: string[] = [];
    const structuredPages: ContentBlock[][] = [];
    let totalWordCount = 0;
    const total = spineIds.length;

    for (let i = 0; i < spineIds.length; i++) {
        const href = manifest.get(spineIds[i]);
        if (!href) {
            onProgress?.(i + 1, total);
            continue;
        }

        const filePath = opfDir + decodeURIComponent(href);
        const htmlContent = await zip.file(filePath)?.async('string');

        if (!htmlContent) {
            onProgress?.(i + 1, total);
            continue;
        }

        // Extract text from HTML
        const text = htmlToText(htmlContent);
        if (text.trim().length < 10) {
            onProgress?.(i + 1, total);
            continue; // Skip near-empty pages (title pages, etc. with just images)
        }

        pages.push(text.trim());

        // Generate structured blocks from the text
        const blocks = formatFromHTML(htmlContent);
        structuredPages.push(blocks.length > 0 ? blocks : formatRawText(text));

        totalWordCount += text.trim().split(/\s+/).filter(Boolean).length;
        onProgress?.(i + 1, total);
    }

    return {
        pages,
        structuredPages,
        totalPages: pages.length,
        wordCount: totalWordCount,
        title,
    };
}

/**
 * Extract text from HTML, removing tags.
 */
function htmlToText(html: string): string {
    // Remove script, style, and their content
    let text = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
    // Remove head
    text = text.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
    // Convert <br>, <p>, <div>, <h1-6>, <li> to newlines
    text = text.replace(/<(br|hr)\s*\/?>/gi, '\n');
    text = text.replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n\n');
    // Remove remaining tags
    text = text.replace(/<[^>]+>/g, '');
    // Decode common HTML entities
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&mdash;/g, '—');
    text = text.replace(/&ndash;/g, '–');
    text = text.replace(/&ldquo;/g, '\u201C');
    text = text.replace(/&rdquo;/g, '\u201D');
    text = text.replace(/&lsquo;/g, '\u2018');
    text = text.replace(/&rsquo;/g, '\u2019');
    text = text.replace(/&hellip;/g, '…');
    // Collapse whitespace
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
}

/**
 * Extract structured ContentBlocks from EPUB HTML.
 * This gives better results than raw text since we can detect h1-h6 tags directly.
 */
function formatFromHTML(html: string): ContentBlock[] {
    const blocks: ContentBlock[] = [];

    // Remove script, style, head
    let body = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
    body = body.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');

    // Extract body content if <body> tag exists
    const bodyMatch = body.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) body = bodyMatch[1];

    // Match block-level elements
    const blockRegex = /<(h[1-6]|p|div|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;

    while ((match = blockRegex.exec(body)) !== null) {
        const tag = match[1].toLowerCase();
        const rawText = match[2]
            .replace(/<[^>]+>/g, '') // strip inline tags
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/&mdash;/g, '—')
            .replace(/&ndash;/g, '–')
            .replace(/&ldquo;/g, '\u201C')
            .replace(/&rdquo;/g, '\u201D')
            .replace(/&lsquo;/g, '\u2018')
            .replace(/&rsquo;/g, '\u2019')
            .replace(/&hellip;/g, '…')
            .replace(/\s+/g, ' ')
            .trim();

        if (!rawText) continue;

        if (tag === 'h1') {
            blocks.push({ type: 'heading', text: rawText, level: 1 });
        } else if (tag === 'h2') {
            blocks.push({ type: 'heading', text: rawText, level: 2 });
        } else if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
            blocks.push({ type: 'heading', text: rawText, level: 3 });
        } else if (tag === 'blockquote') {
            blocks.push({ type: 'quote', text: rawText });
        } else {
            // p or div — check if it's dialogue
            if (/^['""\u2018\u2019\u201C\u201D]/.test(rawText) && rawText.length < 500) {
                blocks.push({ type: 'quote', text: rawText });
            } else {
                blocks.push({ type: 'paragraph', text: rawText });
            }
        }
    }

    return blocks;
}

/* --- XML helpers --- */

function extractAttribute(xml: string, tagName: string, attrName: string): string | null {
    const regex = new RegExp(`<${tagName}\\s[^>]*${attrName}="([^"]+)"`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : null;
}

function extractTagContent(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]+)</${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
}
