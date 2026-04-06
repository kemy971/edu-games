import { useState, useRef, useCallback, useEffect } from 'react';
import { ALPHABET_DATA } from '../data/alphabet';
import { NUMBERS_DATA } from '../data/numbers';
import { shuffleArray } from '../data/quiz';
import BackButton from './BackButton';
import { useSpeech } from '../hooks/useSpeech';

type MatchMode = 'letters' | 'numbers';

interface MatchItem {
  id: string;
  leftLabel: string;
  rightLabel: string;
  rightEmoji: string;
}

interface LineData {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
  correct: boolean;
}

function buildItems(mode: MatchMode): { items: MatchItem[]; rightOrder: number[] } {
  let items: MatchItem[];
  if (mode === 'letters') {
    items = shuffleArray([...ALPHABET_DATA]).slice(0, 3).map(l => ({
      id: l.key,
      leftLabel: l.key,
      rightLabel: l.word,
      rightEmoji: l.emoji,
    }));
  } else {
    items = shuffleArray([...NUMBERS_DATA]).slice(0, 3).map(n => ({
      id: n.key,
      leftLabel: String(n.digit),
      rightLabel: n.name,
      rightEmoji: n.emoji,
    }));
  }
  return { items, rightOrder: shuffleArray([0, 1, 2]) };
}

interface Props {
  onBack: () => void;
}

export default function MatchingScreen({ onBack }: Props) {
  const [mode, setMode] = useState<MatchMode | null>(null);
  const [items, setItems] = useState<MatchItem[]>([]);
  const [rightOrder, setRightOrder] = useState<number[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matchedLeft, setMatchedLeft] = useState<Set<number>>(new Set());
  const [matchedRight, setMatchedRight] = useState<Set<number>>(new Set());
  const [lines, setLines] = useState<LineData[]>([]);
  const [wrongRight, setWrongRight] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { speak, cancel } = useSpeech();
  useEffect(() => () => cancel(), [cancel]);

  const initRound = useCallback((m: MatchMode) => {
    const { items: newItems, rightOrder: newOrder } = buildItems(m);
    setItems(newItems);
    setRightOrder(newOrder);
    setSelectedLeft(null);
    setMatchedLeft(new Set());
    setMatchedRight(new Set());
    setLines([]);
    setWrongRight(null);
    setDone(false);
    leftRefs.current = [null, null, null];
    rightRefs.current = [null, null, null];
  }, []);

  const handleModeSelect = (m: MatchMode) => {
    setMode(m);
    initRound(m);
  };

  function getCenter(el: HTMLElement): { x: number; y: number } {
    const cRect = containerRef.current!.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    return {
      x: eRect.left + eRect.width / 2 - cRect.left,
      y: eRect.top + eRect.height / 2 - cRect.top,
    };
  }

  const handleLeftClick = (idx: number) => {
    if (matchedLeft.has(idx)) return;
    setSelectedLeft(prev => (prev === idx ? null : idx));
  };

  const handleRightClick = (displayIdx: number) => {
    if (selectedLeft === null) return;
    if (matchedRight.has(displayIdx)) return;

    const leftEl = leftRefs.current[selectedLeft];
    const rightEl = rightRefs.current[displayIdx];
    if (!leftEl || !rightEl || !containerRef.current) return;

    const lc = getCenter(leftEl);
    const rc = getCenter(rightEl);
    const correct = rightOrder[displayIdx] === selectedLeft;
    const lineId = `${selectedLeft}-${displayIdx}-${Date.now()}`;

    if (correct) {
      const newMatchedLeft = new Set([...matchedLeft, selectedLeft]);
      const newMatchedRight = new Set([...matchedRight, displayIdx]);
      setLines(prev => [...prev, { id: lineId, x1: lc.x, y1: lc.y, x2: rc.x, y2: rc.y, correct: true }]);
      setMatchedLeft(newMatchedLeft);
      setMatchedRight(newMatchedRight);
      setSelectedLeft(null);
      speak(items[selectedLeft].rightLabel);
      if (newMatchedLeft.size === items.length) {
        setTimeout(() => setDone(true), 700);
      }
    } else {
      setLines(prev => [...prev, { id: lineId, x1: lc.x, y1: lc.y, x2: rc.x, y2: rc.y, correct: false }]);
      setWrongRight(displayIdx);
      setTimeout(() => {
        setLines(prev => prev.filter(l => l.id !== lineId));
        setWrongRight(null);
        setSelectedLeft(null);
      }, 700);
    }
  };

  if (!mode) {
    return (
      <div className="page page-matching">
        <BackButton onBack={onBack} />
        <div className="matching-mode-select">
          <div className="matching-title-emoji">🔗</div>
          <h1 className="matching-h1">Relier</h1>
          <p className="matching-subtitle">Relie les lettres ou les chiffres à leur nom !</p>
          <div className="matching-mode-btns">
            <button className="activity-btn btn-blue" onClick={() => handleModeSelect('letters')}>
              <span className="act-icon">🔤</span>
              <span>Lettres</span>
            </button>
            <button className="activity-btn btn-green" onClick={() => handleModeSelect('numbers')}>
              <span className="act-icon">🔢</span>
              <span>Chiffres</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="page page-matching">
        <div className="matching-done">
          <div className="matching-done-star">⭐</div>
          <h2 className="matching-done-title">Bravo !</h2>
          <p className="matching-done-sub">Tu as tout relié !</p>
          <div className="matching-done-btns">
            <button className="activity-btn btn-green" onClick={() => initRound(mode)}>
              <span className="act-icon">🔄</span>
              <span>Encore</span>
            </button>
            <button className="activity-btn btn-blue" onClick={() => setMode(null)}>
              <span className="act-icon">↩️</span>
              <span>Changer</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-matching">
      <BackButton onBack={onBack} />
      <p className="matching-instruction">
        {mode === 'letters' ? 'Relie chaque lettre à son mot !' : 'Relie chaque chiffre à son nom !'}
      </p>
      <div className="matching-play-area" ref={containerRef}>
        <svg className="matching-svg" aria-hidden="true">
          {lines.map(line => (
            <line
              key={line.id}
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              stroke={line.correct ? '#6BCB77' : '#FF6B6B'}
              strokeWidth={8}
              strokeLinecap="round"
            />
          ))}
        </svg>

        <div className="matching-columns">
          <div className="matching-col">
            {items.map((item, idx) => (
              <button
                key={item.id}
                ref={el => { leftRefs.current[idx] = el; }}
                className={[
                  'matching-item-btn',
                  'matching-left-btn',
                  selectedLeft === idx ? 'selected' : '',
                  matchedLeft.has(idx) ? 'matched' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleLeftClick(idx)}
              >
                <span className="matching-left-char">{item.leftLabel}</span>
              </button>
            ))}
          </div>

          <div className="matching-col">
            {rightOrder.map((itemIdx, displayIdx) => {
              const item = items[itemIdx];
              return (
                <button
                  key={item.id + '-r'}
                  ref={el => { rightRefs.current[displayIdx] = el; }}
                  className={[
                    'matching-item-btn',
                    'matching-right-btn',
                    matchedRight.has(displayIdx) ? 'matched' : '',
                    wrongRight === displayIdx ? 'wrong' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleRightClick(displayIdx)}
                >
                  <span className="matching-right-emoji">{item.rightEmoji}</span>
                  <span className="matching-right-word">{item.rightLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
