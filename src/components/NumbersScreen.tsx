import { useState, useMemo } from 'react';
import { NUMBERS_DATA, FRUIT_POOL } from '../data/numbers';
import { useSpeech } from '../hooks/useSpeech';
import BackButton from './BackButton';
import type { NumberData } from '../types';

interface NumbersScreenProps {
  onBack: () => void;
}

export default function NumbersScreen({ onBack }: NumbersScreenProps) {
  const { speak, cancel } = useSpeech();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const emojis = useMemo(
    () => NUMBERS_DATA.map(() => FRUIT_POOL[Math.floor(Math.random() * FRUIT_POOL.length)]),
    []
  );

  const handleClick = (num: NumberData) => {
    cancel();
    setActiveKey(num.key);
    const countWords = NUMBERS_DATA.slice(0, num.digit).map(n => n.name).join(', ');
    speak(`${num.name}. ${countWords}.`, () => setActiveKey(null));
  };

  return (
    <div className="page page-scroll">
      <header className="screen-header">
        <BackButton onBack={onBack} />
        <h2>Les Chiffres</h2>
        <div className="header-spacer" />
      </header>
      <div className="numbers-grid">
        {NUMBERS_DATA.map((num, i) => (
          <div
            key={num.key}
            className={`card ${activeKey === num.key ? 'bounce speaking' : ''}`}
            onClick={() => handleClick(num)}
          >
            <span className="card-digit">{num.digit}</span>
            <span className="card-name">{num.name}</span>
            <div className="card-emoji-row">
              {Array.from({ length: num.digit }, (_, j) => (
                <span key={j}>{emojis[i]}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
