'use client';

import { useState, useEffect, useCallback } from 'react';
import { getVocabWords, deleteVocabWord, updateVocabWord, getPreferences } from '@/lib/storage';
import { applyTheme } from '@/lib/themes';
import FlashcardMode from '@/components/FlashcardMode';
import type { VocabWord } from '@/lib/storage';

export default function VocabularyPage() {
    const [words, setWords] = useState<VocabWord[]>([]);
    const [search, setSearch] = useState('');
    const [showMastered, setShowMastered] = useState(false);
    const [flashcardMode, setFlashcardMode] = useState(false);
    const [loading, setLoading] = useState(true);

    // Init theme
    useEffect(() => {
        const init = async () => {
            const prefs = await getPreferences();
            applyTheme(prefs.theme);
        };
        init();
    }, []);

    // Load words
    const loadWords = useCallback(async () => {
        const allWords = await getVocabWords();
        setWords(allWords.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()));
        setLoading(false);
    }, []);

    useEffect(() => {
        loadWords();
    }, [loadWords]);

    const handleDelete = async (id: number) => {
        await deleteVocabWord(id);
        setWords((prev) => prev.filter((w) => w.id !== id));
    };

    const handleToggleMastered = async (id: number, mastered: boolean) => {
        await updateVocabWord(id, { mastered: !mastered });
        setWords((prev) =>
            prev.map((w) => (w.id === id ? { ...w, mastered: !mastered } : w))
        );
    };

    const filteredWords = words.filter((w) => {
        if (!showMastered && w.mastered) return false;
        if (search && !w.word.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const masteredCount = words.filter((w) => w.mastered).length;
    const totalCount = words.length;

    if (flashcardMode) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: 'var(--ag-bg)' }}>
                <FlashcardMode onClose={() => { setFlashcardMode(false); loadWords(); }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--ag-bg)' }}>
            {/* Header */}
            <header
                className="border-b"
                style={{
                    backgroundColor: 'var(--ag-surface)',
                    borderColor: 'var(--ag-border)',
                }}
            >
                <div className="max-w-3xl mx-auto px-6 py-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <a href="/" className="text-lg hover:opacity-80 transition-opacity">
                                🚀
                            </a>
                            <div>
                                <h1 className="text-xl font-bold" style={{ color: 'var(--ag-text)' }}>
                                    Vocabulary
                                </h1>
                                <p className="text-xs" style={{ color: 'var(--ag-text-muted)' }}>
                                    {totalCount} words • {masteredCount} mastered
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setFlashcardMode(true)}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                            style={{
                                backgroundColor: 'var(--ag-accent)',
                                color: 'white',
                            }}
                        >
                            🎴 Flashcards
                        </button>
                    </div>

                    {/* Search + filters */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                                style={{ color: 'var(--ag-text-muted)' }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search words..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                                style={{
                                    backgroundColor: 'var(--ag-card)',
                                    color: 'var(--ag-text)',
                                    border: '1px solid var(--ag-border)',
                                }}
                            />
                        </div>

                        <button
                            onClick={() => setShowMastered(!showMastered)}
                            className="px-3 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
                            style={{
                                backgroundColor: showMastered ? 'var(--ag-accent-soft)' : 'var(--ag-card)',
                                color: showMastered ? 'var(--ag-accent)' : 'var(--ag-text-muted)',
                                border: '1px solid var(--ag-border)',
                            }}
                        >
                            {showMastered ? 'Showing all' : 'Show mastered'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Word list */}
            <div className="max-w-3xl mx-auto px-6 py-6">
                {loading ? (
                    <div className="text-center py-20">
                        <div
                            className="w-8 h-8 border-2 rounded-full animate-spin mx-auto"
                            style={{
                                borderColor: 'var(--ag-border)',
                                borderTopColor: 'var(--ag-accent)',
                            }}
                        />
                    </div>
                ) : filteredWords.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-4xl mb-4">{totalCount === 0 ? '📖' : '🔍'}</p>
                        <p className="text-base font-medium mb-2" style={{ color: 'var(--ag-text)' }}>
                            {totalCount === 0
                                ? 'No words saved yet'
                                : 'No matching words'}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--ag-text-muted)' }}>
                            {totalCount === 0
                                ? 'Double-click words while reading to save them here.'
                                : 'Try a different search term.'}
                        </p>
                        {totalCount === 0 && (
                            <a
                                href="/"
                                className="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                                style={{ backgroundColor: 'var(--ag-accent)', color: 'white' }}
                            >
                                Start Reading
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredWords.map((word) => (
                            <div
                                key={word.id}
                                className="rounded-xl p-4 transition-all hover:scale-[1.01]"
                                style={{
                                    backgroundColor: 'var(--ag-card)',
                                    border: '1px solid var(--ag-border)',
                                }}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            <span
                                                className="text-lg font-bold"
                                                style={{ color: word.mastered ? 'var(--ag-text-muted)' : 'var(--ag-text)' }}
                                            >
                                                {word.word}
                                            </span>
                                            {word.phonetic && (
                                                <span className="text-xs" style={{ color: 'var(--ag-text-muted)' }}>
                                                    {word.phonetic}
                                                </span>
                                            )}
                                            {word.partOfSpeech && (
                                                <span
                                                    className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                                    style={{
                                                        backgroundColor: 'var(--ag-accent-soft)',
                                                        color: 'var(--ag-accent)',
                                                    }}
                                                >
                                                    {word.partOfSpeech}
                                                </span>
                                            )}
                                            {word.mastered && (
                                                <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                                                    Mastered ✓
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--ag-text)' }}>
                                            {word.definition}
                                        </p>
                                        {word.contextSentence && (
                                            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--ag-text-muted)' }}>
                                                &ldquo;{word.contextSentence}&rdquo;
                                                <span className="ml-1 opacity-60">
                                                    — {word.bookName}, p.{word.pageNumber}
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => word.id && handleToggleMastered(word.id, word.mastered)}
                                            className="p-1.5 rounded-lg transition-all hover:opacity-80"
                                            style={{ color: word.mastered ? 'var(--ag-accent)' : 'var(--ag-text-muted)' }}
                                            title={word.mastered ? 'Unmark mastered' : 'Mark as mastered'}
                                        >
                                            <svg className="w-4 h-4" fill={word.mastered ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => word.id && handleDelete(word.id)}
                                            className="p-1.5 rounded-lg transition-all hover:opacity-80"
                                            style={{ color: 'var(--ag-text-muted)' }}
                                            title="Delete word"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
