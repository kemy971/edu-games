import { useCallback, useEffect, useRef } from 'react';

export function useSpeech() {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current = voices.find(v => v.lang.startsWith('fr')) ?? null;
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.82;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    if (voiceRef.current) utterance.voice = voiceRef.current;

    // Chrome bug workaround: speech can cut out on long sentences
    const resumeHack = setInterval(() => {
      if (!window.speechSynthesis.speaking) { clearInterval(resumeHack); return; }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 5000);

    const cleanup = () => {
      clearInterval(resumeHack);
      onEnd?.();
    };
    utterance.onend = cleanup;
    utterance.onerror = cleanup;

    window.speechSynthesis.speak(utterance);
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, cancel };
}
