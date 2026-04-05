import { useState, useEffect, useRef, useCallback } from 'react';
import { NUMBERS_DATA } from '../data/numbers';
import { shuffleArray, QUIZ_CONFIG, buildSuccessPhrases, buildFailurePhrases, pickPhrase } from '../data/quiz';
import { useSpeech } from '../hooks/useSpeech';
import type { QuizScore, ChildProfile } from '../types';
import BackButton from './BackButton';
import Confetti from './Confetti';

// Ask "plus" or "moins" with equal probability
type AskMode = 'plus' | 'moins';

interface Round {
  leftNum:  number;
  rightNum: number;
  leftEmoji:  string;
  rightEmoji: string;
  askMode: AskMode;
  correctSide: 'left' | 'right';
  pairKey: string;
}

function buildRound(usedPairs: string[] = []): Round {
  // Pick two different numbers, avoiding previously seen pairs
  const allPairs: [typeof NUMBERS_DATA[0], typeof NUMBERS_DATA[0]][] = [];
  for (let i = 0; i < NUMBERS_DATA.length; i++) {
    for (let j = i + 1; j < NUMBERS_DATA.length; j++) {
      const pairKey = `${NUMBERS_DATA[i].key}-${NUMBERS_DATA[j].key}`;
      if (!usedPairs.includes(pairKey)) {
        allPairs.push([NUMBERS_DATA[i], NUMBERS_DATA[j]]);
      }
    }
  }
  const pool = allPairs.length > 0 ? allPairs : ((): typeof allPairs => {
    const p: typeof allPairs = [];
    for (let i = 0; i < NUMBERS_DATA.length; i++)
      for (let j = i + 1; j < NUMBERS_DATA.length; j++)
        p.push([NUMBERS_DATA[i], NUMBERS_DATA[j]]);
    return p;
  })();
  const [a, b] = shuffleArray(pool)[0];
  // Distinct emojis so the two sides don't look identical
  const askMode: AskMode = Math.random() < 0.5 ? 'plus' : 'moins';
  const correctSide =
    askMode === 'plus'
      ? (a.digit > b.digit ? 'left' : 'right')
      : (a.digit < b.digit ? 'left' : 'right');

  const [ka, kb] = a.key < b.key ? [a.key, b.key] : [b.key, a.key];
  return {
    leftNum:    a.digit,
    rightNum:   b.digit,
    leftEmoji:  a.emoji,
    rightEmoji: b.emoji,
    askMode,
    correctSide,
    pairKey: `${ka}-${kb}`,
  };
}

function prompt(round: Round): string {
  return round.askMode === 'plus'
    ? 'De quel côté y en a-t-il le plus ?'
    : 'De quel côté y en a-t-il le moins ?';
}

interface MoreOrLessScreenProps {
  profile: ChildProfile;
  onComplete: (score: QuizScore) => void;
  onBack: () => void;
}

export default function MoreOrLessScreen({ profile, onComplete, onBack }: MoreOrLessScreenProps) {
  const { speak, cancel } = useSpeech();
  const [round, setRound] = useState<Round>(buildRound);
  const [chosen, setChosen] = useState<'left' | 'right' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [score, setScore] = useState<QuizScore>({ correct: 0, total: 0 });

  const scoreRef    = useRef<QuizScore>({ correct: 0, total: 0 });
  const answeredRef = useRef(false);
  const usedPairsRef = useRef<string[]>([]);

  const startRound = useCallback((r: Round) => {
    setRound(r);
    setChosen(null);
    setShowConfetti(false);
    answeredRef.current = false;
    setTimeout(() => speak(prompt(r)), QUIZ_CONFIG.speechDelay);
  }, [speak]);

  useEffect(() => {
    scoreRef.current = { correct: 0, total: 0 };
    usedPairsRef.current = [];
    setScore({ correct: 0, total: 0 });
    const r = buildRound([]);
    usedPairsRef.current = [r.pairKey];
    startRound(r);
    return () => cancel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChoice = useCallback((side: 'left' | 'right') => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setChosen(side);

    const isCorrect = side === round.correctSide;
    const newScore: QuizScore = {
      correct: scoreRef.current.correct + (isCorrect ? 1 : 0),
      total:   scoreRef.current.total + 1,
    };
    scoreRef.current = newScore;
    setScore(newScore);

    if (isCorrect) setShowConfetti(true);

    speak(pickPhrase(isCorrect ? buildSuccessPhrases(profile.name, profile.gender) : buildFailurePhrases(profile.name)), () => {
      setTimeout(() => {
        if (newScore.total >= QUIZ_CONFIG.questionsPerRound) {
          onComplete(newScore);
        } else {
          const next = buildRound(usedPairsRef.current);
          usedPairsRef.current = [...usedPairsRef.current, next.pairKey];
          startRound(next);
        }
      }, 400);
    });
  }, [round, speak, onComplete, startRound]);

  const emojiGrid = (emoji: string, count: number) =>
    Array(count).fill(emoji).map((e, i) => (
      <span key={i} className="mol-emoji">{e}</span>
    ));

  const leftState  = chosen === null ? '' : (round.correctSide === 'left'  ? 'correct' : chosen === 'left'  ? 'wrong' : '');
  const rightState = chosen === null ? '' : (round.correctSide === 'right' ? 'correct' : chosen === 'right' ? 'wrong' : '');

  return (
    <div className="page page-mol">
      <header className="screen-header">
        <BackButton onBack={onBack} label="← Menu" />
        <h2>Plus ou Moins</h2>
        <div className="score-display">{score.correct} / {QUIZ_CONFIG.questionsPerRound}</div>
      </header>

      <div className="mol-prompt">
        {prompt(round)}
      </div>

      <div className="mol-arena">
        {/* LEFT */}
        <button
          className={`mol-side mol-left ${leftState}`}
          disabled={chosen !== null}
          onClick={() => handleChoice('left')}
        >
          <div className="mol-grid">{emojiGrid(round.leftEmoji, round.leftNum)}</div>
          <div className="mol-count">{round.leftNum}</div>
        </button>

        {/* DIVIDER */}
        <div className="mol-vs">VS</div>

        {/* RIGHT */}
        <button
          className={`mol-side mol-right ${rightState}`}
          disabled={chosen !== null}
          onClick={() => handleChoice('right')}
        >
          <div className="mol-grid">{emojiGrid(round.rightEmoji, round.rightNum)}</div>
          <div className="mol-count">{round.rightNum}</div>
        </button>
      </div>

      <Confetti active={showConfetti} />
    </div>
  );
}
