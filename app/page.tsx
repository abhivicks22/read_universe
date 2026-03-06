'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';
import { parsePDF } from '@/lib/pdfParser';
import { parseEPUB } from '@/lib/epubParser';
import { generateFileHash, saveParsedBook, saveProgress, getPreferences } from '@/lib/storage';
import { themes, applyTheme } from '@/lib/themes';
import type { ThemeId } from '@/lib/themes';
import { exportAllData, importAllData } from '@/lib/dataExport';

const FEATURES = [
  { icon: '📖', title: 'Reflow Text', desc: 'Book-quality rendering with smart paragraph detection' },
  { icon: '🎨', title: '4 Themes', desc: 'Light, dark, sepia, and midnight reading modes' },
  { icon: '📚', title: 'Library', desc: 'Manage multiple books with progress tracking' },
  { icon: '🧠', title: 'AI Entities', desc: 'Auto-detect people, places & organizations' },
  { icon: '🌍', title: 'Translate', desc: 'Translate selected text into 11 languages' },
  { icon: '📝', title: 'Annotations', desc: 'Highlights, notes, and bookmarks' },
  { icon: '🗣️', title: 'Read Aloud', desc: 'Text-to-speech with speed control' },
  { icon: '📇', title: 'Flashcards', desc: 'Build vocabulary with spaced learning' },
  { icon: '📱', title: 'Installable', desc: 'Add to home screen — works offline' },
];

export default function UploadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('light');
  const [importing, setImporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  // Initialize theme
  useEffect(() => {
    const init = async () => {
      const prefs = await getPreferences();
      setCurrentTheme(prefs.theme);
      applyTheme(prefs.theme);
    };
    init();
  }, []);

  const handleFileSelected = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setFileName(file.name);
      setProgress({ current: 0, total: 1 });

      try {
        const hash = await generateFileHash(file);

        // Detect format and parse
        const isEpub = file.name.toLowerCase().endsWith('.epub');
        const result = isEpub
          ? await parseEPUB(file, (current, total) => setProgress({ current, total }))
          : await parsePDF(file, (current, total) => setProgress({ current, total }));

        await saveParsedBook({
          fileHash: hash,
          fileName: file.name,
          pages: result.pages,
          structuredPages: result.structuredPages,
          totalPages: result.totalPages,
          wordCount: result.wordCount,
        });

        await saveProgress({
          fileHash: hash,
          fileName: file.name,
          currentPage: 1,
          totalPages: result.totalPages,
          percent: 0,
          lastReadAt: new Date().toISOString(),
          wordCount: result.wordCount,
        });

        router.push(`/reader?id=${hash}`);
      } catch (error) {
        console.error('Failed to parse file:', error);
        setIsLoading(false);
        setProgress(null);
        setFileName(null);
        alert('Failed to parse file. Please try a different file.');
      }
    },
    [router]
  );

  const handleThemeSwitch = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const result = await importAllData(file);
      alert(`Imported ${result.imported} items successfully!`);
    } catch (err) {
      alert('Failed to import backup file.');
    }
    setImporting(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: 'var(--ag-bg)' }}>
      {/* Floating gradient orbs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl animate-float"
        style={{ backgroundColor: 'var(--ag-orb1)', top: '-10%', left: '-10%' }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl animate-float-reverse"
        style={{ backgroundColor: 'var(--ag-orb2)', bottom: '-15%', right: '-5%' }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full blur-3xl animate-float-slow"
        style={{ backgroundColor: 'var(--ag-orb3)', top: '50%', right: '25%' }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:py-16">

        {/* Hero */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl">🚀</span>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight" style={{ color: 'var(--ag-text)' }}>
              Universe Read
            </h1>
          </div>
          <p className="text-xl sm:text-2xl font-light max-w-xl mx-auto" style={{ color: 'var(--ag-text-muted)' }}>
            The reading experience that defies everything you know
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: 'var(--ag-accent-soft)', color: 'var(--ag-accent)' }}
            >
              ✦ 100% Free
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: 'var(--ag-accent-soft)', color: 'var(--ag-accent)' }}
            >
              🔒 No Sign-Up
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: 'var(--ag-accent-soft)', color: 'var(--ag-accent)' }}
            >
              📱 Installable
            </span>
          </div>
        </div>

        {/* Upload Card */}
        <div className="max-w-lg mx-auto mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div
            className="rounded-2xl p-1"
            style={{
              backgroundColor: 'var(--ag-card)',
              boxShadow: 'var(--ag-shadow-lg)',
            }}
          >
            <UploadZone
              onFileSelected={handleFileSelected}
              isLoading={isLoading}
              progress={progress}
              fileName={fileName}
            />
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-center text-sm uppercase tracking-widest font-semibold mb-8" style={{ color: 'var(--ag-text-muted)' }}>
            Everything you need to read better
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="text-center p-4 sm:p-5 rounded-xl transition-transform hover:scale-[1.03]"
                style={{ backgroundColor: 'var(--ag-card)' }}
              >
                <span className="text-2xl block mb-2">{f.icon}</span>
                <span className="text-xs sm:text-sm font-semibold block" style={{ color: 'var(--ag-text)' }}>
                  {f.title}
                </span>
                <span className="text-[10px] sm:text-xs block mt-1" style={{ color: 'var(--ag-text-muted)' }}>
                  {f.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="text-center flex flex-wrap items-center justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <a href="/library" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80" style={{ backgroundColor: 'var(--ag-card)', color: 'var(--ag-text)' }}>
            📚 Library
          </a>
          <a href="/vocabulary" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80" style={{ backgroundColor: 'var(--ag-card)', color: 'var(--ag-text)' }}>
            📝 Vocabulary
          </a>
          <button onClick={exportAllData} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80" style={{ backgroundColor: 'var(--ag-card)', color: 'var(--ag-text)' }}>
            💾 Export Data
          </button>
          <button onClick={() => importRef.current?.click()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80" style={{ backgroundColor: 'var(--ag-card)', color: 'var(--ag-text)' }}>
            {importing ? '⏳' : '📥'} Import
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>

        {/* Footer */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-[11px]" style={{ color: 'var(--ag-text-muted)' }}>
            Your data stays on your device • No servers • No tracking • Open source
          </p>
        </div>
      </div>

      {/* Theme selector dots */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => handleThemeSwitch(t.id)}
            className="group relative"
            title={t.name}
          >
            <div
              className={`w-4 h-4 rounded-full border-2 transition-all ${currentTheme === t.id ? 'scale-125' : 'hover:scale-110'
                }`}
              style={{
                backgroundColor: t.previewColors.bg,
                borderColor: currentTheme === t.id ? t.previewColors.accent : t.previewColors.bg,
                boxShadow: currentTheme === t.id ? `0 0 8px ${t.previewColors.accent}40` : 'none',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
