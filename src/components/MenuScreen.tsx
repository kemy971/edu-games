import { useState } from 'react';
import type { ChildProfile } from '../types';

const BG_ITEMS = [
  { char: 'A', left:  '5%', size: '3.2rem', duration: '20s', delay:  '0s'  },
  { char: '1', left: '14%', size: '2.4rem', duration: '17s', delay: '-6s'  },
  { char: 'B', left: '23%', size: '2.8rem', duration: '23s', delay: '-12s' },
  { char: '5', left: '33%', size: '2rem',   duration: '19s', delay: '-3s'  },
  { char: 'C', left: '42%', size: '3.6rem', duration: '25s', delay: '-9s'  },
  { char: '2', left: '52%', size: '2.2rem', duration: '16s', delay: '-15s' },
  { char: 'D', left: '61%', size: '3rem',   duration: '21s', delay: '-2s'  },
  { char: '8', left: '70%', size: '2.6rem', duration: '18s', delay: '-8s'  },
  { char: 'E', left: '79%', size: '2rem',   duration: '24s', delay: '-4s'  },
  { char: '3', left: '88%', size: '3.4rem', duration: '20s', delay: '-11s' },
  { char: 'Z', left: '10%', size: '2.2rem', duration: '22s', delay: '-7s'  },
  { char: '9', left: '47%', size: '2.8rem', duration: '15s', delay: '-14s' },
  { char: 'M', left: '75%', size: '2.4rem', duration: '26s', delay: '-1s'  },
  { char: '6', left: '93%', size: '2rem',   duration: '19s', delay: '-10s' },
];

const MASCOTS = ['🦊', '🐱', '🐶', '🐸', '🦁', '🐼', '🐨', '🐯', '🐧', '🦉', '🐺', '🦄', '🐻', '🐰', '🐮'];

function saveMascot(profile: ChildProfile, mascot: string) {
  try {
    localStorage.setItem('edugame-profile', JSON.stringify({ ...profile, mascot }));
  } catch { /* ignore */ }
}

interface MenuScreenProps {
  profile: ChildProfile;
  onAlphabet: () => void;
  onNumbers: () => void;
  onMemory: () => void;
  onPhonics: () => void;
  onSubitizing: () => void;
  onTracing: () => void;
  onMoreOrLess: () => void;
  onTenFrame: () => void;
}

export default function MenuScreen({
  profile,
  onAlphabet, onNumbers,
  onMemory, onPhonics, onSubitizing, onTracing: _onTracing,
  onMoreOrLess, onTenFrame,
}: MenuScreenProps) {
  const [mascot, setMascot] = useState(profile.mascot ?? '🦊');
  const [pickerOpen, setPickerOpen] = useState(false);

  const handlePickMascot = (m: string) => {
    setMascot(m);
    saveMascot(profile, m);
    setPickerOpen(false);
  };

  return (
    <div className="page page-menu">
      <div className="menu-bg" aria-hidden="true">
        {BG_ITEMS.map((item, i) => (
          <span
            key={i}
            className="menu-bg-item"
            style={{
              left: item.left,
              fontSize: item.size,
              animationDuration: item.duration,
              animationDelay: item.delay,
            }}
          >
            {item.char}
          </span>
        ))}
      </div>

      <div className="mascot-wrapper">
        <button
          className="mascot mascot-btn"
          onClick={() => setPickerOpen(o => !o)}
          title="Changer de mascotte"
        >
          {mascot}
        </button>
        {pickerOpen && (
          <div className="mascot-picker">
            <p className="mascot-picker-label">Choisis ta mascotte !</p>
            <div className="mascot-picker-grid">
              {MASCOTS.map(m => (
                <button
                  key={m}
                  className={`mascot-option ${m === mascot ? 'mascot-option-selected' : ''}`}
                  onClick={() => handlePickMascot(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <h1>Bonjour {profile.name} !</h1>
      <p className="subtitle">Apprends en t'amusant !</p>

      <div className="activity-grid">
        <button className="activity-btn btn-blue" onClick={onAlphabet}>
          <span className="act-icon">🔤</span>
          <span>L'Alphabet</span>
        </button>
        <button className="activity-btn btn-green" onClick={onNumbers}>
          <span className="act-icon">🔢</span>
          <span>Les Chiffres</span>
        </button>
        <button className="activity-btn btn-orange" onClick={onMemory}>
          <span className="act-icon">🃏</span>
          <span>Mémoire</span>
        </button>
        <button className="activity-btn btn-pink" onClick={onPhonics}>
          <span className="act-icon">🎵</span>
          <span>Phonétique</span>
        </button>
        <button className="activity-btn btn-coral" onClick={onSubitizing}>
          <span className="act-icon">⚡</span>
          <span>Combien ?</span>
        </button>
        <button className="activity-btn btn-teal" onClick={onMoreOrLess}>
          <span className="act-icon">⚖️</span>
          <span>Plus ou Moins</span>
        </button>
        <button className="activity-btn btn-yellow" onClick={onTenFrame}>
          <span className="act-icon">🔟</span>
          <span>Cadre de 10</span>
        </button>
      </div>
    </div>
  );
}
