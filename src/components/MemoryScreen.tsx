import { useState, useCallback, useEffect } from 'react';
import { ALPHABET_DATA } from '../data/alphabet';
import { NUMBERS_DATA } from '../data/numbers';
import { shuffleArray } from '../data/quiz';
import { useSpeech } from '../hooks/useSpeech';
import BackButton from './BackButton';
import Confetti from './Confetti';

type MemoryMode = 'letters' | 'numbers';

interface MemCard {
  id: string;
  pairId: string;
  mainDisplay: string;
  subDisplay?: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function buildLetterCards(): MemCard[] {
  const selected = shuffleArray([...ALPHABET_DATA]).slice(0, 6);
  const cards: MemCard[] = [];
  selected.forEach(letter => {
    cards.push({ id: `${letter.key}-L`, pairId: letter.key, mainDisplay: letter.key, isFlipped: false, isMatched: false });
    cards.push({ id: `${letter.key}-I`, pairId: letter.key, mainDisplay: letter.emoji, subDisplay: letter.word, isFlipped: false, isMatched: false });
  });
  return shuffleArray(cards);
}

function buildNumberCards(): MemCard[] {
  const selected = shuffleArray([...NUMBERS_DATA]).slice(0, 6);
  const cards: MemCard[] = [];
  selected.forEach(num => {
    cards.push({ id: `${num.key}-D`, pairId: num.key, mainDisplay: String(num.digit), subDisplay: num.name, isFlipped: false, isMatched: false });
    cards.push({ id: `${num.key}-E`, pairId: num.key, mainDisplay: Array(num.digit).fill(num.emoji).join(''), isFlipped: false, isMatched: false });
  });
  return shuffleArray(cards);
}

interface MemoryScreenProps {
  onBack: () => void;
}

export default function MemoryScreen({ onBack }: MemoryScreenProps) {
  const [mode, setMode] = useState<MemoryMode>('letters');
  const [cards, setCards] = useState<MemCard[]>(buildLetterCards);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [moves, setMoves] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const { speak } = useSpeech();

  const allMatched = cards.length > 0 && cards.every(c => c.isMatched);

  const startGame = useCallback((m: MemoryMode) => {
    setMode(m);
    setCards(m === 'letters' ? buildLetterCards() : buildNumberCards());
    setFlippedIds([]);
    setIsChecking(false);
    setMoves(0);
    setShowConfetti(false);
  }, []);

  const handleCardClick = useCallback((card: MemCard) => {
    if (card.isFlipped || card.isMatched || isChecking) return;

    const newFlipped = [...flippedIds, card.id];
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, isFlipped: true } : c));
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      setMoves(m => m + 1);

      setTimeout(() => {
        setCards(prev => {
          const c1 = prev.find(c => c.id === newFlipped[0])!;
          const c2 = prev.find(c => c.id === newFlipped[1])!;
          const isMatch = c1.pairId === c2.pairId;
          if (isMatch) speak('Bravo !');
          return prev.map(c =>
            c.id === newFlipped[0] || c.id === newFlipped[1]
              ? { ...c, isMatched: isMatch, isFlipped: isMatch }
              : c
          );
        });
        setFlippedIds([]);
        setIsChecking(false);
      }, 900);
    }
  }, [flippedIds, isChecking, speak]);

  useEffect(() => {
    if (allMatched) {
      setShowConfetti(true);
      setTimeout(() => speak(`Bravo ! Toutes les paires trouvées en ${moves} essais !`), 300);
    }
  }, [allMatched]); // eslint-disable-line react-hooks/exhaustive-deps

  const matched = cards.filter(c => c.isMatched).length / 2;
  const total = cards.length / 2;

  return (
    <div className="page page-scroll">
      <header className="screen-header">
        <BackButton onBack={onBack} />
        <h2>Mémoire</h2>
        <div className="score-display">{matched}/{total} 🃏</div>
      </header>

      <div className="tab-row">
        <button className={`tab-btn ${mode === 'letters' ? 'active' : ''}`} onClick={() => startGame('letters')}>🔤 Lettres</button>
        <button className={`tab-btn ${mode === 'numbers' ? 'active' : ''}`} onClick={() => startGame('numbers')}>🔢 Chiffres</button>
      </div>

      {allMatched ? (
        <div className="win-screen">
          <div className="win-emoji">🎉</div>
          <p className="win-title">Toutes les paires !</p>
          <p className="win-sub">{moves} essai{moves > 1 ? 's' : ''}</p>
          <button className="menu-btn btn-green" style={{ maxWidth: 260 }} onClick={() => startGame(mode)}>
            <span className="btn-icon">🔄</span><span>Rejouer</span>
          </button>
        </div>
      ) : (
        <div className="memory-grid">
          {cards.map(card => (
            <div
              key={card.id}
              className={`memory-card ${card.isFlipped || card.isMatched ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
              onClick={() => handleCardClick(card)}
            >
              <div className="memory-card-inner">
                <div className="memory-card-front">❓</div>
                <div className="memory-card-back">
                  <span className="mem-main">{card.mainDisplay}</span>
                  {card.subDisplay && (
                    <span className="mem-sub">
                      <span className="mem-first-letter">{card.subDisplay[0]}</span>
                      {card.subDisplay.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Confetti active={showConfetti} />
    </div>
  );
}
