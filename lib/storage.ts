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
}

export interface ReadingProgress {
    fileHash: string;
    fileName: string;
    currentPage: number;
    totalPages: number;
    percent: number;
    lastReadAt: string; // ISO timestamp
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

interface AntiGravityDB extends DBSchema {
    preferences: {
        key: string;
        value: Preferences;
    };
    readingProgress: {
        key: string; // fileHash
        value: ReadingProgress;
    };
    vocabulary: {
        key: number;
        value: VocabWord;
        indexes: {
            'by-word': string;
            'by-book': string;
            'by-mastered': number; // 0 or 1
        };
    };
    parsedBooks: {
        key: string; // fileHash
        value: {
            fileHash: string;
            fileName: string;
            pages: string[];
            totalPages: number;
            wordCount: number;
            parsedAt: string;
        };
    };
}

/* ============================================
   Database Init
   ============================================ */
let dbPromise: Promise<IDBPDatabase<AntiGravityDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AntiGravityDB>> {
    if (!dbPromise) {
        dbPromise = openDB<AntiGravityDB>('antigravity', 2, {
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
};

export async function getPreferences(): Promise<Preferences> {
    try {
        const db = await getDB();
        const prefs = await db.get('preferences', PREF_KEY);
        return prefs || defaultPreferences;
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

/* ============================================
   Parsed Books (for passing data between routes)
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

/* ============================================
   Vocabulary
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
   File Hash (fast — first 64KB + metadata)
   ============================================ */
export async function generateFileHash(file: File): Promise<string> {
    const chunkSize = 65536; // 64KB
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
