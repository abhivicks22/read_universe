'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { lookupWord, extractContextSentence } from '@/lib/dictionary';
import { addVocabWord } from '@/lib/storage';
import type { DictionaryResult } from '@/lib/dictionary';

export default function DictionaryPopup() {
    const { dictionaryState, hideDictionary, pages, currentPage, fileName } = useReaderStore();
    const [result, setResult] = useState<DictionaryResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    // Fetch word definition when dictionary state changes
    useEffect(() => {
        if (!dictionaryState) {
            setResult(null);
            setSaved(false);
            return;
        }

        setLoading(true);
        setSaved(false);
        lookupWord(dictionaryState.word).then((res) => {
            setResult(res);
            setLoading(false);
        });
    }, [dictionaryState]);

    // Handle click outside
    const handleClickOutside = useCallback(
        (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                hideDictionary();
            }
        },
        [hideDictionary]
    );

    // Handle Escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                hideDictionary();
            }
        },
        [hideDictionary]
    );

    useEffect(() => {
        if (dictionaryState) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [dictionaryState, handleClickOutside, handleKeyDown]);

    const handleSaveToVocabulary = useCallback(async () => {
        if (!result || !dictionaryState) return;

        const pageText = pages[currentPage - 1] || '';
        const contextSentence = extractContextSentence(pageText, result.word);

        await addVocabWord({
            word: result.word,
            definition: result.definitions[0] || 'No definition available',
            phonetic: result.phonetic,
            partOfSpeech: result.partOfSpeech,
            contextSentence: contextSentence || dictionaryState.contextSentence,
            pageNumber: dictionaryState.pageNumber,
            bookName: fileName,
            dateAdded: new Date().toISOString(),
            mastered: false,
        });

        setSaved(true);
    }, [result, dictionaryState, pages, currentPage, fileName]);

    if (!dictionaryState) return null;

    // Calculate popup position (keep within viewport)
    const popupStyle: React.CSSProperties = {
        position: 'fixed',
        left: Math.min(Math.max(dictionaryState.x - 160, 16), window.innerWidth - 336),
        top: Math.min(dictionaryState.y, window.innerHeight - 300),
        zIndex: 60,
    };

    return (
        <div
            ref={popupRef}
            className="w-80 rounded-xl overflow-hidden animate-fade-in"
            style={{
                ...popupStyle,
                backgroundColor: 'var(--ag-card)',
                border: '1px solid var(--ag-border)',
                boxShadow: 'var(--ag-shadow-lg)',
            }}
        >
            {loading ? (
                <div className="p-5 text-center">
                    <div
                        className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
                        style={{ borderColor: 'var(--ag-border)', borderTopColor: 'var(--ag-accent)' }}
                    />
                    <p className="text-xs mt-2" style={{ color: 'var(--ag-text-muted)' }}>
                        Looking up...
                    </p>
                </div>
            ) : result && result.found ? (
                <div>
                    {/* Word header */}
                    <div className="p-4 pb-3 border-b" style={{ borderColor: 'var(--ag-border)' }}>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-lg font-bold" style={{ color: 'var(--ag-text)' }}>
                                {result.word}
                            </h3>
                            {result.phonetic && (
                                <span className="text-sm" style={{ color: 'var(--ag-text-muted)' }}>
                                    {result.phonetic}
                                </span>
                            )}
                        </div>
                        {result.partOfSpeech && (
                            <span
                                className="inline-block text-[10px] font-semibold uppercase tracking-wider mt-1 px-2 py-0.5 rounded"
                                style={{
                                    backgroundColor: 'var(--ag-accent-soft)',
                                    color: 'var(--ag-accent)',
                                }}
                            >
                                {result.partOfSpeech}
                            </span>
                        )}
                    </div>

                    {/* Definitions */}
                    <div className="p-4 pt-3 space-y-2 max-h-40 overflow-y-auto">
                        {result.definitions.map((def, idx) => (
                            <p key={idx} className="text-sm leading-relaxed" style={{ color: 'var(--ag-text)' }}>
                                <span className="font-medium" style={{ color: 'var(--ag-text-muted)' }}>
                                    {idx + 1}.{' '}
                                </span>
                                {def}
                            </p>
                        ))}
                    </div>

                    {/* Save button */}
                    <div className="p-3 pt-0">
                        <button
                            onClick={handleSaveToVocabulary}
                            disabled={saved}
                            className="w-full py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                                backgroundColor: saved ? 'var(--ag-accent-soft)' : 'var(--ag-accent)',
                                color: saved ? 'var(--ag-accent)' : 'white',
                                opacity: saved ? 0.8 : 1,
                            }}
                        >
                            {saved ? '✓ Saved to Vocabulary' : '+ Save to Vocabulary'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-5 text-center">
                    <p className="text-2xl mb-2">🤷</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--ag-text)' }}>
                        No definition found
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--ag-text-muted)' }}>
                        &ldquo;{dictionaryState.word}&rdquo; wasn&apos;t found in the dictionary
                    </p>
                </div>
            )}

            {/* Close hint */}
            <div className="text-center pb-2">
                <p className="text-[9px]" style={{ color: 'var(--ag-text-muted)' }}>
                    Press Esc or click outside to close
                </p>
            </div>
        </div>
    );
}
