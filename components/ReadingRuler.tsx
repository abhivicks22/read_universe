'use client';

import { useReaderStore } from '@/stores/readerStore';

export default function ReadingRuler() {
    const { readingRuler } = useReaderStore();

    if (!readingRuler) return null;

    return (
        <div
            className="fixed left-0 right-0 pointer-events-none z-20"
            style={{ top: '45%' }}
        >
            {/* Dim above */}
            <div
                className="absolute left-0 right-0 bottom-full"
                style={{ height: '40vh', backgroundColor: 'rgba(0,0,0,0.08)' }}
            />
            {/* Focus line */}
            <div
                className="h-8"
                style={{ backgroundColor: 'transparent', borderTop: '2px solid var(--ag-accent)', borderBottom: '2px solid var(--ag-accent)', opacity: 0.3 }}
            />
            {/* Dim below */}
            <div
                className="absolute left-0 right-0 top-full"
                style={{ height: '40vh', backgroundColor: 'rgba(0,0,0,0.08)' }}
            />
        </div>
    );
}
