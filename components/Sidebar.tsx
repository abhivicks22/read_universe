'use client';

import { useReaderStore } from '@/stores/readerStore';

export default function Sidebar() {
    const {
        sidebarOpen,
        toggleSidebar,
        pages,
        currentPage,
        setCurrentPage,
    } = useReaderStore();

    if (!sidebarOpen) return null;

    return (
        <>
            {/* Backdrop (mobile) */}
            <div
                className="fixed inset-0 z-30 lg:hidden"
                style={{ backgroundColor: 'var(--ag-overlay)' }}
                onClick={toggleSidebar}
            />

            {/* Sidebar panel */}
            <aside
                className="fixed left-0 top-14 bottom-0 w-64 z-40 overflow-y-auto animate-slide-in-left lg:relative lg:top-0"
                style={{
                    backgroundColor: 'var(--ag-sidebar)',
                    borderRight: '1px solid var(--ag-border)',
                }}
            >
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--ag-border)' }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ag-text-muted)' }}>
                        Pages
                    </h3>
                    <button
                        onClick={toggleSidebar}
                        className="p-1 rounded hover:opacity-80 lg:hidden"
                        style={{ color: 'var(--ag-text-muted)' }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Page list */}
                <div className="p-2">
                    {pages.map((pageText, idx) => {
                        const pageNum = idx + 1;
                        const isActive = pageNum === currentPage;
                        const preview = pageText.slice(0, 80).replace(/\n/g, ' ').trim();

                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    setCurrentPage(pageNum);
                                    // Close sidebar on mobile
                                    if (window.innerWidth < 1024) toggleSidebar();
                                }}
                                className="w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all text-sm hover:opacity-80"
                                style={{
                                    backgroundColor: isActive ? 'var(--ag-accent-soft)' : 'transparent',
                                    outline: isActive ? '1px solid var(--ag-accent)' : 'none',
                                    color: 'var(--ag-text)',
                                }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                        style={{
                                            backgroundColor: isActive ? 'var(--ag-accent)' : 'var(--ag-border)',
                                            color: isActive ? 'white' : 'var(--ag-text-muted)',
                                        }}
                                    >
                                        {pageNum}
                                    </span>
                                </div>
                                {preview && (
                                    <p
                                        className="text-[11px] leading-snug line-clamp-2"
                                        style={{ color: 'var(--ag-text-muted)' }}
                                    >
                                        {preview || 'Empty page'}
                                    </p>
                                )}
                            </button>
                        );
                    })}
                </div>
            </aside>
        </>
    );
}
