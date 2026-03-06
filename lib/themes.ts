export type ThemeId = 'light' | 'dark' | 'sepia' | 'midnight';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  emoji: string;
  previewColors: {
    bg: string;
    text: string;
    accent: string;
  };
}

export const themes: ThemeDefinition[] = [
  {
    id: 'light',
    name: 'Light',
    emoji: '☀️',
    previewColors: { bg: '#FAFAF9', text: '#1C1917', accent: '#7C3AED' },
  },
  {
    id: 'dark',
    name: 'Dark',
    emoji: '🌙',
    previewColors: { bg: '#0F0F0F', text: '#FAFAF9', accent: '#A78BFA' },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    emoji: '📜',
    previewColors: { bg: '#F5E6D3', text: '#3E2723', accent: '#8D6E63' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌌',
    previewColors: { bg: '#0B1426', text: '#CBD5E1', accent: '#38BDF8' },
  },
];

export const readingFonts = [
  { name: 'Literata', family: "'Literata', serif", category: 'serif' },
  { name: 'Merriweather', family: "'Merriweather', serif", category: 'serif' },
  { name: 'Lora', family: "'Lora', serif", category: 'serif' },
  { name: 'Source Serif 4', family: "'Source Serif 4', serif", category: 'serif' },
  { name: 'IBM Plex Sans', family: "'IBM Plex Sans', sans-serif", category: 'sans' },
  { name: 'Nunito', family: "'Nunito', sans-serif", category: 'sans' },
  { name: 'Atkinson Hyperlegible', family: "'Atkinson Hyperlegible', sans-serif", category: 'accessibility' },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", category: 'mono' },
];

export function applyTheme(themeId: ThemeId): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', themeId);
  }
}

export function getSystemTheme(): ThemeId {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}
