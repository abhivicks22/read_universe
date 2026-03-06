'use client';

import type { Highlight, Note, Bookmark } from '@/lib/storage';

/**
 * Export highlights, notes, and bookmarks as a Markdown file.
 */
export function exportAsMarkdown(
    bookName: string,
    bookmarks: Bookmark[],
    highlights: Highlight[],
    notes: Note[]
): string {
    const lines: string[] = [];
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    lines.push(`# ${bookName.replace('.pdf', '')}`);
    lines.push(`> Exported from Anti Gravity on ${date}`);
    lines.push('');

    // Stats
    const stats: string[] = [];
    if (bookmarks.length > 0) stats.push(`${bookmarks.length} bookmarks`);
    if (highlights.length > 0) stats.push(`${highlights.length} highlights`);
    if (notes.length > 0) stats.push(`${notes.length} notes`);
    if (stats.length > 0) {
        lines.push(`**${stats.join(' • ')}**`);
        lines.push('');
    }

    // Bookmarks
    if (bookmarks.length > 0) {
        lines.push('---');
        lines.push('## 🔖 Bookmarks');
        lines.push('');
        const sorted = [...bookmarks].sort((a, b) => a.pageNumber - b.pageNumber);
        for (const bm of sorted) {
            lines.push(`- **Page ${bm.pageNumber}** — ${bm.label || 'Bookmark'}`);
        }
        lines.push('');
    }

    // Highlights grouped by page
    if (highlights.length > 0) {
        lines.push('---');
        lines.push('## 🖍️ Highlights');
        lines.push('');
        const sorted = [...highlights].sort((a, b) => a.pageNumber - b.pageNumber);
        let lastPage = -1;
        for (const hl of sorted) {
            if (hl.pageNumber !== lastPage) {
                if (lastPage !== -1) lines.push('');
                lines.push(`### Page ${hl.pageNumber}`);
                lastPage = hl.pageNumber;
            }
            const colorEmoji =
                hl.color === 'yellow' ? '🟡' : hl.color === 'green' ? '🟢' : hl.color === 'blue' ? '🔵' : '🩷';
            lines.push(`> ${colorEmoji} "${hl.text}"`);
        }
        lines.push('');
    }

    // Notes grouped by page
    if (notes.length > 0) {
        lines.push('---');
        lines.push('## 📝 Notes');
        lines.push('');
        const sorted = [...notes].sort((a, b) => a.pageNumber - b.pageNumber);
        let lastPage = -1;
        for (const note of sorted) {
            if (note.pageNumber !== lastPage) {
                if (lastPage !== -1) lines.push('');
                lines.push(`### Page ${note.pageNumber}`);
                lastPage = note.pageNumber;
            }
            lines.push(`- ${note.content}`);
        }
        lines.push('');
    }

    lines.push('---');
    lines.push('*Exported with [Anti Gravity](https://read-universe.vercel.app) 🚀*');

    return lines.join('\n');
}

export function downloadMarkdown(content: string, fileName: string): void {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
