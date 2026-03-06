'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { extractContextSentence } from '@/lib/dictionary';
import { getHighlightBgColor } from '@/components/HighlightPopup';
import type { ContentBlock } from '@/lib/textFormatter';

export default function ReaderView({ onTranslate }: { onTranslate?: (text: string, x: number, y: number) => void }) {
    const {
        pages, currentPage, totalPages,
        fontFamily, fontSize, lineHeight, twoColumn, continuousScroll,
        nextPage, prevPage, setCurrentPage,
        fileName, fileHash,
        showDictionary, showHighlightPopup,
        highlights,
        structuredPages,
    } = useReaderStore();

    const contentRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Apply highlight marks to a text string
    const applyHighlights = (text: string, pageNum: number): React.ReactNode => {
        const hlsForPage = highlights.filter((h) => h.pageNumber === pageNum);
        if (hlsForPage.length === 0) return text;

        const parts: React.ReactNode[] = [];
        let remaining = text;
        let keyIdx = 0;

        for (const hl of hlsForPage) {
            const hlIdx = remaining.indexOf(hl.text);
            if (hlIdx >= 0) {
                if (hlIdx > 0) {
                    parts.push(<span key={keyIdx++}>{remaining.slice(0, hlIdx)}</span>);
                }
                parts.push(
                    <mark key={keyIdx++} style={{ backgroundColor: getHighlightBgColor(hl.color), borderRadius: '2px', padding: '0 1px' }}>
                        {hl.text}
                    </mark>
                );
                remaining = remaining.slice(hlIdx + hl.text.length);
            }
        }
        if (remaining) parts.push(<span key={keyIdx++}>{remaining}</span>);
        return parts.length > 0 ? <>{parts}</> : text;
    };

    // Render structured content blocks (book-quality)
    const renderStructuredContent = (blocks: ContentBlock[], pageNum: number) => {
        return blocks.map((block, idx) => {
            switch (block.type) {
                case 'heading':
                    if (block.level === 1) {
                        return (
                            <h2 key={idx} style={{
                                fontFamily,
                                fontSize: `${fontSize * 1.5}px`,
                                fontWeight: 700,
                                lineHeight: 1.3,
                                marginTop: idx === 0 ? '0.5em' : '2em',
                                marginBottom: '0.8em',
                                color: 'var(--ag-text)',
                                letterSpacing: '-0.01em',
                                textAlign: 'left',
                            }}>
                                {applyHighlights(block.text, pageNum)}
                            </h2>
                        );
                    }
                    if (block.level === 2) {
                        return (
                            <h3 key={idx} style={{
                                fontFamily,
                                fontSize: `${fontSize * 1.25}px`,
                                fontWeight: 600,
                                lineHeight: 1.3,
                                marginTop: idx === 0 ? '0.5em' : '1.5em',
                                marginBottom: '0.6em',
                                color: 'var(--ag-text)',
                                textAlign: 'left',
                            }}>
                                {applyHighlights(block.text, pageNum)}
                            </h3>
                        );
                    }
                    return (
                        <h4 key={idx} style={{
                            fontFamily,
                            fontSize: `${fontSize * 1.1}px`,
                            fontWeight: 600,
                            lineHeight: 1.4,
                            marginTop: '1.2em',
                            marginBottom: '0.5em',
                            color: 'var(--ag-text)',
                            textAlign: 'left',
                        }}>
                            {applyHighlights(block.text, pageNum)}
                        </h4>
                    );

                case 'paragraph':
                    return (
                        <p key={idx} style={{
                            textIndent: idx > 0 ? '1.5em' : '0',
                            textAlign: 'justify',
                            hyphens: 'auto',
                            WebkitHyphens: 'auto',
                            marginBottom: '0.4em',
                            lineHeight,
                        } as React.CSSProperties}>
                            {applyHighlights(block.text, pageNum)}
                        </p>
                    );

                case 'quote':
                    return (
                        <p key={idx} style={{
                            textIndent: '1.5em',
                            textAlign: 'justify',
                            hyphens: 'auto',
                            WebkitHyphens: 'auto',
                            marginBottom: '0.4em',
                            lineHeight,
                            fontStyle: 'italic',
                        } as React.CSSProperties}>
                            {applyHighlights(block.text, pageNum)}
                        </p>
                    );

                case 'separator':
                    return (
                        <div key={idx} style={{
                            textAlign: 'center',
                            margin: '1.5em 0',
                            color: 'var(--ag-text-muted)',
                            fontSize: `${fontSize * 0.9}px`,
                            letterSpacing: '0.3em',
                        }}>
                            ⁂
                        </div>
                    );

                default:
                    return null;
            }
        });
    };

    // Fallback: render raw text paragraphs (no structured data)
    const renderRawContent = (pageText: string, pageNum: number) => {
        const paragraphs = pageText.split(/\n\n+/).filter((p) => p.trim());
        return paragraphs.map((para, idx) => (
            <p key={idx} style={{
                textIndent: idx > 0 ? '1.5em' : '0',
                textAlign: 'justify',
                hyphens: 'auto',
                WebkitHyphens: 'auto',
                marginBottom: '0.4em',
                lineHeight,
            } as React.CSSProperties}>
                {applyHighlights(para, pageNum)}
            </p>
        ));
    };

    // Decide which renderer to use
    const renderPageContent = (pageText: string, pageNum: number) => {
        const blocks = structuredPages[pageNum - 1];
        if (blocks && blocks.length > 0) {
            return renderStructuredContent(blocks, pageNum);
        }
        return renderRawContent(pageText, pageNum);
    };

    // Text selection handler — shows highlight popup
    const handleMouseUp = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || !selection.toString().trim()) return;

        const text = selection.toString().trim();
        if (text.length < 2) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // If single word, trigger dictionary; if multi-word, trigger highlight
        if (!text.includes(' ') && text.length <= 30) {
            return; // Let double-click handle dictionary
        }

        // Show highlight popup for multi-word selection
        showHighlightPopup({
            text,
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8,
            startOffset: range.startOffset,
            endOffset: range.endOffset,
        });
    }, [showHighlightPopup]);

    // Double-click for dictionary
    const handleDoubleClick = useCallback(async () => {
        const selection = window.getSelection();
        if (!selection || !selection.toString().trim()) return;

        const word = selection.toString().trim();
        if (word.includes(' ') || word.length > 30) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const pageText = pages[currentPage - 1] || '';
        const ctx = extractContextSentence(pageText, word);

        showDictionary({
            word,
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8,
            contextSentence: ctx,
            pageNumber: currentPage,
        });
    }, [pages, currentPage, showDictionary]);

    // Long-press for mobile
    const handleTouchStart = useCallback(() => {
        longPressTimer.current = setTimeout(() => {
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

    // Edge-click navigation (only in paginated mode)
    const handleContentClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (continuousScroll) return;
            if (!contentRef.current) return;
            const rect = contentRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;

            const selection = window.getSelection();
            if (selection && selection.toString().trim()) return;

            if (clickX < width * 0.15) prevPage();
            else if (clickX > width * 0.85) nextPage();
        },
        [prevPage, nextPage, continuousScroll]
    );

    // Scroll to top on page change (paginated mode)
    useEffect(() => {
        if (!continuousScroll) {
            contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage, continuousScroll]);

    if (pages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--ag-text-muted)' }}>
                <p>No content loaded</p>
            </div>
        );
    }

    // Continuous scroll mode
    if (continuousScroll) {
        return (
            <div
                ref={contentRef}
                className="flex-1 overflow-y-auto"
                style={{ backgroundColor: 'var(--ag-bg)' }}
                onMouseUp={handleMouseUp}
                onDoubleClick={handleDoubleClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className={`reading-content mx-auto px-6 sm:px-10 py-8 sm:py-12 ${twoColumn ? 'two-column' : ''}`}
                    style={{
                        maxWidth: twoColumn ? '100%' : '720px',
                        fontFamily, fontSize: `${fontSize}px`, lineHeight,
                        color: 'var(--ag-text)',
                    }}
                >
                    {pages.map((pageText, idx) => (
                        <div key={idx} id={`page-${idx + 1}`} className="mb-8">
                            <div className="mb-4 pb-2 border-b" style={{ borderColor: 'var(--ag-border)' }}>
                                <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: 'var(--ag-text-muted)', fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>
                                    Page {idx + 1}
                                </p>
                            </div>
                            {renderPageContent(pageText, idx + 1)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Paginated mode (default)
    const pageText = pages[currentPage - 1] || '';

    return (
        <div
            ref={contentRef}
            className="flex-1 overflow-y-auto relative"
            style={{ backgroundColor: 'var(--ag-bg)' }}
            onClick={handleContentClick}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Navigation hint zones */}
            <div className="absolute left-0 top-0 bottom-0 w-[15%] cursor-w-resize opacity-0 hover:opacity-100 z-10 flex items-center justify-center">
                {currentPage > 1 && (
                    <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--ag-surface)', opacity: 0.6 }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--ag-text-muted)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-[15%] cursor-e-resize opacity-0 hover:opacity-100 z-10 flex items-center justify-center">
                {currentPage < totalPages && (
                    <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--ag-surface)', opacity: 0.6 }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--ag-text-muted)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content */}
            <div
                className={`reading-content mx-auto px-6 sm:px-10 py-8 sm:py-12 ${twoColumn ? 'two-column' : ''}`}
                style={{
                    maxWidth: twoColumn ? '100%' : '720px',
                    fontFamily, fontSize: `${fontSize}px`, lineHeight,
                    color: 'var(--ag-text)',
                }}
            >
                <div className="mb-6 pb-4 border-b" style={{ borderColor: 'var(--ag-border)' }}>
                    <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: 'var(--ag-text-muted)', fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>
                        {fileName} — Page {currentPage}
                    </p>
                </div>

                {renderPageContent(pageText, currentPage)}

                {pageText.trim().length === 0 && (
                    <p className="text-center py-20" style={{ color: 'var(--ag-text-muted)', fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>
                        This page appears to be empty
                    </p>
                )}

                <div className="mt-12 pt-4 border-t text-center" style={{ borderColor: 'var(--ag-border)' }}>
                    <p className="text-[10px]" style={{ color: 'var(--ag-text-muted)', fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>
                        {currentPage} of {totalPages}
                    </p>
                </div>
            </div>
        </div>
    );
}
