import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ThemeId } from './themes';

/* ============================================
   Schema
   ============================================ */
export interface Preferences {
    theme: ThemeId;
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    twoColumn: boolean;
    continuousScroll: boolean;
    readingRuler: boolean;
}

export interface ReadingProgress {
    fileHash: string;
    fileName: string;
    currentPage: number;
    totalPages: number;
    percent: number;
    lastReadAt: string;
    wordCount: number;
}

export interface VocabWord {
    id?: number;
    word: string;
    definition: string;
    phonetic: string;
    partOfSpeech: string;
    contextSentence: string;
    pageNumber: number;
    bookName: string;
    dateAdded: string;
    mastered: boolean;
}

export interface Bookmark {
    id?: number;
    fileHash: string;
    pageNumber: number;
    label: string;
    createdAt: string;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export interface Highlight {
    id?: number;
    fileHash: string;
    pageNumber: number;
    text: string;
    color: HighlightColor;
    startOffset: number;
    endOffset: number;
    createdAt: string;
}

export interface Note {
    id?: number;
    fileHash: string;
    pageNumber: number;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReadingSession {
    id?: number;
    fileHash: string;
    date: string; // YYYY-MM-DD
    pagesRead: number;
    timeSpentMs: number;
}

interface ParsedBook {
    fileHash: string;
    fileName: string;
    pages: string[];
    totalPages: number;
    wordCount: number;
    parsedAt: string;
}

interface AntiGravityDB extends DBSchema {
    preferences: {
        key: string;
        value: Preferences;
    };
    readingProgress: {
        key: string;
        value: ReadingProgress;
    };
    vocabulary: {
        key: number;
        value: VocabWord;
        indexes: {
            'by-word': string;
            'by-book': string;
            'by-mastered': number;
        };
    };
    parsedBooks: {
        key: string;
        value: ParsedBook;
    };
    bookmarks: {
        key: number;
        value: Bookmark;
        indexes: {
            'by-book': string;
            'by-page': [string, number];
        };
    };
    highlights: {
        key: number;
        value: Highlight;
        indexes: {
            'by-book': string;
            'by-page': [string, number];
        };
    };
    notes: {
        key: number;
        value: Note;
        indexes: {
            'by-book': string;
            'by-page': [string, number];
        };
    };
    readingSessions: {
        key: number;
        value: ReadingSession;
        indexes: {
            'by-book': string;
            'by-date': string;
        };
    };
}

/* ============================================
   Database Init
   ============================================ */
let dbPromise: Promise<IDBPDatabase<AntiGravityDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AntiGravityDB>> {
    if (!dbPromise) {
        dbPromise = openDB<AntiGravityDB>('antigravity', 3, {
            upgrade(db, oldVersion) {
                if (oldVersion < 1) {
                    db.createObjectStore('preferences');
                    db.createObjectStore('readingProgress', { keyPath: 'fileHash' });
                    const vocabStore = db.createObjectStore('vocabulary', {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    vocabStore.createIndex('by-word', 'word');
                    vocabStore.createIndex('by-book', 'bookName');
                    vocabStore.createIndex('by-mastered', 'mastered');
                }
                if (oldVersion < 2) {
                    if (!db.objectStoreNames.contains('parsedBooks')) {
                        db.createObjectStore('parsedBooks', { keyPath: 'fileHash' });
                    }
                }
                if (oldVersion < 3) {
                    // Bookmarks
                    if (!db.objectStoreNames.contains('bookmarks')) {
                        const bmStore = db.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true });
                        bmStore.createIndex('by-book', 'fileHash');
                        bmStore.createIndex('by-page', ['fileHash', 'pageNumber']);
                    }
                    // Highlights
                    if (!db.objectStoreNames.contains('highlights')) {
                        const hlStore = db.createObjectStore('highlights', { keyPath: 'id', autoIncrement: true });
                        hlStore.createIndex('by-book', 'fileHash');
                        hlStore.createIndex('by-page', ['fileHash', 'pageNumber']);
                    }
                    // Notes
                    if (!db.objectStoreNames.contains('notes')) {
                        const noteStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
                        noteStore.createIndex('by-book', 'fileHash');
                        noteStore.createIndex('by-page', ['fileHash', 'pageNumber']);
                    }
                    // Reading sessions
                    if (!db.objectStoreNames.contains('readingSessions')) {
                        const sessStore = db.createObjectStore('readingSessions', { keyPath: 'id', autoIncrement: true });
                        sessStore.createIndex('by-book', 'fileHash');
                        sessStore.createIndex('by-date', 'date');
                    }
                }
            },
        });
    }
    return dbPromise;
}

/* ============================================
   Preferences
   ============================================ */
const PREF_KEY = 'user-prefs';

export const defaultPreferences: Preferences = {
    theme: 'light',
    fontFamily: "'Literata', serif",
    fontSize: 18,
    lineHeight: 1.8,
    twoColumn: false,
    continuousScroll: false,
    readingRuler: false,
};

export async function getPreferences(): Promise<Preferences> {
    try {
        const db = await getDB();
        const prefs = await db.get('preferences', PREF_KEY);
        return { ...defaultPreferences, ...prefs };
    } catch {
        return defaultPreferences;
    }
}

export async function savePreferences(prefs: Partial<Preferences>): Promise<void> {
    const db = await getDB();
    const existing = await getPreferences();
    await db.put('preferences', { ...existing, ...prefs }, PREF_KEY);
}

/* ============================================
   Reading Progress
   ============================================ */
export async function getProgress(fileHash: string): Promise<ReadingProgress | undefined> {
    const db = await getDB();
    return db.get('readingProgress', fileHash);
}

export async function saveProgress(progress: ReadingProgress): Promise<void> {
    const db = await getDB();
    await db.put('readingProgress', { ...progress, lastReadAt: new Date().toISOString() });
}

export async function getAllProgress(): Promise<ReadingProgress[]> {
    const db = await getDB();
    return db.getAll('readingProgress');
}

export async function deleteProgress(fileHash: string): Promise<void> {
    const db = await getDB();
    await db.delete('readingProgress', fileHash);
}

/* ============================================
   Parsed Books
   ============================================ */
export async function saveParsedBook(data: {
    fileHash: string;
    fileName: string;
    pages: string[];
    totalPages: number;
    wordCount: number;
}): Promise<void> {
    const db = await getDB();
    await db.put('parsedBooks', { ...data, parsedAt: new Date().toISOString() });
}

export async function getParsedBook(fileHash: string) {
    const db = await getDB();
    return db.get('parsedBooks', fileHash);
}

export async function getAllParsedBooks(): Promise<ParsedBook[]> {
    const db = await getDB();
    return db.getAll('parsedBooks');
}

export async function deleteParsedBook(fileHash: string): Promise<void> {
    const db = await getDB();
    await db.delete('parsedBooks', fileHash);
}

/* ============================================
   Bookmarks
   ============================================ */
export async function addBookmark(bm: Omit<Bookmark, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('bookmarks', bm as Bookmark);
}

export async function getBookmarksByBook(fileHash: string): Promise<Bookmark[]> {
    const db = await getDB();
    return db.getAllFromIndex('bookmarks', 'by-book', fileHash);
}

export async function removeBookmark(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('bookmarks', id);
}

export async function isPageBookmarked(fileHash: string, pageNumber: number): Promise<Bookmark | undefined> {
    const db = await getDB();
    const results = await db.getAllFromIndex('bookmarks', 'by-page', [fileHash, pageNumber]);
    return results[0];
}

/* ============================================
   Highlights
   ============================================ */
export async function addHighlight(hl: Omit<Highlight, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('highlights', hl as Highlight);
}

export async function getHighlightsByBook(fileHash: string): Promise<Highlight[]> {
    const db = await getDB();
    return db.getAllFromIndex('highlights', 'by-book', fileHash);
}

export async function getHighlightsByPage(fileHash: string, pageNumber: number): Promise<Highlight[]> {
    const db = await getDB();
    return db.getAllFromIndex('highlights', 'by-page', [fileHash, pageNumber]);
}

export async function removeHighlight(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('highlights', id);
}

/* ============================================
   Notes
   ============================================ */
export async function addNote(note: Omit<Note, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('notes', note as Note);
}

export async function getNotesByBook(fileHash: string): Promise<Note[]> {
    const db = await getDB();
    return db.getAllFromIndex('notes', 'by-book', fileHash);
}

export async function getNotesByPage(fileHash: string, pageNumber: number): Promise<Note[]> {
    const db = await getDB();
    return db.getAllFromIndex('notes', 'by-page', [fileHash, pageNumber]);
}

export async function updateNote(id: number, content: string): Promise<void> {
    const db = await getDB();
    const note = await db.get('notes', id);
    if (note) {
        await db.put('notes', { ...note, content, updatedAt: new Date().toISOString() });
    }
}

export async function removeNote(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('notes', id);
}

/* ============================================
   Reading Sessions (Stats)
   ============================================ */
export async function addReadingSession(session: Omit<ReadingSession, 'id'>): Promise<void> {
    const db = await getDB();
    await db.add('readingSessions', session as ReadingSession);
}

export async function getReadingSessionsByBook(fileHash: string): Promise<ReadingSession[]> {
    const db = await getDB();
    return db.getAllFromIndex('readingSessions', 'by-book', fileHash);
}

export async function getAllReadingSessions(): Promise<ReadingSession[]> {
    const db = await getDB();
    return db.getAll('readingSessions');
}

export async function getReadingStreak(): Promise<number> {
    const db = await getDB();
    const sessions = await db.getAll('readingSessions');
    if (sessions.length === 0) return 0;

    const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
    let streak = 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    for (let i = 0; i < uniqueDates.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split('T')[0];

        if (uniqueDates[i] === expectedStr || (i === 0 && uniqueDates[0] === todayStr)) {
            streak++;
        } else if (i === 0) {
            // Check if yesterday
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (uniqueDates[0] === yesterday.toISOString().split('T')[0]) {
                streak++;
            } else {
                break;
            }
        } else {
            break;
        }
    }
    return streak;
}

/* ============================================
   Delete All Book Data
   ============================================ */
export async function deleteBookData(fileHash: string): Promise<void> {
    const db = await getDB();
    await db.delete('parsedBooks', fileHash);
    await db.delete('readingProgress', fileHash);

    const bookmarks = await db.getAllFromIndex('bookmarks', 'by-book', fileHash);
    for (const bm of bookmarks) { if (bm.id) await db.delete('bookmarks', bm.id); }

    const highlights = await db.getAllFromIndex('highlights', 'by-book', fileHash);
    for (const hl of highlights) { if (hl.id) await db.delete('highlights', hl.id); }

    const notes = await db.getAllFromIndex('notes', 'by-book', fileHash);
    for (const n of notes) { if (n.id) await db.delete('notes', n.id); }

    const sessions = await db.getAllFromIndex('readingSessions', 'by-book', fileHash);
    for (const s of sessions) { if (s.id) await db.delete('readingSessions', s.id); }
}

/* ============================================
   Vocabulary (unchanged from Phase 1)
   ============================================ */
export async function addVocabWord(word: Omit<VocabWord, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('vocabulary', word as VocabWord);
}

export async function getVocabWords(): Promise<VocabWord[]> {
    const db = await getDB();
    return db.getAll('vocabulary');
}

export async function updateVocabWord(id: number, updates: Partial<VocabWord>): Promise<void> {
    const db = await getDB();
    const word = await db.get('vocabulary', id);
    if (word) {
        await db.put('vocabulary', { ...word, ...updates });
    }
}

export async function deleteVocabWord(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('vocabulary', id);
}

/* ============================================
   File Hash
   ============================================ */
export async function generateFileHash(file: File): Promise<string> {
    const chunkSize = 65536;
    const chunk = file.slice(0, chunkSize);
    const buffer = await chunk.arrayBuffer();
    const combined = new TextEncoder().encode(`${file.name}:${file.size}:${file.lastModified}`);

    const hashBuffer = new Uint8Array(buffer.byteLength + combined.byteLength);
    hashBuffer.set(new Uint8Array(buffer), 0);
    hashBuffer.set(combined, buffer.byteLength);

    const digest = await crypto.subtle.digest('SHA-256', hashBuffer);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
