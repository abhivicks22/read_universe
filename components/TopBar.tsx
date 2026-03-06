'use client';

import { useReaderStore } from '@/stores/readerStore';
import { addBookmark, removeBookmark } from '@/lib/storage';
import TTSControls from '@/components/TTSControls';

export default function TopBar({
    onEntityPanel,
    onSummary,
    onExport,
}: {
    onEntityPanel?: () => void;
    onSummary?: () => void;
    onExport?: () => void;
}) {
    const {
        fileName, currentPage, totalPages,
        toggleSidebar, toggleSettings, toggleFlashcard, toggleSearch,
        bookmarks, fileHash, addBookmarkToState, removeBookmarkFromState,
        setSidebarTab,
        setActiveNotePageEditing, activeNotePageEditing,
    } = useReaderStore();

    const currentBookmark = bookmarks.find((b) => b.pageNumber === currentPage);

    const handleBookmarkToggle = async () => {
        if (currentBookmark) {
            if (currentBookmark.id) {
                await removeBookmark(currentBookmark.id);
                removeBookmarkFromState(currentBookmark.id);
            }
        } else {
            const bm = { fileHash, pageNumber: currentPage, label: `Page ${currentPage}`, createdAt: new Date().toISOString() };
            const id = await addBookmark(bm);
            addBookmarkToState({ ...bm, id });
        }
    };

    const handleNoteToggle = () => {
        setActiveNotePageEditing(activeNotePageEditing === currentPage ? null : currentPage);
    };

    return (
        <header className="h-14 flex items-center justify-between px-4 border-b shrink-0 z-30"
            style={{ backgroundColor: 'var(--ag-surface)', borderColor: 'var(--ag-border)' }}>
            {/* Left */}
            <div className="flex items-center gap-2">
                <button onClick={toggleSidebar} className="p-2 rounded-lg hover:opacity-80" style={{ color: 'var(--ag-text)' }} aria-label="Toggle sidebar">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <span className="font-semibold text-sm hidden sm:inline" style={{ color: 'var(--ag-text)' }}>Universe Read</span>
                </div>
                <span className="text-sm truncate max-w-[100px] sm:max-w-[160px] hidden md:inline" style={{ color: 'var(--ag-text-muted)' }}>{fileName}</span>
            </div>

            {/* Center — page + TTS */}
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: 'var(--ag-text)' }}>
                    {currentPage} <span style={{ color: 'var(--ag-text-muted)' }}>/ {totalPages}</span>
                </span>
                <TTSControls />
            </div>

            {/* Right */}
            <div className="flex items-center gap-0.5">
                {/* Search */}
                <button onClick={toggleSearch} className="p-2 rounded-lg hover:opacity-80" style={{ color: 'var(--ag-text)' }} title="Search (Ctrl+F)">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </button>

                {/* Bookmark */}
                <button onClick={handleBookmarkToggle} className="p-2 rounded-lg hover:opacity-80" style={{ color: currentBookmark ? 'var(--ag-accent)' : 'var(--ag-text)' }} title="Bookmark (B)">
                    <svg className="w-4 h-4" fill={currentBookmark ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                </button>

                {/* Notes */}
                <button onClick={handleNoteToggle} className="p-2 rounded-lg hover:opacity-80 hidden sm:flex" style={{ color: activeNotePageEditing === currentPage ? 'var(--ag-accent)' : 'var(--ag-text)' }} title="Notes">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                </button>

                {/* Summary */}
                <button onClick={onSummary} className="p-2 rounded-lg hover:opacity-80 hidden sm:flex" style={{ color: 'var(--ag-text)' }} title="Page summary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                    </svg>
                </button>

                {/* Entities */}
                <button onClick={onEntityPanel} className="p-2 rounded-lg hover:opacity-80 hidden sm:flex" style={{ color: 'var(--ag-text)' }} title="Entities (AI)">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                </button>

                {/* Export */}
                <button onClick={onExport} className="p-2 rounded-lg hover:opacity-80 hidden sm:flex" style={{ color: 'var(--ag-text)' }} title="Export highlights & notes">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                </button>

                {/* Flashcard */}
                <button onClick={toggleFlashcard} className="p-2 rounded-lg hover:opacity-80" style={{ color: 'var(--ag-accent)' }} title="Flashcards">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                </button>

                {/* Settings */}
                <button onClick={toggleSettings} className="p-2 rounded-lg hover:opacity-80" style={{ color: 'var(--ag-text)' }} title="Settings">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>

                {/* Library */}
                <a href="/library" className="p-2 rounded-lg hover:opacity-80 hidden sm:flex" style={{ color: 'var(--ag-text-muted)' }} title="Library">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                </a>
            </div>
        </header>
    );
}
