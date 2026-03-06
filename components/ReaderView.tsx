'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { lookupWord, extractContextSentence } from '@/lib/dictionary';

export default function ReaderView() {
    const {
        pages,
        currentPage,
        totalPages,
        fontFamily,
        fontSize,
        lineHeight,
        twoColumn,
        nextPage,
        prevPage,
        fileName,
        showDictionary,
    } = useReaderStore();

    const contentRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const pageText = pages[currentPage - 1] || '';

    // Format text into paragraphs
    const paragraphs = pageText.split(/\n\n+/).filter((p) => p.trim());

    // Double-click handler for dictionary
    const handleDoubleClick = useCallback(async () => {
        const selection = window.getSelection();
        if (!selection || !selection.toString().trim()) return;

        const word = selection.toString().trim();
        if (word.includes(' ') || word.length > 30) return; // Skip multi-word selections

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Show dictionary popup
        const result = await lookupWord(word);
        const ctx = extractContextSentence(pageText, word);

        showDictionary({
            word: result.word,
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8,
            contextSentence: ctx,
            pageNumber: currentPage,
        });
    }, [pageText, currentPage, showDictionary]);

    // Long-press handler for mobile
    const handleTouchStart = useCallback(() => {
        longPressTimer.current = setTimeout(() => {
            // After long press, check selection
            const selection = window.getSelection();
            if (selection && selection.toString().trim()) {
                handleDoubleClick();
            }
        }, 600);
    }, [handleDoubleClick]);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    // Click on edges for page navigation
    const handleContentClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!contentRef.current) return;
            const rect = contentRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;

            // Don't navigate if text is selected
            const selection = window.getSelection();
            if (selection && selection.toString().trim()) return;

            if (clickX < width * 0.15) {
                prevPage();
            } else if (clickX > width * 0.85) {
                nextPage();
            }
        },
        [prevPage, nextPage]
    );

    // Scroll to top on page change
    useEffect(() => {
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    if (pages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--ag-text-muted)' }}>
                <p>No content loaded</p>
            </div>
        );
    }

    return (
        <div
            ref={contentRef}
            className="flex-1 overflow-y-auto relative"
            style={{ backgroundColor: 'var(--ag-bg)' }}
            onClick={handleContentClick}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Navigation hint zones */}
            <div className="absolute left-0 top-0 bottom-0 w-[15%] cursor-w-resize opacity-0 hover:opacity-100 z-10 flex items-center justify-center">
                {currentPage > 1 && (
                    <div
                        className="p-2 rounded-full"
                        style={{ backgroundColor: 'var(--ag-surface)', opacity: 0.6 }}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--ag-text-muted)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-[15%] cursor-e-resize opacity-0 hover:opacity-100 z-10 flex items-center justify-center">
                {currentPage < totalPages && (
                    <div
                        className="p-2 rounded-full"
                        style={{ backgroundColor: 'var(--ag-surface)', opacity: 0.6 }}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--ag-text-muted)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content area */}
            <div
                className={`reading-content mx-auto px-6 sm:px-10 py-8 sm:py-12 ${twoColumn ? 'two-column' : ''}`}
                style={{
                    maxWidth: twoColumn ? '100%' : '720px',
                    fontFamily: fontFamily,
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                    ['--reading-font-family' as string]: fontFamily,
                    ['--reading-font-size' as string]: `${fontSize}px`,
                    ['--reading-line-height' as string]: lineHeight,
                    color: 'var(--ag-text)',
                }}
            >
                {/* Page header */}
                <div className="mb-6 pb-4 border-b" style={{ borderColor: 'var(--ag-border)' }}>
                    <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: 'var(--ag-text-muted)', fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>
                        {fileName} — Page {currentPage}
                    </p>
                </div>

                {/* Paragraphs */}
                {paragraphs.map((para, idx) => (
                    <p key={idx} className="mb-4 whitespace-pre-wrap">
                        {para}
                    </p>
                ))}

                {paragraphs.length === 0 && (
                    <p className="text-center py-20" style={{ color: 'var(--ag-text-muted)', fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>
                        This page appears to be empty
                    </p>
                )}

                {/* Page footer */}
                <div className="mt-12 pt-4 border-t text-center" style={{ borderColor: 'var(--ag-border)' }}>
                    <p className="text-[10px]" style={{ color: 'var(--ag-text-muted)', fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>
                        {currentPage} of {totalPages}
                    </p>
                </div>
            </div>
        </div>
    );
}
