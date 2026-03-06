'use client';

import { useState, useEffect } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { removeBookmark, removeHighlight, removeNote as removeNoteDB } from '@/lib/storage';
import { extractEntities, type EntityResult } from '@/lib/entities';
import type { SidebarTab } from '@/stores/readerStore';

const TABS: { id: SidebarTab; label: string; icon: string }[] = [
    { id: 'pages', label: 'Pages', icon: '📄' },
    { id: 'bookmarks', label: 'Marks', icon: '🔖' },
    { id: 'highlights', label: 'Highlights', icon: '🖍️' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'entities', label: 'AI', icon: '🧠' },
];

export default function Sidebar({ onEntityClick }: { onEntityClick?: (entity: string) => void } = {}) {
    const {
        sidebarOpen, toggleSidebar, sidebarTab, setSidebarTab,
        pages, currentPage, setCurrentPage,
        bookmarks, removeBookmarkFromState,
        highlights, removeHighlightFromState,
        notes, removeNoteFromState,
        searchResults, searchQuery, performSearch,
    } = useReaderStore();

    if (!sidebarOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-30 lg:hidden" style={{ backgroundColor: 'var(--ag-overlay)' }} onClick={toggleSidebar} />
            <aside
                className="fixed left-0 top-14 bottom-0 w-72 z-40 overflow-hidden animate-slide-in-left lg:relative lg:top-0 flex flex-col"
                style={{ backgroundColor: 'var(--ag-sidebar)', borderRight: '1px solid var(--ag-border)' }}
            >
                {/* Tabs */}
                <div className="flex border-b shrink-0" style={{ borderColor: 'var(--ag-border)' }}>
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSidebarTab(tab.id)}
                            className="flex-1 py-2.5 text-center transition-all"
                            style={{
                                borderBottom: sidebarTab === tab.id ? '2px solid var(--ag-accent)' : '2px solid transparent',
                                color: sidebarTab === tab.id ? 'var(--ag-accent)' : 'var(--ag-text-muted)',
                            }}
                            title={tab.label}
                        >
                            <span className="text-sm">{tab.icon}</span>
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto">
                    {sidebarTab === 'pages' && <PagesTab pages={pages} currentPage={currentPage} setCurrentPage={setCurrentPage} toggleSidebar={toggleSidebar} />}
                    {sidebarTab === 'bookmarks' && <BookmarksTab bookmarks={bookmarks} setCurrentPage={setCurrentPage} toggleSidebar={toggleSidebar} onRemove={async (id) => { await removeBookmark(id); removeBookmarkFromState(id); }} />}
                    {sidebarTab === 'highlights' && <HighlightsTab highlights={highlights} setCurrentPage={setCurrentPage} toggleSidebar={toggleSidebar} onRemove={async (id) => { await removeHighlight(id); removeHighlightFromState(id); }} />}
                    {sidebarTab === 'notes' && <NotesTab notes={notes} setCurrentPage={setCurrentPage} toggleSidebar={toggleSidebar} onRemove={async (id) => { await removeNoteDB(id); removeNoteFromState(id); }} />}
                    {sidebarTab === 'search' && <SearchTab results={searchResults} query={searchQuery} onSearch={performSearch} setCurrentPage={setCurrentPage} toggleSidebar={toggleSidebar} />}
                    {sidebarTab === 'entities' && <EntitiesTab pages={pages} onEntityClick={onEntityClick} />}
                </div>
            </aside>
        </>
    );
}

/* ---- Tab Content Components ---- */

function PagesTab({ pages, currentPage, setCurrentPage, toggleSidebar }: { pages: string[]; currentPage: number; setCurrentPage: (p: number) => void; toggleSidebar: () => void }) {
    return (
        <div className="p-2">
            {pages.map((text, idx) => {
                const pageNum = idx + 1;
                const isActive = pageNum === currentPage;
                const preview = text.slice(0, 80).replace(/\n/g, ' ').trim();
                return (
                    <button key={idx} onClick={() => { setCurrentPage(pageNum); if (window.innerWidth < 1024) toggleSidebar(); }}
                        className="w-full text-left px-3 py-2 rounded-lg mb-1 transition-all text-sm hover:opacity-80"
                        style={{ backgroundColor: isActive ? 'var(--ag-accent-soft)' : 'transparent', outline: isActive ? '1px solid var(--ag-accent)' : 'none', color: 'var(--ag-text)' }}>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mr-2"
                            style={{ backgroundColor: isActive ? 'var(--ag-accent)' : 'var(--ag-border)', color: isActive ? 'white' : 'var(--ag-text-muted)' }}>{pageNum}</span>
                        {preview && <span className="text-[11px]" style={{ color: 'var(--ag-text-muted)' }}>{preview.slice(0, 50)}</span>}
                    </button>
                );
            })}
        </div>
    );
}

function BookmarksTab({ bookmarks, setCurrentPage, toggleSidebar, onRemove }: { bookmarks: { id?: number; pageNumber: number; label: string; createdAt: string }[]; setCurrentPage: (p: number) => void; toggleSidebar: () => void; onRemove: (id: number) => void }) {
    const sorted = [...bookmarks].sort((a, b) => a.pageNumber - b.pageNumber);
    if (sorted.length === 0) return <EmptyTab icon="🔖" text="No bookmarks yet" sub="Press B while reading to bookmark a page." />;
    return (
        <div className="p-2 space-y-1">
            {sorted.map((bm) => (
                <div key={bm.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:opacity-80 group" style={{ backgroundColor: 'var(--ag-card)' }}>
                    <button onClick={() => { setCurrentPage(bm.pageNumber); if (window.innerWidth < 1024) toggleSidebar(); }} className="flex items-center gap-2 text-left flex-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ag-accent-soft)', color: 'var(--ag-accent)' }}>p.{bm.pageNumber}</span>
                        <span className="text-xs" style={{ color: 'var(--ag-text)' }}>{bm.label || 'Bookmark'}</span>
                    </button>
                    <button onClick={() => bm.id && onRemove(bm.id)} className="p-1 opacity-0 group-hover:opacity-100" style={{ color: 'var(--ag-text-muted)' }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            ))}
        </div>
    );
}

function HighlightsTab({ highlights, setCurrentPage, toggleSidebar, onRemove }: { highlights: { id?: number; pageNumber: number; text: string; color: string }[]; setCurrentPage: (p: number) => void; toggleSidebar: () => void; onRemove: (id: number) => void }) {
    const sorted = [...highlights].sort((a, b) => a.pageNumber - b.pageNumber);
    const colorMap: Record<string, string> = { yellow: '#FEF08A', green: '#BBF7D0', blue: '#BFDBFE', pink: '#FBCFE8' };
    if (sorted.length === 0) return <EmptyTab icon="🖍️" text="No highlights yet" sub="Select text while reading to highlight it." />;
    return (
        <div className="p-2 space-y-1">
            {sorted.map((hl) => (
                <div key={hl.id} className="px-3 py-2 rounded-lg group" style={{ backgroundColor: 'var(--ag-card)' }}>
                    <div className="flex items-center justify-between mb-1">
                        <button onClick={() => { setCurrentPage(hl.pageNumber); if (window.innerWidth < 1024) toggleSidebar(); }}>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: colorMap[hl.color] || colorMap.yellow }}>p.{hl.pageNumber}</span>
                        </button>
                        <button onClick={() => hl.id && onRemove(hl.id)} className="p-1 opacity-0 group-hover:opacity-100" style={{ color: 'var(--ag-text-muted)' }}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-3 rounded px-1" style={{ color: 'var(--ag-text)', backgroundColor: `${colorMap[hl.color] || colorMap.yellow}40` }}>
                        &ldquo;{hl.text}&rdquo;
                    </p>
                </div>
            ))}
        </div>
    );
}

function NotesTab({ notes, setCurrentPage, toggleSidebar, onRemove }: { notes: { id?: number; pageNumber: number; content: string }[]; setCurrentPage: (p: number) => void; toggleSidebar: () => void; onRemove: (id: number) => void }) {
    const sorted = [...notes].sort((a, b) => a.pageNumber - b.pageNumber);
    if (sorted.length === 0) return <EmptyTab icon="📝" text="No notes yet" sub="Click the note icon in the top bar to add notes." />;
    return (
        <div className="p-2 space-y-1">
            {sorted.map((note) => (
                <div key={note.id} className="px-3 py-2 rounded-lg group" style={{ backgroundColor: 'var(--ag-card)' }}>
                    <div className="flex items-center justify-between mb-1">
                        <button onClick={() => { setCurrentPage(note.pageNumber); if (window.innerWidth < 1024) toggleSidebar(); }}>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ag-accent-soft)', color: 'var(--ag-accent)' }}>p.{note.pageNumber}</span>
                        </button>
                        <button onClick={() => note.id && onRemove(note.id)} className="p-1 opacity-0 group-hover:opacity-100" style={{ color: 'var(--ag-text-muted)' }}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--ag-text)' }}>{note.content}</p>
                </div>
            ))}
        </div>
    );
}

function SearchTab({ results, query, onSearch, setCurrentPage, toggleSidebar }: { results: { pageNumber: number; snippet: string }[]; query: string; onSearch: (q: string) => void; setCurrentPage: (p: number) => void; toggleSidebar: () => void }) {
    return (
        <div className="p-2">
            <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs mb-2 outline-none"
                style={{ backgroundColor: 'var(--ag-card)', color: 'var(--ag-text)', border: '1px solid var(--ag-border)' }}
            />
            {query && <p className="text-[10px] mb-2 px-1" style={{ color: 'var(--ag-text-muted)' }}>{results.length} results</p>}
            <div className="space-y-1">
                {results.map((r, idx) => (
                    <button key={idx} onClick={() => { setCurrentPage(r.pageNumber); if (window.innerWidth < 1024) toggleSidebar(); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:opacity-80" style={{ backgroundColor: 'var(--ag-card)', color: 'var(--ag-text-muted)' }}>
                        <span className="text-[10px] font-bold px-1 rounded mr-1" style={{ backgroundColor: 'var(--ag-accent-soft)', color: 'var(--ag-accent)' }}>p.{r.pageNumber}</span>
                        {r.snippet}
                    </button>
                ))}
            </div>
            {!query && <EmptyTab icon="🔍" text="Search your document" sub="Type above to search." />}
        </div>
    );
}

function EntitiesTab({ pages, onEntityClick }: { pages: string[]; onEntityClick?: (entity: string) => void }) {
    const [entities, setEntities] = useState<EntityResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'people' | 'places' | 'organizations'>('people');

    useEffect(() => {
        if (pages.length > 0 && !entities) {
            setLoading(true);
            extractEntities(pages).then((result) => {
                setEntities(result);
                setLoading(false);
            });
        }
    }, [pages, entities]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--ag-border)', borderTopColor: 'var(--ag-accent)' }} />
                    <p className="text-[10px] mt-2" style={{ color: 'var(--ag-text-muted)' }}>Analyzing text...</p>
                </div>
            </div>
        );
    }

    const categories = [
        { id: 'people' as const, label: 'People', icon: '👤', items: entities?.people || [] },
        { id: 'places' as const, label: 'Places', icon: '📍', items: entities?.places || [] },
        { id: 'organizations' as const, label: 'Orgs', icon: '🏢', items: entities?.organizations || [] },
    ];

    const currentItems = categories.find((c) => c.id === activeTab)?.items || [];

    return (
        <div className="p-2">
            <div className="flex gap-1 mb-2">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        className="flex-1 text-[10px] py-1.5 rounded-lg font-medium transition-all"
                        style={{
                            backgroundColor: activeTab === cat.id ? 'var(--ag-accent-soft)' : 'transparent',
                            color: activeTab === cat.id ? 'var(--ag-accent)' : 'var(--ag-text-muted)',
                        }}
                    >
                        {cat.icon} {cat.label} ({cat.items.length})
                    </button>
                ))}
            </div>
            {currentItems.length === 0 ? (
                <EmptyTab icon={categories.find((c) => c.id === activeTab)?.icon || '🧠'} text={`No ${activeTab} found`} sub="Try with a longer document." />
            ) : (
                <div className="space-y-1">
                    {currentItems.map((entity, idx) => (
                        <button
                            key={idx}
                            onClick={() => onEntityClick?.(entity)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs hover:opacity-80 flex items-center justify-between"
                            style={{ backgroundColor: 'var(--ag-card)', color: 'var(--ag-text)' }}
                        >
                            <span>{entity}</span>
                            <span className="text-[9px]" style={{ color: 'var(--ag-accent)' }}>Wiki →</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function EmptyTab({ icon, text, sub }: { icon: string; text: string; sub: string }) {
    return (
        <div className="text-center py-12 px-4">
            <p className="text-2xl mb-2">{icon}</p>
            <p className="text-sm font-medium" style={{ color: 'var(--ag-text)' }}>{text}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--ag-text-muted)' }}>{sub}</p>
        </div>
    );
}
