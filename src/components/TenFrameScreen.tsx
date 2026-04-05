import { useState, useEffect, useCallback, useRef } from 'react';
import { NUMBERS_DATA } from '../data/numbers';
import { shuffleArray, QUIZ_CONFIG, buildSuccessPhrases, buildFailurePhrases, pickPhrase } from '../data/quiz';
import { useSpeech } from '../hooks/useSpeech';
import type { QuizScore, ChildProfile } from '../types';
import BackButton from './BackButton';
import Confetti from './Confetti';

interface Round {
  target: number;
  name: string;
  emoji: string;
  key: string;
}

function buildRound(excludeKeys: string[] = []): Round {
  const pool = NUMBERS_DATA.filter(n => !excludeKeys.includes(n.key));
  const source = pool.length > 0 ? pool : NUMBERS_DATA;
  const n = shuffleArray([...source])[0];
  return { target: n.digit, name: n.name, emoji: n.emoji, key: n.key };
}

interface TenFrameScreenProps {
  profile: ChildProfile;
  onComplete: (score: QuizScore) => void;
  onBack: () => void;
}

export default function TenFrameScreen({ profile, onComplete, onBack }: TenFrameScreenProps) {
  const { speak, cancel } = useSpeech();
  const [round, setRound] = useState<Round>(buildRound);
  const [filled, setFilled] = useState<boolean[]>(Array(10).fill(false));
  const [validated, setValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [score, setScore] = useState<QuizScore>({ correct: 0, total: 0 });

  const scoreRef = useRef<QuizScore>({ correct: 0, total: 0 });
  const answeredRef = useRef(false);
  const usedKeysRef = useRef<string[]>([]);

  const startRound = useCallback((r: Round) => {
    setRound(r);
    setFilled(Array(10).fill(false));
    setValidated(false);
    setIsCorrect(false);
    setShowConfetti(false);
    answeredRef.current = false;
    setTimeout(() => speak(`Remplis ${r.target} case${r.target > 1 ? 's' : ''} pour le nombre ${r.name}`), QUIZ_CONFIG.speechDelay);
  }, [speak]);

  useEffect(() => {
    scoreRef.current = { correct: 0, total: 0 };
    usedKeysRef.current = [];
    setScore({ correct: 0, total: 0 });
    const r = buildRound([]);
    usedKeysRef.current = [r.key];
    startRound(r);
    return () => cancel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleValidate = useCallback(() => {
    if (answeredRef.current) return;
    answeredRef.current = true;

    const filledCount = filled.filter(Boolean).length;
    const correct = filledCount === round.target;
    const newScore: QuizScore = {
      correct: scoreRef.current.correct + (correct ? 1 : 0),
      total: scoreRef.current.total + 1,
    };
    scoreRef.current = newScore;
    setScore(newScore);
    setValidated(true);
    setIsCorrect(correct);
    if (correct) setShowConfetti(true);

    speak(pickPhrase(correct ? buildSuccessPhrases(profile.name, profile.gender) : buildFailurePhrases(profile.name)), () => {
      setTimeout(() => {
        if (newScore.total >= QUIZ_CONFIG.questionsPerRound) {
          onComplete(newScore);
        } else {
          const next = buildRound(usedKeysRef.current);
          usedKeysRef.current = [...usedKeysRef.current, next.key];
          startRound(next);
        }
      }, 400);
    });
  }, [filled, round, speak, onComplete, startRound]);

  const toggleCell = useCallback((i: number) => {
    if (validated) return;
    setFilled(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }, [validated]);

  const filledCount = filled.filter(Boolean).length;

  return (
    <div className="page page-tf">
      <header className="screen-header">
        <BackButton onBack={onBack} label="← Menu" />
        <h2>Cadre de 10</h2>
        <div className="score-display">{score.correct} / {QUIZ_CONFIG.questionsPerRound}</div>
      </header>

      <div className="tf-target">
        <span className="tf-emoji">{round.emoji}</span>
        <span className="tf-number">{round.target}</span>
        <span className="tf-name">{round.name}</span>
      </div>

      <p className="tf-instruction">
        Tape {round.target} case{round.target > 1 ? 's' : ''} dans la grille
      </p>

      <div className="tf-frame">
        {filled.map((active, i) => (
          <button
            key={i}
            className={`tf-cell ${active ? 'tf-cell-filled' : ''} ${validated ? (isCorrect ? 'tf-correct' : 'tf-wrong') : ''}`}
            onClick={() => toggleCell(i)}
            disabled={validated}
            aria-label={`Case ${i + 1}`}
          >
            {active ? round.emoji : ''}
          </button>
        ))}
      </div>

      <div className="tf-count-row">
        <span className="tf-count">{filledCount} / {round.target}</span>
      </div>

      <button
        className={`tf-validate-btn ${filledCount === round.target ? 'tf-validate-ready' : ''}`}
        onClick={handleValidate}
        disabled={validated || filledCount === 0}
      >
        Valider ✓
      </button>

      <Confetti active={showConfetti} />
    </div>
  );
}
