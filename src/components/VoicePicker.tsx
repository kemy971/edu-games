import { useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { useVoiceName } from '../context/VoiceContext';

export default function VoicePicker() {
  const { frenchVoices, cancel } = useSpeech();
  const { voiceName, setVoiceName } = useVoiceName();
  const [open, setOpen] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);

  if (frenchVoices.length <= 1) return null;

  const handlePreview = (voice: SpeechSynthesisVoice) => {
    cancel();
    setPreviewing(voice.name);
    const utt = new SpeechSynthesisUtterance('Bonjour, je lis les lettres et les chiffres !');
    utt.voice = voice;
    utt.lang = 'fr-FR';
    utt.rate = 0.82;
    utt.pitch = 1.1;
    utt.volume = 1.0;
    utt.onend = () => setPreviewing(null);
    utt.onerror = () => setPreviewing(null);
    window.speechSynthesis.speak(utt);
  };

  const handleSelect = (voice: SpeechSynthesisVoice) => {
    setVoiceName(voice.name);
    cancel();
    setOpen(false);
  };

  return (
    <div className="voice-picker-wrapper">
      <button
        className="voice-picker-btn"
        onClick={() => setOpen(o => !o)}
        title="Choisir la voix"
      >
        🔊
      </button>
      {open && (
        <div className="voice-picker-panel">
          <p className="voice-picker-label">Choisis une voix</p>
          <div className="voice-picker-list">
            {frenchVoices.map(voice => (
              <button
                key={voice.name}
                className={[
                  'voice-option',
                  voice.name === voiceName ? 'voice-option-selected' : '',
                  previewing === voice.name ? 'voice-option-previewing' : '',
                ].join(' ').trim()}
                onClick={() => handlePreview(voice)}
                onDoubleClick={() => handleSelect(voice)}
              >
                <span className="voice-option-name">{voice.name}</span>
                <span className="voice-option-actions">
                  {previewing === voice.name ? '▶ …' : '▶'}
                  {voice.name === voiceName && ' ✓'}
                </span>
              </button>
            ))}
          </div>
          <p className="voice-picker-hint">Clique pour écouter · Double-clique pour choisir</p>
        </div>
      )}
    </div>
  );
}
