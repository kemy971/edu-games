import { useState, useMemo } from 'react';
import { ALPHABET_DATA, pickLetterVariant } from '../data/alphabet';
import { useSpeech } from '../hooks/useSpeech';
import BackButton from './BackButton';
import type { LetterData } from '../types';

interface AlphabetScreenProps {
  onBack: () => void;
}

export default function AlphabetScreen({ onBack }: AlphabetScreenProps) {
  const { speak, cancel } = useSpeech();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const resolvedLetters = useMemo(
    () => ALPHABET_DATA.map(l => ({ ...l, ...pickLetterVariant(l) })),
    []
  );

  const handleClick = (letter: LetterData) => {
    cancel();
    setActiveKey(letter.key);
    speak(`${letter.key} comme ${letter.word}`, () => setActiveKey(null));
  };

  return (
    <div className="page page-scroll">
      <header className="screen-header">
        <BackButton onBack={onBack} />
        <h2>L'Alphabet</h2>
        <div className="header-spacer" />
      </header>
      <div className="alphabet-grid">
        {resolvedLetters.map(letter => (
          <div
            key={letter.key}
            className={`card ${activeKey === letter.key ? 'bounce speaking' : ''}`}
            onClick={() => handleClick(letter)}
          >
            <span className="card-letter">{letter.key}</span>
            <span className="card-emoji">{letter.emoji}</span>
            <span className="card-word">
              <span className="card-word-first">{letter.word[0]}</span>
              {letter.word.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
