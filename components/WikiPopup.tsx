'use client';

import { useState, useEffect } from 'react';

interface WikiResult {
    title: string;
    extract: string;
    thumbnail?: string;
    url: string;
    found: boolean;
}

async function fetchWikiSummary(query: string): Promise<WikiResult> {
    try {
        const encoded = encodeURIComponent(query);
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`);

        if (res.status === 404) {
            // Try search instead
            const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&format=json&origin=*&search=${encoded}`);
            const searchData = await searchRes.json();
            if (searchData[1]?.length > 0) {
                const title = searchData[1][0];
                const retryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
                if (retryRes.ok) {
                    const data = await retryRes.json();
                    return {
                        title: data.title,
                        extract: data.extract || '',
                        thumbnail: data.thumbnail?.source,
                        url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
                        found: true,
                    };
                }
            }
            return { title: query, extract: '', url: '', found: false };
        }

        const data = await res.json();
        return {
            title: data.title,
            extract: data.extract || '',
            thumbnail: data.thumbnail?.source,
            url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
            found: true,
        };
    } catch {
        return { title: query, extract: '', url: '', found: false };
    }
}

export default function WikiPopup({
    entity,
    onClose,
}: {
    entity: string;
    onClose: () => void;
}) {
    const [result, setResult] = useState<WikiResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchWikiSummary(entity).then((r) => {
            setResult(r);
            setLoading(false);
        });
    }, [entity]);

    return (
        <>
            <div className="fixed inset-0 z-50" style={{ backgroundColor: 'var(--ag-overlay)' }} onClick={onClose} />
            <div
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[60] rounded-2xl overflow-hidden animate-fade-in"
                style={{ backgroundColor: 'var(--ag-card)', border: '1px solid var(--ag-border)', boxShadow: 'var(--ag-shadow-lg)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--ag-border)' }}>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--ag-text)' }}>
                        🌐 {entity}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--ag-text-muted)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 max-h-[50vh] overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--ag-border)', borderTopColor: 'var(--ag-accent)' }} />
                        </div>
                    ) : result?.found ? (
                        <div>
                            {result.thumbnail && (
                                <img
                                    src={result.thumbnail}
                                    alt={result.title}
                                    className="w-20 h-20 rounded-lg object-cover float-right ml-3 mb-2"
                                />
                            )}
                            <h3 className="text-base font-bold mb-2" style={{ color: 'var(--ag-text)' }}>{result.title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--ag-text)' }}>
                                {result.extract.length > 500 ? result.extract.slice(0, 500) + '...' : result.extract}
                            </p>
                            <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-3 text-xs font-medium hover:opacity-80"
                                style={{ color: 'var(--ag-accent)' }}
                            >
                                Read more on Wikipedia →
                            </a>
                        </div>
                    ) : (
                        <p className="text-center text-sm py-8" style={{ color: 'var(--ag-text-muted)' }}>
                            No Wikipedia article found for &ldquo;{entity}&rdquo;.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
