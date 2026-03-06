'use client';

import { useState, useEffect } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { summarizePage, type SummaryResult } from '@/lib/summarize';

export default function SummaryPanel({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { pages, currentPage } = useReaderStore();
    const [summary, setSummary] = useState<SummaryResult | null>(null);

    useEffect(() => {
        if (isOpen && pages.length > 0) {
            const pageText = pages[currentPage - 1] || '';
            setSummary(summarizePage(pageText, 4));
        }
    }, [isOpen, currentPage, pages]);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-40" style={{ backgroundColor: 'var(--ag-overlay)' }} onClick={onClose} />
            <div
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 rounded-2xl overflow-hidden animate-fade-in"
                style={{ backgroundColor: 'var(--ag-card)', border: '1px solid var(--ag-border)', boxShadow: 'var(--ag-shadow-lg)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--ag-border)' }}>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--ag-text)' }}>
                        📋 Summary — Page {currentPage}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--ag-text-muted)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 max-h-[60vh] overflow-y-auto">
                    {summary && summary.sentences.length > 0 ? (
                        <>
                            <div className="space-y-3 mb-5">
                                {summary.sentences.map((sentence, idx) => (
                                    <p key={idx} className="text-sm leading-relaxed" style={{ color: 'var(--ag-text)' }}>
                                        {sentence}
                                    </p>
                                ))}
                            </div>

                            {summary.keyPhrases.length > 0 && (
                                <div className="pt-4 border-t" style={{ borderColor: 'var(--ag-border)' }}>
                                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--ag-text-muted)' }}>
                                        Key Topics
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {summary.keyPhrases.map((phrase, idx) => (
                                            <span
                                                key={idx}
                                                className="text-[10px] px-2 py-1 rounded-full font-medium"
                                                style={{ backgroundColor: 'var(--ag-accent-soft)', color: 'var(--ag-accent)' }}
                                            >
                                                {phrase}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-center text-sm py-8" style={{ color: 'var(--ag-text-muted)' }}>
                            Not enough text on this page to summarize.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
