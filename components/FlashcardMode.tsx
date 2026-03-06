'use client';

import { useState, useEffect, useCallback } from 'react';
import { getVocabWords, updateVocabWord } from '@/lib/storage';
import type { VocabWord } from '@/lib/storage';

interface FlashcardModeProps {
    isOverlay?: boolean;
    onClose?: () => void;
}

export default function FlashcardMode({ isOverlay = false, onClose }: FlashcardModeProps) {
    const [words, setWords] = useState<VocabWord[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [shuffled, setShuffled] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load vocabulary
    useEffect(() => {
        const loadWords = async () => {
            const allWords = await getVocabWords();
            const unmastered = allWords.filter((w) => !w.mastered);
            setWords(unmastered);
            setLoading(false);
        };
        loadWords();
    }, []);

    const currentWord = words[currentIndex];
    const masteredCount = words.filter((w) => w.mastered).length;
    const remainingCount = words.length - masteredCount;

    const handleFlip = useCallback(() => setFlipped((f) => !f), []);

    const handleGotIt = useCallback(async () => {
        if (!currentWord?.id) return;
        await updateVocabWord(currentWord.id, { mastered: true });

        setWords((prev) => prev.filter((w) => w.id !== currentWord.id));
        setFlipped(false);

        if (currentIndex >= words.length - 1) {
            setCurrentIndex(0);
        }
    }, [currentWord, currentIndex, words.length]);

    const handleStillLearning = useCallback(() => {
        setFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % words.length);
    }, [words.length]);

    const handleShuffle = useCallback(() => {
        const shuffledWords = [...words].sort(() => Math.random() - 0.5);
        setWords(shuffledWords);
        setCurrentIndex(0);
        setFlipped(false);
        setShuffled(true);
        setTimeout(() => setShuffled(false), 1000);
    }, [words]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleFlip();
            } else if (e.key === 'ArrowRight') {
                if (flipped) handleStillLearning();
            } else if (e.key === 'ArrowUp') {
                if (flipped) handleGotIt();
            } else if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleFlip, handleStillLearning, handleGotIt, flipped, onClose]);

    const containerClass = isOverlay
        ? 'fixed inset-0 z-50 flex items-center justify-center p-4'
        : 'flex items-center justify-center min-h-[60vh] p-4';

    if (loading) {
        return (
            <div className={containerClass} style={isOverlay ? { backgroundColor: 'var(--ag-overlay)' } : {}}>
                <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: 'var(--ag-border)', borderTopColor: 'var(--ag-accent)' }} />
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <div className={containerClass} style={isOverlay ? { backgroundColor: 'var(--ag-overlay)' } : {}}>
                <div className="text-center p-8 rounded-2xl" style={{ backgroundColor: 'var(--ag-card)' }}>
                    <p className="text-4xl mb-4">🎉</p>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--ag-text)' }}>
                        {remainingCount === 0 && masteredCount > 0 ? 'All words mastered!' : 'No vocabulary words yet'}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--ag-text-muted)' }}>
                        {masteredCount > 0
                            ? `You've mastered all ${masteredCount} words. Great job!`
                            : 'Double-click words while reading to save them to your vocabulary.'}
                    </p>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium"
                            style={{ backgroundColor: 'var(--ag-accent)', color: 'white' }}
                        >
                            Back to Reading
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={containerClass} style={isOverlay ? { backgroundColor: 'var(--ag-overlay)' } : {}}>
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--ag-text)' }}>
                            {currentIndex + 1} / {words.length}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--ag-accent-soft)', color: 'var(--ag-accent)' }}>
                            {remainingCount} remaining
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShuffle}
                            className="p-2 rounded-lg transition-all text-sm"
                            style={{ color: shuffled ? 'var(--ag-accent)' : 'var(--ag-text-muted)' }}
                            title="Shuffle cards"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                            </svg>
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg transition-all"
                                style={{ color: 'var(--ag-text-muted)' }}
                                title="Close"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Flashcard */}
                <div
                    className="flashcard-container w-full aspect-[3/2] cursor-pointer"
                    onClick={handleFlip}
                >
                    <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
                        {/* Front */}
                        <div
                            className="flashcard-front flex items-center justify-center p-8"
                            style={{
                                backgroundColor: 'var(--ag-card)',
                                border: '1px solid var(--ag-border)',
                            }}
                        >
                            <div className="text-center">
                                <p className="text-3xl font-bold mb-3" style={{ color: 'var(--ag-text)' }}>
                                    {currentWord.word}
                                </p>
                                {currentWord.phonetic && (
                                    <p className="text-sm" style={{ color: 'var(--ag-text-muted)' }}>
                                        {currentWord.phonetic}
                                    </p>
                                )}
                                <p className="text-xs mt-4" style={{ color: 'var(--ag-text-muted)' }}>
                                    Tap to flip
                                </p>
                            </div>
                        </div>

                        {/* Back */}
                        <div
                            className="flashcard-back flex flex-col items-center justify-center p-8 overflow-y-auto"
                            style={{
                                backgroundColor: 'var(--ag-card)',
                                border: '1px solid var(--ag-border)',
                            }}
                        >
                            <div className="text-center w-full">
                                {currentWord.partOfSpeech && (
                                    <span
                                        className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-3"
                                        style={{ backgroundColor: 'var(--ag-accent-soft)', color: 'var(--ag-accent)' }}
                                    >
                                        {currentWord.partOfSpeech}
                                    </span>
                                )}
                                <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--ag-text)' }}>
                                    {currentWord.definition}
                                </p>
                                {currentWord.contextSentence && (
                                    <div
                                        className="text-xs leading-relaxed p-3 rounded-lg text-left"
                                        style={{ backgroundColor: 'var(--ag-bg)', color: 'var(--ag-text-muted)' }}
                                    >
                                        <span className="font-medium" style={{ color: 'var(--ag-text)' }}>Context: </span>
                                        &ldquo;{currentWord.contextSentence}&rdquo;
                                        <span className="block mt-1 text-[10px]">
                                            — {currentWord.bookName}, p.{currentWord.pageNumber}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleStillLearning}
                        className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                        style={{
                            backgroundColor: 'var(--ag-card)',
                            border: '1px solid var(--ag-border)',
                            color: 'var(--ag-text)',
                        }}
                    >
                        Still Learning →
                    </button>
                    <button
                        onClick={handleGotIt}
                        className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                        style={{
                            backgroundColor: 'var(--ag-accent)',
                            color: 'white',
                        }}
                    >
                        Got It ✓
                    </button>
                </div>

                {/* Keyboard hints */}
                <p className="text-center text-[10px] mt-3" style={{ color: 'var(--ag-text-muted)' }}>
                    Space/Enter to flip • → Still learning • ↑ Got it
                </p>
            </div>
        </div>
    );
}
