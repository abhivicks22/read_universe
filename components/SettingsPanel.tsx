'use client';

import { useReaderStore } from '@/stores/readerStore';
import { themes, readingFonts } from '@/lib/themes';
import { savePreferences } from '@/lib/storage';

export default function SettingsPanel() {
    const {
        settingsOpen,
        toggleSettings,
        theme, setTheme,
        fontFamily, setFontFamily,
        fontSize, setFontSize,
        lineHeight, setLineHeight,
        twoColumn, setTwoColumn,
        wordCount,
    } = useReaderStore();

    const estimatedMinutes = Math.ceil(wordCount / 230);

    const handleThemeChange = (themeId: typeof theme) => {
        setTheme(themeId);
        savePreferences({ theme: themeId });
        document.documentElement.setAttribute('data-theme', themeId);
    };

    const handleFontChange = (font: string) => {
        setFontFamily(font);
        savePreferences({ fontFamily: font });
    };

    const handleFontSizeChange = (size: number) => {
        setFontSize(size);
        savePreferences({ fontSize: size });
    };

    const handleLineHeightChange = (height: number) => {
        setLineHeight(height);
        savePreferences({ lineHeight: height });
    };

    const handleTwoColumnChange = (enabled: boolean) => {
        setTwoColumn(enabled);
        savePreferences({ twoColumn: enabled });
    };

    if (!settingsOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                style={{ backgroundColor: 'var(--ag-overlay)' }}
                onClick={toggleSettings}
            />

            {/* Panel */}
            <div
                className="fixed right-0 top-0 bottom-0 w-80 z-50 overflow-y-auto animate-slide-in-right"
                style={{
                    backgroundColor: 'var(--ag-surface)',
                    borderLeft: '1px solid var(--ag-border)',
                    boxShadow: 'var(--ag-shadow-lg)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--ag-border)' }}>
                    <h2 className="text-base font-semibold" style={{ color: 'var(--ag-text)' }}>
                        Settings
                    </h2>
                    <button
                        onClick={toggleSettings}
                        className="p-1.5 rounded-lg hover:opacity-80 transition-colors"
                        style={{ color: 'var(--ag-text-muted)' }}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-5 space-y-7">
                    {/* Theme */}
                    <section>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: 'var(--ag-text-muted)' }}>
                            Theme
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => handleThemeChange(t.id)}
                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                                    style={{
                                        backgroundColor: theme === t.id ? 'var(--ag-accent-soft)' : 'var(--ag-card)',
                                        outline: theme === t.id ? '2px solid var(--ag-accent)' : 'none',
                                        outlineOffset: '1px',
                                    }}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm"
                                        style={{
                                            backgroundColor: t.previewColors.bg,
                                            borderColor: t.previewColors.accent,
                                        }}
                                    >
                                        {t.emoji}
                                    </div>
                                    <span className="text-[10px] font-medium" style={{ color: 'var(--ag-text)' }}>
                                        {t.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Font Family */}
                    <section>
                        <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: 'var(--ag-text-muted)' }}>
                            Font
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {readingFonts.map((f) => (
                                <button
                                    key={f.name}
                                    onClick={() => handleFontChange(f.family)}
                                    className="text-left px-3 py-2.5 rounded-lg transition-all text-sm"
                                    style={{
                                        fontFamily: f.family,
                                        backgroundColor: fontFamily === f.family ? 'var(--ag-accent-soft)' : 'var(--ag-card)',
                                        color: 'var(--ag-text)',
                                        outline: fontFamily === f.family ? '2px solid var(--ag-accent)' : 'none',
                                        outlineOffset: '1px',
                                    }}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Font Size */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ag-text-muted)' }}>
                                Font Size
                            </label>
                            <span className="text-sm font-medium" style={{ color: 'var(--ag-accent)' }}>
                                {fontSize}px
                            </span>
                        </div>
                        <input
                            type="range"
                            min={12}
                            max={32}
                            step={1}
                            value={fontSize}
                            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                            className="w-full accent-[var(--ag-accent)]"
                        />
                        <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--ag-text-muted)' }}>
                            <span>12px</span>
                            <span>32px</span>
                        </div>
                    </section>

                    {/* Line Height */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ag-text-muted)' }}>
                                Line Height
                            </label>
                            <span className="text-sm font-medium" style={{ color: 'var(--ag-accent)' }}>
                                {lineHeight.toFixed(1)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={1.2}
                            max={2.4}
                            step={0.1}
                            value={lineHeight}
                            onChange={(e) => handleLineHeightChange(Number(e.target.value))}
                            className="w-full accent-[var(--ag-accent)]"
                        />
                        <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--ag-text-muted)' }}>
                            <span>Compact</span>
                            <span>Spacious</span>
                        </div>
                    </section>

                    {/* Two Column */}
                    <section>
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ag-text-muted)' }}>
                                    Two Column
                                </label>
                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--ag-text-muted)' }}>
                                    Auto-disabled on small screens
                                </p>
                            </div>
                            <button
                                onClick={() => handleTwoColumnChange(!twoColumn)}
                                className="relative w-11 h-6 rounded-full transition-colors duration-200"
                                style={{
                                    backgroundColor: twoColumn ? 'var(--ag-accent)' : 'var(--ag-border)',
                                }}
                            >
                                <div
                                    className="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200"
                                    style={{
                                        backgroundColor: 'white',
                                        transform: twoColumn ? 'translateX(22px)' : 'translateX(2px)',
                                    }}
                                />
                            </button>
                        </div>
                    </section>

                    {/* Reading Stats */}
                    {wordCount > 0 && (
                        <section
                            className="rounded-xl p-4"
                            style={{ backgroundColor: 'var(--ag-card)' }}
                        >
                            <label className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: 'var(--ag-text-muted)' }}>
                                Reading Stats
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xl font-bold" style={{ color: 'var(--ag-accent)' }}>
                                        {wordCount.toLocaleString()}
                                    </p>
                                    <p className="text-[10px]" style={{ color: 'var(--ag-text-muted)' }}>words</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold" style={{ color: 'var(--ag-accent)' }}>
                                        {estimatedMinutes < 60
                                            ? `${estimatedMinutes}m`
                                            : `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`}
                                    </p>
                                    <p className="text-[10px]" style={{ color: 'var(--ag-text-muted)' }}>est. reading time</p>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}
