'use client';

/**
 * Text-to-Speech wrapper using the browser's built-in SpeechSynthesis API.
 * $0 cost — works fully offline.
 */

let utterance: SpeechSynthesisUtterance | null = null;
let onEndCallback: (() => void) | null = null;

export function isTTSSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getVoices(): SpeechSynthesisVoice[] {
    if (!isTTSSupported()) return [];
    return speechSynthesis.getVoices();
}

export function getPreferredVoice(): SpeechSynthesisVoice | null {
    const voices = getVoices();
    // Prefer English voices
    const english = voices.filter((v) => v.lang.startsWith('en'));
    // Prefer natural/premium voices
    const premium = english.find((v) => v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Enhanced'));
    return premium || english[0] || voices[0] || null;
}

export function speak(
    text: string,
    options?: {
        rate?: number; // 0.5 to 2.0 (default 1.0)
        pitch?: number; // 0 to 2 (default 1.0)
        voice?: SpeechSynthesisVoice;
        onEnd?: () => void;
        onBoundary?: (charIndex: number) => void;
    }
): void {
    if (!isTTSSupported()) return;

    // Stop any existing speech
    stop();

    utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;

    const voice = options?.voice || getPreferredVoice();
    if (voice) utterance.voice = voice;

    onEndCallback = options?.onEnd || null;
    utterance.onend = () => {
        onEndCallback?.();
        utterance = null;
    };

    if (options?.onBoundary) {
        utterance.onboundary = (e) => {
            options.onBoundary?.(e.charIndex);
        };
    }

    speechSynthesis.speak(utterance);
}

export function pause(): void {
    if (isTTSSupported() && speechSynthesis.speaking) {
        speechSynthesis.pause();
    }
}

export function resume(): void {
    if (isTTSSupported() && speechSynthesis.paused) {
        speechSynthesis.resume();
    }
}

export function stop(): void {
    if (isTTSSupported()) {
        speechSynthesis.cancel();
        utterance = null;
        onEndCallback = null;
    }
}

export function isSpeaking(): boolean {
    return isTTSSupported() && speechSynthesis.speaking;
}

export function isPaused(): boolean {
    return isTTSSupported() && speechSynthesis.paused;
}
