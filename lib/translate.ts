'use client';

export interface TranslateResult {
    translatedText: string;
    detectedLanguage: string;
    success: boolean;
    error?: string;
}

/**
 * Translate text using the free MyMemory API.
 * 1000 words/day free, no API key needed.
 */
export async function translateText(
    text: string,
    targetLang: string = 'es',
    sourceLang: string = 'en'
): Promise<TranslateResult> {
    try {
        const encoded = encodeURIComponent(text.slice(0, 500)); // Limit text length
        const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${sourceLang}|${targetLang}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Translation API error');

        const data = await response.json();

        if (data.responseStatus === 200 && data.responseData?.translatedText) {
            return {
                translatedText: data.responseData.translatedText,
                detectedLanguage: sourceLang,
                success: true,
            };
        }

        return {
            translatedText: '',
            detectedLanguage: '',
            success: false,
            error: 'No translation available',
        };
    } catch (error) {
        return {
            translatedText: '',
            detectedLanguage: '',
            success: false,
            error: error instanceof Error ? error.message : 'Translation failed',
        };
    }
}

export const LANGUAGES = [
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
];
