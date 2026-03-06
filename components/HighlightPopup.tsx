'use client';

import { useReaderStore } from '@/stores/readerStore';
import { addHighlight } from '@/lib/storage';
import type { HighlightColor } from '@/lib/storage';

const COLORS: { id: HighlightColor; label: string; bg: string }[] = [
    { id: 'yellow', label: 'Yellow', bg: '#FEF08A' },
    { id: 'green', label: 'Green', bg: '#BBF7D0' },
    { id: 'blue', label: 'Blue', bg: '#BFDBFE' },
    { id: 'pink', label: 'Pink', bg: '#FBCFE8' },
];

export default function HighlightPopup() {
    const {
        highlightSelection,
        hideHighlightPopup,
        fileHash,
        currentPage,
        addHighlightToState,
    } = useReaderStore();

    if (!highlightSelection) return null;

    const handleColorSelect = async (color: HighlightColor) => {
        const hl = {
            fileHash,
            pageNumber: currentPage,
            text: highlightSelection.text,
            color,
            startOffset: highlightSelection.startOffset,
            endOffset: highlightSelection.endOffset,
            createdAt: new Date().toISOString(),
        };

        const id = await addHighlight(hl);
        addHighlightToState({ ...hl, id });
        hideHighlightPopup();
        window.getSelection()?.removeAllRanges();
    };

    const style: React.CSSProperties = {
        position: 'fixed',
        left: Math.min(Math.max(highlightSelection.x - 80, 16), window.innerWidth - 176),
        top: Math.min(highlightSelection.y, window.innerHeight - 60),
        zIndex: 60,
    };

    return (
        <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl animate-fade-in"
            style={{
                ...style,
                backgroundColor: 'var(--ag-card)',
                border: '1px solid var(--ag-border)',
                boxShadow: 'var(--ag-shadow-lg)',
            }}
        >
            {COLORS.map((c) => (
                <button
                    key={c.id}
                    onClick={() => handleColorSelect(c.id)}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-125"
                    style={{ backgroundColor: c.bg }}
                    title={c.label}
                />
            ))}
            <button
                onClick={hideHighlightPopup}
                className="ml-1 p-1 rounded hover:opacity-80"
                style={{ color: 'var(--ag-text-muted)' }}
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

export function getHighlightBgColor(color: HighlightColor): string {
    const map: Record<HighlightColor, string> = {
        yellow: 'rgba(254, 240, 138, 0.5)',
        green: 'rgba(187, 247, 208, 0.5)',
        blue: 'rgba(191, 219, 254, 0.5)',
        pink: 'rgba(251, 207, 232, 0.5)',
    };
    return map[color];
}
