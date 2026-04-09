import { useCallback, useEffect, useRef, useState } from 'react';
import { useVoiceName } from '../context/VoiceContext';

export function useSpeech() {
  const { voiceName } = useVoiceName();
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const voiceNameRef = useRef(voiceName);
  const [frenchVoices, setFrenchVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    voiceNameRef.current = voiceName;
  }, [voiceName]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('fr'));
      voicesRef.current = voices;
      setFrenchVoices(voices);
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

    const resolved =
      voicesRef.current.find(v => v.name === voiceNameRef.current) ??
      voicesRef.current[0] ??
      null;
    if (resolved) utterance.voice = resolved;

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

  return { speak, cancel, frenchVoices };
}
