import { useState } from 'react';
import type { ChildProfile } from '../types';

const STORAGE_KEY = 'edugame-profile';

export function loadProfile(): ChildProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChildProfile) : null;
  } catch {
    return null;
  }
}

function saveProfile(profile: ChildProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

interface OnboardingScreenProps {
  onComplete: (profile: ChildProfile) => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl' | null>(null);

  const canStart = name.trim().length > 0 && gender !== null;

  const handleStart = () => {
    if (!canStart) return;
    const profile: ChildProfile = { name: name.trim(), gender: gender! };
    saveProfile(profile);
    onComplete(profile);
  };

  return (
    <div className="page page-onboarding">
      <div className="ob-mascot">🦊</div>
      <h1 className="ob-title">Bienvenue !</h1>

      <label className="ob-label">Comment tu t'appelles ?</label>
      <input
        className="ob-input"
        type="text"
        placeholder="Ton prénom…"
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={20}
        autoComplete="off"
      />

      <label className="ob-label">Tu es…</label>
      <div className="ob-gender-row">
        <button
          className={`ob-gender-btn ${gender === 'boy' ? 'ob-selected' : ''}`}
          onClick={() => setGender('boy')}
        >
          <span className="ob-gender-icon">👦</span>
          <span>Un garçon</span>
        </button>
        <button
          className={`ob-gender-btn ${gender === 'girl' ? 'ob-selected' : ''}`}
          onClick={() => setGender('girl')}
        >
          <span className="ob-gender-icon">👧</span>
          <span>Une fille</span>
        </button>
      </div>

      <button
        className={`ob-start-btn ${canStart ? 'ob-start-ready' : ''}`}
        disabled={!canStart}
        onClick={handleStart}
      >
        C'est parti ! 🚀
      </button>
    </div>
  );
}
