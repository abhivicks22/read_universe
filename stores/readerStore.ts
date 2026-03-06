import { create } from 'zustand';
import type { ThemeId } from '@/lib/themes';
import type { Bookmark, Highlight, Note, HighlightColor } from '@/lib/storage';

interface DictionaryState {
    word: string;
    x: number;
    y: number;
    contextSentence: string;
    pageNumber: number;
}

interface SearchResult {
    pageNumber: number;
    snippet: string;
    matchIndex: number;
}

export type SidebarTab = 'pages' | 'bookmarks' | 'highlights' | 'notes' | 'search';

interface HighlightSelection {
    text: string;
    x: number;
    y: number;
    startOffset: number;
    endOffset: number;
}

interface ReaderState {
    // Book data
    pages: string[];
    currentPage: number;
    totalPages: number;
    fileName: string;
    fileHash: string;
    wordCount: number;

    // Reading settings
    theme: ThemeId;
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    twoColumn: boolean;
    continuousScroll: boolean;
    readingRuler: boolean;

    // UI state
    settingsOpen: boolean;
    sidebarOpen: boolean;
    loading: boolean;
    parsingProgress: { current: number; total: number } | null;
    sidebarTab: SidebarTab;

    // Dictionary
    dictionaryState: DictionaryState | null;

    // Flashcard overlay
    flashcardOpen: boolean;

    // Annotations
    bookmarks: Bookmark[];
    highlights: Highlight[];
    notes: Note[];
    highlightSelection: HighlightSelection | null;
    activeNotePageEditing: number | null; // page number being edited

    // Search
    searchQuery: string;
    searchResults: SearchResult[];
    searchOpen: boolean;

    // Stats
    sessionStartTime: number | null;
    pagesReadThisSession: Set<number>;

    // Actions
    setPages: (pages: string[], fileName: string, fileHash: string) => void;
    setCurrentPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    setTheme: (theme: ThemeId) => void;
    setFontFamily: (font: string) => void;
    setFontSize: (size: number) => void;
    setLineHeight: (height: number) => void;
    setTwoColumn: (enabled: boolean) => void;
    setContinuousScroll: (enabled: boolean) => void;
    setReadingRuler: (enabled: boolean) => void;
    toggleSettings: () => void;
    toggleSidebar: () => void;
    setSidebarTab: (tab: SidebarTab) => void;
    setLoading: (loading: boolean) => void;
    setParsingProgress: (progress: { current: number; total: number } | null) => void;
    showDictionary: (state: DictionaryState) => void;
    hideDictionary: () => void;
    toggleFlashcard: () => void;
    closeAllPanels: () => void;

    // Annotation actions
    setBookmarks: (bookmarks: Bookmark[]) => void;
    addBookmarkToState: (bm: Bookmark) => void;
    removeBookmarkFromState: (id: number) => void;
    setHighlights: (highlights: Highlight[]) => void;
    addHighlightToState: (hl: Highlight) => void;
    removeHighlightFromState: (id: number) => void;
    showHighlightPopup: (sel: HighlightSelection) => void;
    hideHighlightPopup: () => void;
    setNotes: (notes: Note[]) => void;
    addNoteToState: (note: Note) => void;
    updateNoteInState: (id: number, content: string) => void;
    removeNoteFromState: (id: number) => void;
    setActiveNotePageEditing: (page: number | null) => void;

    // Search actions
    setSearchQuery: (query: string) => void;
    setSearchResults: (results: SearchResult[]) => void;
    toggleSearch: () => void;
    performSearch: (query: string) => void;

    // Stats actions
    startSession: () => void;
    recordPageRead: (page: number) => void;
    getSessionDuration: () => number;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
    // Initial state
    pages: [],
    currentPage: 1,
    totalPages: 0,
    fileName: '',
    fileHash: '',
    wordCount: 0,

    theme: 'light',
    fontFamily: "'Literata', serif",
    fontSize: 18,
    lineHeight: 1.8,
    twoColumn: false,
    continuousScroll: false,
    readingRuler: false,

    settingsOpen: false,
    sidebarOpen: false,
    loading: false,
    parsingProgress: null,
    sidebarTab: 'pages',

    dictionaryState: null,
    flashcardOpen: false,

    bookmarks: [],
    highlights: [],
    notes: [],
    highlightSelection: null,
    activeNotePageEditing: null,

    searchQuery: '',
    searchResults: [],
    searchOpen: false,

    sessionStartTime: null,
    pagesReadThisSession: new Set<number>(),

    // Page actions
    setPages: (pages, fileName, fileHash) => {
        const wordCount = pages.reduce((acc, p) => acc + p.split(/\s+/).filter(Boolean).length, 0);
        set({ pages, fileName, fileHash, totalPages: pages.length, wordCount, currentPage: 1 });
    },

    setCurrentPage: (page) => {
        const { totalPages } = get();
        if (page >= 1 && page <= totalPages) {
            set({ currentPage: page });
            get().recordPageRead(page);
        }
    },

    nextPage: () => {
        const { currentPage, totalPages } = get();
        if (currentPage < totalPages) {
            set({ currentPage: currentPage + 1 });
            get().recordPageRead(currentPage + 1);
        }
    },

    prevPage: () => {
        const { currentPage } = get();
        if (currentPage > 1) {
            set({ currentPage: currentPage - 1 });
            get().recordPageRead(currentPage - 1);
        }
    },

    // Settings
    setTheme: (theme) => set({ theme }),
    setFontFamily: (fontFamily) => set({ fontFamily }),
    setFontSize: (fontSize) => set({ fontSize }),
    setLineHeight: (lineHeight) => set({ lineHeight }),
    setTwoColumn: (twoColumn) => set({ twoColumn }),
    setContinuousScroll: (continuousScroll) => set({ continuousScroll }),
    setReadingRuler: (readingRuler) => set({ readingRuler }),

    // UI toggles
    toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen, sidebarOpen: false, searchOpen: false })),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen, settingsOpen: false, searchOpen: false })),
    setSidebarTab: (sidebarTab) => set({ sidebarTab, sidebarOpen: true, settingsOpen: false }),
    setLoading: (loading) => set({ loading }),
    setParsingProgress: (parsingProgress) => set({ parsingProgress }),

    showDictionary: (state) => set({ dictionaryState: state }),
    hideDictionary: () => set({ dictionaryState: null }),

    toggleFlashcard: () => set((s) => ({ flashcardOpen: !s.flashcardOpen })),

    closeAllPanels: () =>
        set({
            settingsOpen: false,
            sidebarOpen: false,
            dictionaryState: null,
            flashcardOpen: false,
            searchOpen: false,
            highlightSelection: null,
        }),

    // Bookmark actions
    setBookmarks: (bookmarks) => set({ bookmarks }),
    addBookmarkToState: (bm) => set((s) => ({ bookmarks: [...s.bookmarks, bm] })),
    removeBookmarkFromState: (id) => set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),

    // Highlight actions
    setHighlights: (highlights) => set({ highlights }),
    addHighlightToState: (hl) => set((s) => ({ highlights: [...s.highlights, hl] })),
    removeHighlightFromState: (id) => set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) })),
    showHighlightPopup: (sel) => set({ highlightSelection: sel }),
    hideHighlightPopup: () => set({ highlightSelection: null }),

    // Note actions
    setNotes: (notes) => set({ notes }),
    addNoteToState: (note) => set((s) => ({ notes: [...s.notes, note] })),
    updateNoteInState: (id, content) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n)) })),
    removeNoteFromState: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
    setActiveNotePageEditing: (page) => set({ activeNotePageEditing: page }),

    // Search actions
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setSearchResults: (searchResults) => set({ searchResults }),
    toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen, settingsOpen: false })),

    performSearch: (query) => {
        const { pages } = get();
        if (!query.trim()) {
            set({ searchResults: [], searchQuery: query });
            return;
        }
        const lowerQuery = query.toLowerCase();
        const results: SearchResult[] = [];

        for (let i = 0; i < pages.length; i++) {
            const text = pages[i].toLowerCase();
            let idx = text.indexOf(lowerQuery);
            while (idx !== -1) {
                const start = Math.max(0, idx - 40);
                const end = Math.min(text.length, idx + query.length + 40);
                const snippet = pages[i].slice(start, end);
                results.push({
                    pageNumber: i + 1,
                    snippet: (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : ''),
                    matchIndex: idx,
                });
                idx = text.indexOf(lowerQuery, idx + 1);
            }
        }

        set({ searchResults: results, searchQuery: query });
    },

    // Stats actions
    startSession: () => set({ sessionStartTime: Date.now(), pagesReadThisSession: new Set<number>() }),
    recordPageRead: (page) => {
        const { pagesReadThisSession } = get();
        const updated = new Set(pagesReadThisSession);
        updated.add(page);
        set({ pagesReadThisSession: updated });
    },
    getSessionDuration: () => {
        const { sessionStartTime } = get();
        return sessionStartTime ? Date.now() - sessionStartTime : 0;
    },
}));
