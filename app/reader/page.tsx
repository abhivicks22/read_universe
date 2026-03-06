'use client';

import { useEffect, useCallback, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useReaderStore } from '@/stores/readerStore';
import {
    getParsedBook, getProgress, getPreferences, saveProgress,
    getBookmarksByBook, getHighlightsByBook, getNotesByBook,
    addReadingSession,
} from '@/lib/storage';
import { exportAsMarkdown, downloadMarkdown } from '@/lib/exportNotes';
import { applyTheme } from '@/lib/themes';
import { formatRawText } from '@/lib/textFormatter';
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
import EntityPanel from '@/components/EntityPanel';
import SummaryPanel from '@/components/SummaryPanel';
import WikiPopup from '@/components/WikiPopup';
import TranslatePopup from '@/components/TranslatePopup';

function ReaderContent() {
    const searchParams = useSearchParams();
    const bookId = searchParams.get('id');

    const {
        setPages, setCurrentPage, setTheme, setFontFamily, setFontSize,
        setLineHeight, setTwoColumn, setContinuousScroll, setReadingRuler,
        setLoading, loading, currentPage, totalPages, fileHash, fileName,
        nextPage, prevPage, closeAllPanels, flashcardOpen, toggleFlashcard,
        setBookmarks, setHighlights, setNotes,
        bookmarks, highlights, notes,
        startSession, pagesReadThisSession, getSessionDuration,
        toggleSearch, highlightSelection,
    } = useReaderStore();

    // Phase 3 panel states
    const [entityPanelOpen, setEntityPanelOpen] = useState(false);
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [wikiEntity, setWikiEntity] = useState<string | null>(null);
    const [translateState, setTranslateState] = useState<{ text: string; x: number; y: number } | null>(null);

    // Load book data
    useEffect(() => {
        if (!bookId) return;
        const loadBook = async () => {
            setLoading(true);
            try {
                const prefs = await getPreferences();
                setTheme(prefs.theme);
                setFontFamily(prefs.fontFamily);
                setFontSize(prefs.fontSize);
                setLineHeight(prefs.lineHeight);
                setTwoColumn(prefs.twoColumn);
                setContinuousScroll(prefs.continuousScroll || false);
                setReadingRuler(prefs.readingRuler || false);
                applyTheme(prefs.theme);

                const book = await getParsedBook(bookId);
                if (!book) { window.location.href = '/'; return; }

                // Load or generate structured content blocks
                let structured = book.structuredPages;
                if (!structured || structured.length === 0) {
                    // Fallback: generate from raw text for existing books
                    structured = book.pages.map((p: string) => formatRawText(p));
                }

                setPages(book.pages, book.fileName, book.fileHash, structured);

                const progress = await getProgress(bookId);
                if (progress && progress.currentPage > 0) setCurrentPage(progress.currentPage);

                const [bms, hls, nts] = await Promise.all([
                    getBookmarksByBook(bookId),
                    getHighlightsByBook(bookId),
                    getNotesByBook(bookId),
                ]);
                setBookmarks(bms);
                setHighlights(hls);
                setNotes(nts);
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

    // Save progress
    useEffect(() => {
        if (!fileHash || !totalPages || !currentPage) return;
        const timeout = setTimeout(() => {
            saveProgress({ fileHash, fileName, currentPage, totalPages, percent: Math.round((currentPage / totalPages) * 100), lastReadAt: new Date().toISOString(), wordCount: 0 });
        }, 500);
        return () => clearTimeout(timeout);
    }, [currentPage, fileHash, fileName, totalPages]);

    // Save session on unmount
    useEffect(() => {
        return () => {
            const duration = getSessionDuration();
            const pagesRead = pagesReadThisSession.size;
            if (fileHash && duration > 5000 && pagesRead > 0) {
                addReadingSession({ fileHash, date: new Date().toISOString().split('T')[0], pagesRead, timeSpentMs: duration });
            }
        };
    }, [fileHash, getSessionDuration, pagesReadThisSession]);

    // Export handler
    const handleExport = useCallback(() => {
        const md = exportAsMarkdown(fileName, bookmarks, highlights, notes);
        downloadMarkdown(md, `${fileName.replace('.pdf', '')}_notes.md`);
    }, [fileName, bookmarks, highlights, notes]);

    // Keyboard shortcuts
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            switch (e.key) {
                case 'ArrowRight': e.preventDefault(); nextPage(); break;
                case ' ': e.preventDefault(); nextPage(); break;
                case 'ArrowLeft': e.preventDefault(); prevPage(); break;
                case 'Escape': closeAllPanels(); setEntityPanelOpen(false); setSummaryOpen(false); setWikiEntity(null); setTranslateState(null); break;
                case 'f': if (e.ctrlKey || e.metaKey) { e.preventDefault(); toggleSearch(); } break;
            }
        },
        [nextPage, prevPage, closeAllPanels, toggleSearch]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Handle translate from highlight popup
    const handleTranslate = useCallback((text: string, x: number, y: number) => {
        setTranslateState({ text, x, y });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--ag-bg)' }}>
                <div className="text-center">
                    <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--ag-border)', borderTopColor: 'var(--ag-accent)' }} />
                    <p className="text-sm mt-4" style={{ color: 'var(--ag-text-muted)' }}>Loading your book...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--ag-bg)' }}>
            <TopBar
                onEntityPanel={() => setEntityPanelOpen(true)}
                onSummary={() => setSummaryOpen(true)}
                onExport={handleExport}
            />
            <div className="flex-1 flex overflow-hidden relative">
                <Sidebar onEntityClick={(e) => setWikiEntity(e)} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <ReadingRuler />
                    <ReaderView onTranslate={handleTranslate} />
                    <ProgressBar />
                </div>
            </div>
            <SettingsPanel />
            <DictionaryPopup />
            <HighlightPopup onTranslate={handleTranslate} />
            <SearchOverlay />
            <NoteEditor />
            {flashcardOpen && <FlashcardMode isOverlay onClose={toggleFlashcard} />}
            <EntityPanel isOpen={entityPanelOpen} onClose={() => setEntityPanelOpen(false)} onEntityClick={(e) => { setWikiEntity(e); }} />
            {summaryOpen && <SummaryPanel isOpen={summaryOpen} onClose={() => setSummaryOpen(false)} />}
            {wikiEntity && <WikiPopup entity={wikiEntity} onClose={() => setWikiEntity(null)} />}
            {translateState && <TranslatePopup text={translateState.text} x={translateState.x} y={translateState.y} onClose={() => setTranslateState(null)} />}
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
