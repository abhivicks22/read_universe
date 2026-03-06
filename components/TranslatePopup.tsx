'use client';

import { useState, useEffect } from 'react';
import { translateText, LANGUAGES } from '@/lib/translate';

export default function TranslatePopup({
    text,
    x,
    y,
    onClose,
}: {
    text: string;
    x: number;
    y: number;
    onClose: () => void;
}) {
    const [targetLang, setTargetLang] = useState('es');
    const [translated, setTranslated] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        handleTranslate();
    }, []);

    const handleTranslate = async (lang?: string) => {
        const langCode = lang || targetLang;
        setLoading(true);
        setError('');
        const result = await translateText(text, langCode);
        setLoading(false);
        if (result.success) {
            setTranslated(result.translatedText);
        } else {
            setError(result.error || 'Translation failed');
        }
    };

    const handleLangChange = (lang: string) => {
        setTargetLang(lang);
        handleTranslate(lang);
    };

    const style: React.CSSProperties = {
        position: 'fixed',
        left: Math.min(Math.max(x - 150, 16), window.innerWidth - 316),
        top: Math.min(y, window.innerHeight - 250),
        zIndex: 60,
    };

    return (
        <>
            <div className="fixed inset-0 z-50" onClick={onClose} />
            <div
                className="w-[300px] rounded-xl animate-fade-in z-[60]"
                style={{
                    ...style,
                    backgroundColor: 'var(--ag-card)',
                    border: '1px solid var(--ag-border)',
                    boxShadow: 'var(--ag-shadow-lg)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: 'var(--ag-border)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--ag-text)' }}>🌍 Translate</span>
                    <button onClick={onClose} className="p-0.5 hover:opacity-80" style={{ color: 'var(--ag-text-muted)' }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Original text */}
                <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--ag-border)' }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--ag-text-muted)' }}>Original</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--ag-text)' }}>{text.slice(0, 200)}</p>
                </div>

                {/* Language selector */}
                <div className="px-3 py-2 border-b flex flex-wrap gap-1" style={{ borderColor: 'var(--ag-border)' }}>
                    {LANGUAGES.slice(0, 6).map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLangChange(lang.code)}
                            className="text-[10px] px-2 py-1 rounded-full transition-all"
                            style={{
                                backgroundColor: targetLang === lang.code ? 'var(--ag-accent)' : 'var(--ag-bg)',
                                color: targetLang === lang.code ? 'white' : 'var(--ag-text-muted)',
                            }}
                        >
                            {lang.flag} {lang.name}
                        </button>
                    ))}
                </div>

                {/* Translation */}
                <div className="px-3 py-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--ag-text-muted)' }}>
                        {LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang}
                    </p>
                    {loading ? (
                        <div className="flex items-center gap-2 py-2">
                            <div className="w-3 h-3 border rounded-full animate-spin" style={{ borderColor: 'var(--ag-border)', borderTopColor: 'var(--ag-accent)' }} />
                            <span className="text-xs" style={{ color: 'var(--ag-text-muted)' }}>Translating...</span>
                        </div>
                    ) : error ? (
                        <p className="text-xs" style={{ color: 'var(--ag-text-muted)' }}>{error}</p>
                    ) : (
                        <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--ag-text)' }}>{translated}</p>
                    )}
                </div>
            </div>
        </>
    );
}
