'use client';

import { useState, useRef, useEffect } from 'react';
import { useReaderStore } from '@/stores/readerStore';

export default function SearchOverlay() {
    const {
        searchOpen,
        toggleSearch,
        searchQuery,
        searchResults,
        performSearch,
        setCurrentPage,
        setSidebarTab,
    } = useReaderStore();

    const [localQuery, setLocalQuery] = useState(searchQuery);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (searchOpen) {
            inputRef.current?.focus();
            setLocalQuery(searchQuery);
        }
    }, [searchOpen, searchQuery]);

    const handleSearch = (q: string) => {
        setLocalQuery(q);
        performSearch(q);
    };

    const handleResultClick = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        toggleSearch();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') toggleSearch();
    };

    if (!searchOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-40" style={{ backgroundColor: 'var(--ag-overlay)' }} onClick={toggleSearch} />
            <div
                className="fixed top-0 left-0 right-0 z-50 animate-fade-in"
                style={{ backgroundColor: 'var(--ag-surface)' }}
            >
                <div className="max-w-2xl mx-auto p-4">
                    {/* Search input */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--ag-text-muted)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search in document..."
                                value={localQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                                style={{ backgroundColor: 'var(--ag-card)', color: 'var(--ag-text)', border: '1px solid var(--ag-border)' }}
                            />
                        </div>
                        <button onClick={toggleSearch} className="p-2 rounded-lg" style={{ color: 'var(--ag-text-muted)' }}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Results count */}
                    {localQuery && (
                        <p className="text-xs mt-2 px-1" style={{ color: 'var(--ag-text-muted)' }}>
                            {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
                            {searchResults.length > 0 && (
                                <button
                                    onClick={() => { setSidebarTab('search'); toggleSearch(); }}
                                    className="ml-2 underline"
                                    style={{ color: 'var(--ag-accent)' }}
                                >
                                    View in sidebar →
                                </button>
                            )}
                        </p>
                    )}

                    {/* Results list (top 8) */}
                    {searchResults.length > 0 && (
                        <div className="mt-3 max-h-64 overflow-y-auto space-y-1.5">
                            {searchResults.slice(0, 8).map((r, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleResultClick(r.pageNumber)}
                                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all hover:opacity-80"
                                    style={{ backgroundColor: 'var(--ag-card)', color: 'var(--ag-text)' }}
                                >
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mr-2"
                                        style={{ backgroundColor: 'var(--ag-accent-soft)', color: 'var(--ag-accent)' }}>
                                        p.{r.pageNumber}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--ag-text-muted)' }}>{r.snippet}</span>
                                </button>
                            ))}
                            {searchResults.length > 8 && (
                                <p className="text-center text-xs py-2" style={{ color: 'var(--ag-text-muted)' }}>
                                    +{searchResults.length - 8} more results
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
