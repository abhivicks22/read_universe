'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';
import { parsePDF } from '@/lib/pdfParser';
import { parseEPUB } from '@/lib/epubParser';
import { generateFileHash, saveParsedBook, saveProgress, getPreferences, saveRawFile } from '@/lib/storage';
import { pushSync } from '@/lib/syncEngine';
import { themes, applyTheme } from '@/lib/themes';
import type { ThemeId } from '@/lib/themes';
import { exportAllData, importAllData } from '@/lib/dataExport';
import { useUser } from '@/hooks/useUser';

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
  const { user, loading: authLoading, signInWithGoogle, signOut } = useUser();

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

        // Store the raw file specifically so the Cloud Sync Engine has the bytes to upload
        await saveRawFile(hash, file);

        // Automatically trigger a background push to the cloud sync engine
        pushSync().catch(err => console.error('Auto-sync failed:', err));

        router.push(`/reader?id=${hash}`);
      } catch (error: any) {
        console.error('Failed to parse file:', error);
        setIsLoading(false);
        setProgress(null);
        setFileName(null);
        alert(`Failed to parse file: ${error.message || String(error)}`);
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

        {/* Auth & Upload Card */}
        <div className="max-w-lg mx-auto mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>

          {/* Auth Status Bar */}
          <div className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--ag-card)', border: '1px solid var(--ag-border)' }}>
            {!authLoading && user ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-indigo-500">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <div className="text-sm">
                    <span className="block font-medium" style={{ color: 'var(--ag-text)' }}>Account Sync Active</span>
                    <span className="block text-xs" style={{ color: 'var(--ag-text-muted)' }}>{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--ag-bg)', color: 'var(--ag-text)' }}
                >
                  Sign Out
                </button>
              </>
            ) : !authLoading ? (
              <div className="w-full flex items-center justify-between">
                <div className="text-sm">
                  <span className="block font-medium" style={{ color: 'var(--ag-text)' }}>Cloud Sync Off</span>
                  <span className="block text-[11px]" style={{ color: 'var(--ag-text-muted)' }}>Sign in to sync across devices</span>
                </div>
                <button
                  onClick={signInWithGoogle}
                  className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-transform hover:scale-105"
                  style={{ backgroundColor: 'white', color: 'black', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            ) : (
              <div className="h-10 w-full animate-pulse bg-current opacity-10 rounded" />
            )}
          </div>

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
