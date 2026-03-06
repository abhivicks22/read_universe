'use client';

import { useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useReaderStore } from '@/stores/readerStore';
import {
    getParsedBook, getProgress, getPreferences, saveProgress,
    getBookmarksByBook, getHighlightsByBook, getNotesByBook,
    addReadingSession,
} from '@/lib/storage';
import { applyTheme } from '@/lib/themes';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import ReaderView from '@/components/ReaderView';
import SettingsPanel from '@/components/SettingsPanel';
import ProgressBar from '@/components/ProgressBar';
import DictionaryPopup from '@/components/DictionaryPopup';
import FlashcardMode from '@/components/FlashcardMode';
import HighlightPopup from '@/components/HighlightPopup';
import SearchOverlay from '@/components/SearchOverlay';
import NoteEditor from '@/components/NoteEditor';
import ReadingRuler from '@/components/ReadingRuler';

function ReaderContent() {
    const searchParams = useSearchParams();
    const bookId = searchParams.get('id');

    const {
        setPages, setCurrentPage, setTheme, setFontFamily, setFontSize,
        setLineHeight, setTwoColumn, setContinuousScroll, setReadingRuler,
        setLoading, loading, currentPage, totalPages, fileHash, fileName,
        nextPage, prevPage, closeAllPanels, flashcardOpen, toggleFlashcard,
        setBookmarks, setHighlights, setNotes,
        startSession, pagesReadThisSession, getSessionDuration,
        toggleSearch,
    } = useReaderStore();

    // Load book data from IndexedDB
    useEffect(() => {
        if (!bookId) return;

        const loadBook = async () => {
            setLoading(true);

            try {
                // Load preferences
                const prefs = await getPreferences();
                setTheme(prefs.theme);
                setFontFamily(prefs.fontFamily);
                setFontSize(prefs.fontSize);
                setLineHeight(prefs.lineHeight);
                setTwoColumn(prefs.twoColumn);
                setContinuousScroll(prefs.continuousScroll || false);
                setReadingRuler(prefs.readingRuler || false);
                applyTheme(prefs.theme);

                // Load parsed book
                const book = await getParsedBook(bookId);
                if (!book) {
                    window.location.href = '/';
                    return;
                }

                setPages(book.pages, book.fileName, book.fileHash);

                // Restore reading progress
                const progress = await getProgress(bookId);
                if (progress && progress.currentPage > 0) {
                    setCurrentPage(progress.currentPage);
                }

                // Load annotations
                const [bookmarks, highlights, notes] = await Promise.all([
                    getBookmarksByBook(bookId),
                    getHighlightsByBook(bookId),
                    getNotesByBook(bookId),
                ]);
                setBookmarks(bookmarks);
                setHighlights(highlights);
                setNotes(notes);

                // Start reading session tracking
                startSession();
            } catch (error) {
                console.error('Failed to load book:', error);
                window.location.href = '/';
            } finally {
                setLoading(false);
            }
        };

        loadBook();
    }, [bookId, setPages, setCurrentPage, setTheme, setFontFamily, setFontSize, setLineHeight, setTwoColumn, setContinuousScroll, setReadingRuler, setLoading, setBookmarks, setHighlights, setNotes, startSession]);

    // Save progress when page changes
    useEffect(() => {
        if (!fileHash || !totalPages || !currentPage) return;

        const timeout = setTimeout(() => {
            saveProgress({
                fileHash,
                fileName,
                currentPage,
                totalPages,
                percent: Math.round((currentPage / totalPages) * 100),
                lastReadAt: new Date().toISOString(),
                wordCount: 0,
            });
        }, 500);

        return () => clearTimeout(timeout);
    }, [currentPage, fileHash, fileName, totalPages]);

    // Save reading session on unmount
    useEffect(() => {
        return () => {
            const duration = getSessionDuration();
            const pagesRead = pagesReadThisSession.size;
            if (fileHash && duration > 5000 && pagesRead > 0) {
                addReadingSession({
                    fileHash,
                    date: new Date().toISOString().split('T')[0],
                    pagesRead,
                    timeSpentMs: duration,
                });
            }
        };
    }, [fileHash, getSessionDuration, pagesReadThisSession]);

    // Keyboard shortcuts
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case 'ArrowRight': e.preventDefault(); nextPage(); break;
                case ' ': e.preventDefault(); nextPage(); break;
                case 'ArrowLeft': e.preventDefault(); prevPage(); break;
                case 'Escape': closeAllPanels(); break;
                case 'f':
                    if (e.ctrlKey || e.metaKey) { e.preventDefault(); toggleSearch(); }
                    break;
            }
        },
        [nextPage, prevPage, closeAllPanels, toggleSearch]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--ag-bg)' }}>
                <div className="text-center">
                    <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto"
                        style={{ borderColor: 'var(--ag-border)', borderTopColor: 'var(--ag-accent)' }} />
                    <p className="text-sm mt-4" style={{ color: 'var(--ag-text-muted)' }}>Loading your book...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--ag-bg)' }}>
            <TopBar />
            <div className="flex-1 flex overflow-hidden relative">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <ReadingRuler />
                    <ReaderView />
                    <ProgressBar />
                </div>
            </div>
            <SettingsPanel />
            <DictionaryPopup />
            <HighlightPopup />
            <SearchOverlay />
            <NoteEditor />
            {flashcardOpen && <FlashcardMode isOverlay onClose={toggleFlashcard} />}
        </div>
    );
}

export default function ReaderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--ag-bg)' }}>
                <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--ag-border)', borderTopColor: 'var(--ag-accent)' }} />
            </div>
        }>
            <ReaderContent />
        </Suspense>
    );
}
