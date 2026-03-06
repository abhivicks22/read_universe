'use client';

import { useReaderStore } from '@/stores/readerStore';

export default function ProgressBar() {
    const { currentPage, totalPages, setCurrentPage } = useReaderStore();
    const percent = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickPercent = (e.clientX - rect.left) / rect.width;
        const targetPage = Math.max(1, Math.min(totalPages, Math.round(clickPercent * totalPages)));
        setCurrentPage(targetPage);
    };

    return (
        <div
            className="h-8 flex items-center px-4 gap-3 border-t shrink-0 cursor-pointer group"
            style={{
                backgroundColor: 'var(--ag-surface)',
                borderColor: 'var(--ag-border)',
            }}
            onClick={handleClick}
            title={`${Math.round(percent)}% • Click to jump`}
        >
            {/* Progress bar */}
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ag-border)' }}>
                <div
                    className="h-full rounded-full transition-all duration-300 ease-out group-hover:h-2"
                    style={{
                        width: `${percent}%`,
                        background: 'var(--ag-progress)',
                    }}
                />
            </div>

            {/* Percentage */}
            <span className="text-[10px] font-medium w-10 text-right" style={{ color: 'var(--ag-text-muted)' }}>
                {Math.round(percent)}%
            </span>
        </div>
    );
}
