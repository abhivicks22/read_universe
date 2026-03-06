'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllParsedBooks, getAllProgress, deleteBookData, getPreferences } from '@/lib/storage';
import { applyTheme } from '@/lib/themes';
import type { ReadingProgress } from '@/lib/storage';

interface LibraryBook {
    fileHash: string;
    fileName: string;
    totalPages: number;
    wordCount: number;
    parsedAt: string;
    progress?: ReadingProgress;
}

export default function LibraryPage() {
    const [books, setBooks] = useState<LibraryBook[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const prefs = await getPreferences();
            applyTheme(prefs.theme);
        };
        init();
    }, []);

    const loadBooks = useCallback(async () => {
        const [parsedBooks, allProgress] = await Promise.all([
            getAllParsedBooks(),
            getAllProgress(),
        ]);

        const progressMap = new Map(allProgress.map((p) => [p.fileHash, p]));

        const library: LibraryBook[] = parsedBooks.map((book) => ({
            ...book,
            progress: progressMap.get(book.fileHash),
        }));

        // Sort by last read (most recent first)
        library.sort((a, b) => {
            const aTime = a.progress?.lastReadAt || a.parsedAt;
            const bTime = b.progress?.lastReadAt || b.parsedAt;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        setBooks(library);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadBooks();
    }, [loadBooks]);

    const handleDelete = async (fileHash: string) => {
        if (!confirm('Delete this book and all its data (bookmarks, highlights, notes)?')) return;
        await deleteBookData(fileHash);
        setBooks((prev) => prev.filter((b) => b.fileHash !== fileHash));
    };

    const filteredBooks = books.filter((b) =>
        b.fileName.toLowerCase().includes(search.toLowerCase())
    );

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    };

    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--ag-bg)' }}>
            {/* Header */}
            <header className="border-b" style={{ backgroundColor: 'var(--ag-surface)', borderColor: 'var(--ag-border)' }}>
                <div className="max-w-5xl mx-auto px-6 py-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <a href="/" className="text-lg hover:opacity-80 transition-opacity">🚀</a>
                            <div>
                                <h1 className="text-xl font-bold" style={{ color: 'var(--ag-text)' }}>Library</h1>
                                <p className="text-xs" style={{ color: 'var(--ag-text-muted)' }}>
                                    {books.length} {books.length === 1 ? 'book' : 'books'}
                                </p>
                            </div>
                        </div>
                        <a
                            href="/"
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                            style={{ backgroundColor: 'var(--ag-accent)', color: 'white' }}
                        >
                            + Upload
                        </a>
                    </div>

                    {books.length > 0 && (
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--ag-text-muted)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search library..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                                style={{ backgroundColor: 'var(--ag-card)', color: 'var(--ag-text)', border: '1px solid var(--ag-border)' }}
                            />
                        </div>
                    )}
                </div>
            </header>

            {/* Book Grid */}
            <div className="max-w-5xl mx-auto px-6 py-6">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--ag-border)', borderTopColor: 'var(--ag-accent)' }} />
                    </div>
                ) : filteredBooks.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-4xl mb-4">{books.length === 0 ? '📚' : '🔍'}</p>
                        <p className="text-base font-medium mb-2" style={{ color: 'var(--ag-text)' }}>
                            {books.length === 0 ? 'Your library is empty' : 'No matching books'}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--ag-text-muted)' }}>
                            {books.length === 0 ? 'Upload a PDF to start reading.' : 'Try a different search.'}
                        </p>
                        {books.length === 0 && (
                            <a href="/" className="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: 'var(--ag-accent)', color: 'white' }}>
                                Upload PDF
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBooks.map((book) => {
                            const readingMinutes = Math.ceil(book.wordCount / 230);
                            const percent = book.progress?.percent || 0;

                            return (
                                <div
                                    key={book.fileHash}
                                    className="rounded-xl overflow-hidden transition-all hover:scale-[1.02] group"
                                    style={{ backgroundColor: 'var(--ag-card)', border: '1px solid var(--ag-border)' }}
                                >
                                    {/* Cover preview — gradient placeholder */}
                                    <a href={`/reader?id=${book.fileHash}`}>
                                        <div
                                            className="h-32 flex items-center justify-center relative overflow-hidden"
                                            style={{
                                                background: `linear-gradient(135deg, var(--ag-accent-soft), var(--ag-card))`,
                                            }}
                                        >
                                            <span className="text-5xl opacity-20">📄</span>
                                            {/* Progress overlay */}
                                            {percent > 0 && (
                                                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: 'var(--ag-border)' }}>
                                                    <div className="h-full" style={{ width: `${percent}%`, background: 'var(--ag-progress)' }} />
                                                </div>
                                            )}
                                        </div>
                                    </a>

                                    {/* Info */}
                                    <div className="p-4">
                                        <a href={`/reader?id=${book.fileHash}`}>
                                            <h3 className="text-sm font-semibold truncate mb-1 hover:opacity-80" style={{ color: 'var(--ag-text)' }}>
                                                {book.fileName.replace('.pdf', '')}
                                            </h3>
                                        </a>

                                        <div className="flex items-center gap-3 text-[10px] mb-3" style={{ color: 'var(--ag-text-muted)' }}>
                                            <span>{book.totalPages} pages</span>
                                            <span>•</span>
                                            <span>{formatTime(readingMinutes)}</span>
                                            {percent > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span style={{ color: 'var(--ag-accent)' }}>{percent}%</span>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px]" style={{ color: 'var(--ag-text-muted)' }}>
                                                {book.progress?.lastReadAt
                                                    ? getTimeAgo(book.progress.lastReadAt)
                                                    : getTimeAgo(book.parsedAt)}
                                            </span>

                                            <button
                                                onClick={() => handleDelete(book.fileHash)}
                                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:opacity-80"
                                                style={{ color: 'var(--ag-text-muted)' }}
                                                title="Delete book"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
