'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';
import { parsePDF } from '@/lib/pdfParser';
import { generateFileHash, saveParsedBook, saveProgress, getPreferences } from '@/lib/storage';
import { themes, applyTheme } from '@/lib/themes';
import type { ThemeId } from '@/lib/themes';

export default function UploadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('light');

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
        // Generate hash for this file
        const hash = await generateFileHash(file);

        // Parse PDF
        const result = await parsePDF(file, (current, total) => {
          setProgress({ current, total });
        });

        // Store parsed data in IndexedDB
        await saveParsedBook({
          fileHash: hash,
          fileName: file.name,
          pages: result.pages,
          structuredPages: result.structuredPages,
          totalPages: result.totalPages,
          wordCount: result.wordCount,
        });

        // Initialize reading progress
        await saveProgress({
          fileHash: hash,
          fileName: file.name,
          currentPage: 1,
          totalPages: result.totalPages,
          percent: 0,
          lastReadAt: new Date().toISOString(),
          wordCount: result.wordCount,
        });

        // Navigate to reader
        router.push(`/reader?id=${hash}`);
      } catch (error) {
        console.error('Failed to parse PDF:', error);
        setIsLoading(false);
        setProgress(null);
        setFileName(null);
        alert('Failed to parse PDF. Please try a different file.');
      }
    },
    [router]
  );

  const handleThemeSwitch = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--ag-bg)' }}>
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
        style={{ backgroundColor: 'var(--ag-orb3)', top: '30%', right: '20%' }}
      />

      {/* Main content card */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* App header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">🚀</span>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--ag-text)' }}>
              Anti Gravity
            </h1>
          </div>
          <p className="text-base" style={{ color: 'var(--ag-text-muted)' }}>
            The reading experience that defies everything you know
          </p>
        </div>

        {/* Upload card */}
        <div
          className="rounded-2xl p-1 animate-fade-in"
          style={{
            backgroundColor: 'var(--ag-card)',
            boxShadow: 'var(--ag-shadow-lg)',
            animationDelay: '0.2s',
          }}
        >
          <UploadZone
            onFileSelected={handleFileSelected}
            isLoading={isLoading}
            progress={progress}
            fileName={fileName}
          />
        </div>

        {/* Feature hints */}
        <div className="mt-8 grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {[
            { icon: '📖', label: 'Reflow text' },
            { icon: '🎨', label: '4 themes' },
            { icon: '📚', label: 'Flashcards' },
          ].map((feature) => (
            <div
              key={feature.label}
              className="text-center py-3 rounded-xl"
              style={{ backgroundColor: 'var(--ag-card)' }}
            >
              <span className="text-xl block mb-1">{feature.icon}</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--ag-text-muted)' }}>
                {feature.label}
              </span>
            </div>
          ))}
        </div>

        {/* Navigation links */}
        <div className="text-center mt-6 flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <a href="/library" className="text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: 'var(--ag-accent)' }}>📚 Library →</a>
          <span style={{ color: 'var(--ag-text-muted)' }}>·</span>
          <a href="/vocabulary" className="text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: 'var(--ag-accent)' }}>📝 Vocabulary →</a>
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
