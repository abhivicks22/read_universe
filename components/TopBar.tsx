'use client';

import { useReaderStore } from '@/stores/readerStore';

export default function TopBar() {
    const {
        fileName,
        currentPage,
        totalPages,
        toggleSidebar,
        toggleSettings,
        toggleFlashcard,
    } = useReaderStore();

    return (
        <header
            className="h-14 flex items-center justify-between px-4 border-b shrink-0 z-30"
            style={{
                backgroundColor: 'var(--ag-surface)',
                borderColor: 'var(--ag-border)',
            }}
        >
            {/* Left section */}
            <div className="flex items-center gap-3">
                {/* Hamburger / sidebar toggle */}
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: 'var(--ag-text)' }}
                    aria-label="Toggle sidebar"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>

                {/* App name + icon */}
                <div className="flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <span
                        className="font-semibold text-sm hidden sm:inline"
                        style={{ color: 'var(--ag-text)' }}
                    >
                        Anti Gravity
                    </span>
                </div>

                {/* Divider */}
                <div className="w-px h-5 hidden sm:block" style={{ backgroundColor: 'var(--ag-border)' }} />

                {/* File name */}
                <span
                    className="text-sm truncate max-w-[120px] sm:max-w-[200px] hidden sm:inline"
                    style={{ color: 'var(--ag-text-muted)' }}
                >
                    {fileName}
                </span>
            </div>

            {/* Center — page indicator */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--ag-text)' }}>
                    {currentPage} <span style={{ color: 'var(--ag-text-muted)' }}>/ {totalPages}</span>
                </span>
            </div>

            {/* Right section — action buttons */}
            <div className="flex items-center gap-1">
                {/* Search (placeholder) */}
                <button
                    className="p-2 rounded-lg transition-colors opacity-40 cursor-default"
                    style={{ color: 'var(--ag-text-muted)' }}
                    title="Search — Coming in Phase 2"
                >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </button>

                {/* Bookmark (placeholder) */}
                <button
                    className="p-2 rounded-lg transition-colors opacity-40 cursor-default hidden sm:flex"
                    style={{ color: 'var(--ag-text-muted)' }}
                    title="Bookmarks — Coming in Phase 2"
                >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                </button>

                {/* Flashcard */}
                <button
                    onClick={toggleFlashcard}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: 'var(--ag-accent)' }}
                    title="Vocabulary Flashcards"
                >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                </button>

                {/* Settings */}
                <button
                    onClick={toggleSettings}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: 'var(--ag-text)' }}
                    title="Reading Settings"
                >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>

                {/* New file */}
                <a
                    href="/"
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: 'var(--ag-text-muted)' }}
                    title="Open new file"
                >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </a>
            </div>
        </header>
    );
}
