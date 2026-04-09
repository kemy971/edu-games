import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'edugame-voice';

interface VoiceContextValue {
  voiceName: string | null;
  setVoiceName: (name: string | null) => void;
}

const VoiceContext = createContext<VoiceContextValue>({ voiceName: null, setVoiceName: () => {} });

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [voiceName, setVoiceNameState] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });

  const setVoiceName = (name: string | null) => {
    try {
      if (name) localStorage.setItem(STORAGE_KEY, name);
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
    setVoiceNameState(name);
  };

  return <VoiceContext.Provider value={{ voiceName, setVoiceName }}>{children}</VoiceContext.Provider>;
}

export function useVoiceName() { return useContext(VoiceContext); }
