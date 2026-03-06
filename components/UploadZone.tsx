'use client';

import { useCallback, useState, useRef } from 'react';

interface UploadZoneProps {
    onFileSelected: (file: File) => void;
    isLoading: boolean;
    progress: { current: number; total: number } | null;
    fileName: string | null;
}

export default function UploadZone({ onFileSelected, isLoading, progress, fileName }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                onFileSelected(file);
            }
        },
        [onFileSelected]
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                onFileSelected(file);
            }
        },
        [onFileSelected]
    );

    const progressPercent = progress ? Math.round((progress.current / progress.total) * 100) : 0;

    return (
        <div
            className={`upload-zone relative rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'dragging scale-[1.02]' : ''
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                }
            }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
            />

            {isLoading ? (
                <div className="animate-fade-in">
                    {/* File name */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium truncate max-w-[280px]" style={{ color: 'var(--ag-text)' }}>
                            {fileName}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full max-w-xs mx-auto">
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ag-border)' }}>
                            <div
                                className="h-full rounded-full transition-all duration-300 ease-out"
                                style={{
                                    width: `${progressPercent}%`,
                                    background: 'var(--ag-progress)',
                                }}
                            />
                        </div>
                        <p className="text-xs mt-3" style={{ color: 'var(--ag-text-muted)' }}>
                            {progress
                                ? `Parsing page ${progress.current} of ${progress.total}`
                                : 'Preparing...'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    {/* Upload icon */}
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                        style={{ backgroundColor: 'var(--ag-accent-soft)' }}
                    >
                        <svg
                            className="w-8 h-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            style={{ color: 'var(--ag-accent)' }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                            />
                        </svg>
                    </div>

                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--ag-text)' }}>
                        Drop your PDF here
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--ag-text-muted)' }}>
                        or click to browse • PDF files only
                    </p>
                </div>
            )}
        </div>
    );
}
