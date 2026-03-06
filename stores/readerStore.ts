import { create } from 'zustand';
import type { ThemeId } from '@/lib/themes';

interface DictionaryState {
    word: string;
    x: number;
    y: number;
    contextSentence: string;
    pageNumber: number;
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

    // UI state
    settingsOpen: boolean;
    sidebarOpen: boolean;
    loading: boolean;
    parsingProgress: { current: number; total: number } | null;

    // Dictionary
    dictionaryState: DictionaryState | null;

    // Flashcard overlay in reader
    flashcardOpen: boolean;

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
    toggleSettings: () => void;
    toggleSidebar: () => void;
    setLoading: (loading: boolean) => void;
    setParsingProgress: (progress: { current: number; total: number } | null) => void;
    showDictionary: (state: DictionaryState) => void;
    hideDictionary: () => void;
    toggleFlashcard: () => void;
    closeAllPanels: () => void;
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

    settingsOpen: false,
    sidebarOpen: false,
    loading: false,
    parsingProgress: null,

    dictionaryState: null,
    flashcardOpen: false,

    // Actions
    setPages: (pages, fileName, fileHash) => {
        const wordCount = pages.reduce((acc, p) => acc + p.split(/\s+/).filter(Boolean).length, 0);
        set({ pages, fileName, fileHash, totalPages: pages.length, wordCount, currentPage: 1 });
    },

    setCurrentPage: (page) => {
        const { totalPages } = get();
        if (page >= 1 && page <= totalPages) {
            set({ currentPage: page });
        }
    },

    nextPage: () => {
        const { currentPage, totalPages } = get();
        if (currentPage < totalPages) {
            set({ currentPage: currentPage + 1 });
        }
    },

    prevPage: () => {
        const { currentPage } = get();
        if (currentPage > 1) {
            set({ currentPage: currentPage - 1 });
        }
    },

    setTheme: (theme) => set({ theme }),
    setFontFamily: (fontFamily) => set({ fontFamily }),
    setFontSize: (fontSize) => set({ fontSize }),
    setLineHeight: (lineHeight) => set({ lineHeight }),
    setTwoColumn: (twoColumn) => set({ twoColumn }),

    toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen, sidebarOpen: false })),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen, settingsOpen: false })),
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
        }),
}));
