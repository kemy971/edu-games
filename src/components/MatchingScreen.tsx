import { useState, useRef, useCallback, useEffect } from 'react';
import { ALPHABET_DATA } from '../data/alphabet';
import { NUMBERS_DATA } from '../data/numbers';
import { shuffleArray, buildSuccessPhrases, buildFailurePhrases, pickPhrase } from '../data/quiz';
import { useSpeech } from '../hooks/useSpeech';
import BackButton from './BackButton';
import Confetti from './Confetti';
import type { ChildProfile, QuizScore } from '../types';

const TOTAL_ROUNDS = 5;

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
  const items: MatchItem[] = mode === 'letters'
    ? shuffleArray([...ALPHABET_DATA]).slice(0, 3).map(l => ({
        id: l.key,
        leftLabel: l.key,
        rightLabel: l.word,
        rightEmoji: l.emoji,
      }))
    : shuffleArray([...NUMBERS_DATA]).slice(0, 3).map(n => ({
        id: n.key,
        leftLabel: String(n.digit),
        rightLabel: n.name,
        rightEmoji: n.emoji,
      }));
  return { items, rightOrder: shuffleArray([0, 1, 2]) };
}

interface Props {
  profile: ChildProfile;
  onComplete: (score: QuizScore) => void;
  onBack: () => void;
}

export default function MatchingScreen({ profile, onComplete, onBack }: Props) {
  const [mode, setMode] = useState<MatchMode | null>(null);
  const [items, setItems] = useState<MatchItem[]>([]);
  const [rightOrder, setRightOrder] = useState<number[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matchedLeft, setMatchedLeft] = useState<Set<number>>(new Set());
  const [matchedRight, setMatchedRight] = useState<Set<number>>(new Set());
  const [lines, setLines] = useState<LineData[]>([]);
  const [wrongLeft, setWrongLeft] = useState<number | null>(null);
  const [wrongRight, setWrongRight] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [score, setScore] = useState<QuizScore>({ correct: 0, total: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scoreRef = useRef<QuizScore>({ correct: 0, total: 0 });
  const hadMistakeRef = useRef(false);
  const advancingRef = useRef(false);

  const { speak, cancel } = useSpeech();
  useEffect(() => () => cancel(), [cancel]);

  const startRound = useCallback((m: MatchMode) => {
    const { items: newItems, rightOrder: newOrder } = buildItems(m);
    setItems(newItems);
    setRightOrder(newOrder);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedLeft(new Set());
    setMatchedRight(new Set());
    setLines([]);
    setWrongLeft(null);
    setWrongRight(null);
    setShowConfetti(false);
    hadMistakeRef.current = false;
    advancingRef.current = false;
    leftRefs.current = [null, null, null];
    rightRefs.current = [null, null, null];
  }, []);

  const handleModeSelect = (m: MatchMode) => {
    scoreRef.current = { correct: 0, total: 0 };
    setScore({ correct: 0, total: 0 });
    setMode(m);
    startRound(m);
  };

  function getCenter(el: HTMLElement): { x: number; y: number } {
    const cRect = containerRef.current!.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    return {
      x: eRect.left + eRect.width / 2 - cRect.left,
      y: eRect.top + eRect.height / 2 - cRect.top,
    };
  }

  const tryMatch = useCallback((leftIdx: number, rightDisplayIdx: number) => {
    const leftEl = leftRefs.current[leftIdx];
    const rightEl = rightRefs.current[rightDisplayIdx];
    if (!leftEl || !rightEl || !containerRef.current) return;

    const lc = getCenter(leftEl);
    const rc = getCenter(rightEl);
    const correct = rightOrder[rightDisplayIdx] === leftIdx;
    const lineId = `${leftIdx}-${rightDisplayIdx}-${Date.now()}`;

    setSelectedLeft(null);
    setSelectedRight(null);

    if (correct) {
      setLines(prev => [...prev, { id: lineId, x1: lc.x, y1: lc.y, x2: rc.x, y2: rc.y, correct: true }]);
      setMatchedLeft(prev => {
        const next = new Set([...prev, leftIdx]);
        setMatchedRight(prevR => {
          const nextR = new Set([...prevR, rightDisplayIdx]);
          if (next.size === 3) {
            advancingRef.current = true;
            const wasCorrect = !hadMistakeRef.current;
            const newScore: QuizScore = {
              correct: scoreRef.current.correct + (wasCorrect ? 1 : 0),
              total: scoreRef.current.total + 1,
            };
            scoreRef.current = newScore;
            setScore(newScore);
            if (wasCorrect) setShowConfetti(true);
            const phrases = wasCorrect
              ? buildSuccessPhrases(profile.name, profile.gender)
              : buildFailurePhrases(profile.name);
            speak(pickPhrase(phrases), () => {
              setTimeout(() => {
                if (newScore.total >= TOTAL_ROUNDS) {
                  onComplete(newScore);
                } else {
                  startRound(mode!);
                }
              }, 400);
            });
          }
          return nextR;
        });
        return next;
      });
    } else {
      hadMistakeRef.current = true;
      setLines(prev => [...prev, { id: lineId, x1: lc.x, y1: lc.y, x2: rc.x, y2: rc.y, correct: false }]);
      setWrongLeft(leftIdx);
      setWrongRight(rightDisplayIdx);
      setTimeout(() => {
        setLines(prev => prev.filter(l => l.id !== lineId));
        setWrongLeft(null);
        setWrongRight(null);
      }, 700);
    }
  }, [rightOrder, items.length, profile, speak, onComplete, startRound, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLeftClick = (idx: number) => {
    if (matchedLeft.has(idx) || advancingRef.current) return;
    if (selectedRight !== null) {
      tryMatch(idx, selectedRight);
      return;
    }
    setSelectedLeft(prev => (prev === idx ? null : idx));
    setSelectedRight(null);
  };

  const handleRightClick = (displayIdx: number) => {
    if (matchedRight.has(displayIdx) || advancingRef.current) return;
    if (selectedLeft !== null) {
      tryMatch(selectedLeft, displayIdx);
      return;
    }
    setSelectedRight(prev => (prev === displayIdx ? null : displayIdx));
    setSelectedLeft(null);
  };

  if (!mode) {
    return (
      <div className="page page-quiz">
        <header className="screen-header">
          <BackButton onBack={onBack} />
          <h2>Relier</h2>
          <div />
        </header>
        <div className="matching-mode-select">
          <div className="matching-title-emoji">🔗</div>
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

  return (
    <div className="page page-quiz">
      <header className="screen-header">
        <BackButton onBack={onBack} />
        <h2>{mode === 'letters' ? 'Lettres' : 'Chiffres'}</h2>
        <div className="score-display">{score.correct} / {TOTAL_ROUNDS}</div>
      </header>

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
                  wrongLeft === idx ? 'wrong' : '',
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
                    selectedRight === displayIdx ? 'selected' : '',
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

      <Confetti active={showConfetti} />
    </div>
  );
}
