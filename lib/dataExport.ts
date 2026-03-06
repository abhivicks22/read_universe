'use client';

import {
    getPreferences,
    getAllProgress,
    getVocabWords,
    getAllParsedBooks,
    getAllReadingSessions,
    savePreferences,
    saveProgress,
    addVocabWord,
    addReadingSession,
    addBookmark,
    addHighlight,
    addNote,
    type Bookmark,
    type Highlight,
    type Note,
    type ReadingSession,
} from './storage';
import { openDB } from 'idb';

interface ExportData {
    version: 1;
    exportedAt: string;
    preferences: Awaited<ReturnType<typeof getPreferences>>;
    progress: Awaited<ReturnType<typeof getAllProgress>>;
    vocabulary: Awaited<ReturnType<typeof getVocabWords>>;
    sessions: Awaited<ReturnType<typeof getAllReadingSessions>>;
    bookmarks: Bookmark[];
    highlights: Highlight[];
    notes: Note[];
}

/**
 * Export all user data (annotations, vocabulary, progress, settings) as JSON.
 * Excludes parsed book text (too large) — only exports user-generated data.
 */
export async function exportAllData(): Promise<void> {
    const db = await openDB('antigravity', 4);

    const data: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        preferences: await getPreferences(),
        progress: await getAllProgress(),
        vocabulary: await getVocabWords(),
        sessions: await getAllReadingSessions(),
        bookmarks: await db.getAll('bookmarks'),
        highlights: await db.getAll('highlights'),
        notes: await db.getAll('notes'),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `universe-read-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Import data from a JSON backup file.
 */
export async function importAllData(file: File): Promise<{ imported: number }> {
    const text = await file.text();
    const data: ExportData = JSON.parse(text);

    if (data.version !== 1) {
        throw new Error('Unsupported backup version');
    }

    let imported = 0;

    // Preferences
    if (data.preferences) {
        await savePreferences(data.preferences);
        imported++;
    }

    // Progress
    for (const p of data.progress || []) {
        await saveProgress(p);
        imported++;
    }

    // Vocabulary
    for (const v of data.vocabulary || []) {
        const { id, ...rest } = v;
        await addVocabWord(rest);
        imported++;
    }

    // Sessions
    for (const s of data.sessions || []) {
        const { id, ...rest } = s;
        await addReadingSession(rest);
        imported++;
    }

    // Bookmarks
    for (const b of data.bookmarks || []) {
        const { id, ...rest } = b;
        await addBookmark(rest);
        imported++;
    }

    // Highlights
    for (const h of data.highlights || []) {
        const { id, ...rest } = h;
        await addHighlight(rest);
        imported++;
    }

    // Notes
    for (const n of data.notes || []) {
        const { id, ...rest } = n;
        await addNote(rest);
        imported++;
    }

    return { imported };
}
