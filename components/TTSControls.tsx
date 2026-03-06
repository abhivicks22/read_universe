'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { speak, pause, resume, stop, isSpeaking, isPaused, isTTSSupported, getVoices } from '@/lib/tts';

export default function TTSControls() {
    const { pages, currentPage, nextPage } = useReaderStore();
    const [playing, setPlaying] = useState(false);
    const [paused, setPaused] = useState(false);
    const [rate, setRate] = useState(1.0);
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        setSupported(isTTSSupported());
        // Preload voices
        if (isTTSSupported()) {
            getVoices();
            // Some browsers need a slight delay to load voices
            setTimeout(() => getVoices(), 100);
        }
    }, []);

    useEffect(() => {
        // Cleanup on unmount
        return () => stop();
    }, []);

    const handlePlay = useCallback(() => {
        if (paused) {
            resume();
            setPaused(false);
            setPlaying(true);
            return;
        }

        const pageText = pages[currentPage - 1] || '';
        if (!pageText.trim()) return;

        speak(pageText, {
            rate,
            onEnd: () => {
                setPlaying(false);
                setPaused(false);
            },
        });

        setPlaying(true);
        setPaused(false);
    }, [pages, currentPage, rate, paused]);

    const handlePause = useCallback(() => {
        pause();
        setPaused(true);
        setPlaying(false);
    }, []);

    const handleStop = useCallback(() => {
        stop();
        setPlaying(false);
        setPaused(false);
    }, []);

    const handleRateChange = (newRate: number) => {
        setRate(newRate);
        if (playing || paused) {
            handleStop();
        }
    };

    if (!supported) return null;

    const isActive = playing || paused;

    if (!isActive) {
        // Compact play button
        return (
            <button
                onClick={handlePlay}
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ color: 'var(--ag-text)' }}
                title="Read aloud"
            >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
            </button>
        );
    }

    // Expanded controls when active
    return (
        <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: 'var(--ag-card)', border: '1px solid var(--ag-border)' }}
        >
            {/* Play/Pause */}
            <button
                onClick={playing ? handlePause : handlePlay}
                className="p-1.5 rounded-lg hover:opacity-80"
                style={{ color: 'var(--ag-accent)' }}
            >
                {playing ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
                )}
            </button>

            {/* Stop */}
            <button onClick={handleStop} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--ag-text-muted)' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
            </button>

            {/* Speed */}
            <div className="flex items-center gap-1">
                {[0.75, 1.0, 1.25, 1.5].map((r) => (
                    <button
                        key={r}
                        onClick={() => handleRateChange(r)}
                        className="text-[9px] px-1 py-0.5 rounded font-bold transition-all"
                        style={{
                            backgroundColor: rate === r ? 'var(--ag-accent)' : 'transparent',
                            color: rate === r ? 'white' : 'var(--ag-text-muted)',
                        }}
                    >
                        {r}x
                    </button>
                ))}
            </div>
        </div>
    );
}
