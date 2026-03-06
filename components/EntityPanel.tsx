'use client';

import { useState, useEffect } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { extractEntities, type EntityResult } from '@/lib/entities';

export default function EntityPanel({
    isOpen,
    onClose,
    onEntityClick,
}: {
    isOpen: boolean;
    onClose: () => void;
    onEntityClick: (entity: string) => void;
}) {
    const { pages } = useReaderStore();
    const [entities, setEntities] = useState<EntityResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'people' | 'places' | 'organizations'>('people');

    useEffect(() => {
        if (isOpen && !entities && pages.length > 0) {
            setLoading(true);
            extractEntities(pages).then((result) => {
                setEntities(result);
                setLoading(false);
            });
        }
    }, [isOpen, entities, pages]);

    if (!isOpen) return null;

    const tabs = [
        { id: 'people' as const, label: 'People', icon: '👤', count: entities?.people.length || 0 },
        { id: 'places' as const, label: 'Places', icon: '📍', count: entities?.places.length || 0 },
        { id: 'organizations' as const, label: 'Orgs', icon: '🏢', count: entities?.organizations.length || 0 },
    ];

    const currentList = entities?.[activeTab] || [];

    return (
        <>
            <div className="fixed inset-0 z-40" style={{ backgroundColor: 'var(--ag-overlay)' }} onClick={onClose} />
            <div
                className="fixed right-0 top-0 bottom-0 w-80 z-50 overflow-y-auto animate-slide-in-right flex flex-col"
                style={{ backgroundColor: 'var(--ag-surface)', borderLeft: '1px solid var(--ag-border)', boxShadow: 'var(--ag-shadow-lg)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--ag-border)' }}>
                    <h2 className="text-base font-semibold" style={{ color: 'var(--ag-text)' }}>🧠 Entities</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--ag-text-muted)' }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--ag-border)', borderTopColor: 'var(--ag-accent)' }} />
                            <p className="text-xs mt-3" style={{ color: 'var(--ag-text-muted)' }}>Analyzing text...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex border-b" style={{ borderColor: 'var(--ag-border)' }}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className="flex-1 py-2.5 text-center text-xs font-medium transition-all"
                                    style={{
                                        borderBottom: activeTab === tab.id ? '2px solid var(--ag-accent)' : '2px solid transparent',
                                        color: activeTab === tab.id ? 'var(--ag-accent)' : 'var(--ag-text-muted)',
                                    }}
                                >
                                    {tab.icon} {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-3">
                            {currentList.length === 0 ? (
                                <p className="text-center text-xs py-8" style={{ color: 'var(--ag-text-muted)' }}>
                                    No {activeTab} detected.
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {currentList.map((entity, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onEntityClick(entity)}
                                            className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all hover:opacity-80"
                                            style={{ backgroundColor: 'var(--ag-card)', color: 'var(--ag-text)' }}
                                        >
                                            {entity}
                                            <span className="ml-2 text-[10px]" style={{ color: 'var(--ag-accent)' }}>Wiki →</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
