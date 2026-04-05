import { useState, useEffect, useRef, useCallback } from 'react';
import { NUMBERS_DATA } from '../data/numbers';
import { shuffleArray, QUIZ_CONFIG, buildSuccessPhrases, buildFailurePhrases, pickPhrase } from '../data/quiz';
import { useSpeech } from '../hooks/useSpeech';
import type { NumberData, QuizScore, ChildProfile } from '../types';
import BackButton from './BackButton';
import Confetti from './Confetti';

// Use only 1-6 for age 4
const SUBITIZE_DATA = NUMBERS_DATA.slice(0, 6);

interface SubitizingQuestion {
  target: NumberData;
  choices: NumberData[];
}

function buildQuestion(excludeKeys: string[]): SubitizingQuestion {
  const pool = SUBITIZE_DATA.filter(n => !excludeKeys.includes(n.key));
  const source = pool.length > 0 ? pool : SUBITIZE_DATA;
  const target = shuffleArray([...source])[0];
  const others = shuffleArray(SUBITIZE_DATA.filter(n => n.key !== target.key)).slice(0, 3);
  return { target, choices: shuffleArray([target, ...others]) };
}

interface SubitizingScreenProps {
  profile: ChildProfile;
  onComplete: (score: QuizScore) => void;
  onBack: () => void;
}

export default function SubitizingScreen({ profile, onComplete, onBack }: SubitizingScreenProps) {
  const { speak, cancel } = useSpeech();
  const [question, setQuestion] = useState<SubitizingQuestion>(() => buildQuestion([]));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [score, setScore] = useState<QuizScore>({ correct: 0, total: 0 });

  const scoreRef = useRef<QuizScore>({ correct: 0, total: 0 });
  const answeredRef = useRef(false);
  const usedKeysRef = useRef<string[]>([]);

  const startRound = useCallback((q: SubitizingQuestion) => {
    usedKeysRef.current = [...usedKeysRef.current, q.target.key];
    setQuestion(q);
    setSelectedKey(null);
    setAnswered(false);
    setShowConfetti(false);
    answeredRef.current = false;
    setTimeout(() => speak('Combien y en a-t-il ?'), QUIZ_CONFIG.speechDelay);
  }, [speak]);

  useEffect(() => {
    scoreRef.current = { correct: 0, total: 0 };
    usedKeysRef.current = [];
    setScore({ correct: 0, total: 0 });
    startRound(buildQuestion([]));
    return () => cancel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = useCallback((choice: NumberData) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setSelectedKey(choice.key);
    setAnswered(true);

    const isCorrect = choice.key === question.target.key;
    const newScore: QuizScore = {
      correct: scoreRef.current.correct + (isCorrect ? 1 : 0),
      total: scoreRef.current.total + 1,
    };
    scoreRef.current = newScore;
    setScore(newScore);

    if (isCorrect) setShowConfetti(true);

    speak(pickPhrase(isCorrect ? buildSuccessPhrases(profile.name, profile.gender) : buildFailurePhrases(profile.name)), () => {
      setTimeout(() => {
        if (newScore.total >= QUIZ_CONFIG.questionsPerRound) {
          onComplete(newScore);
        } else {
          startRound(buildQuestion(usedKeysRef.current));
        }
      }, 400);
    });
  }, [question, speak, onComplete, startRound, profile]);

  const correctKey = question.target.key;
  const dots = Array(question.target.digit).fill(question.target.emoji);

  return (
    <div className="page page-quiz">
      <header className="screen-header">
        <BackButton onBack={onBack} label="← Menu" />
        <h2>Combien ?</h2>
        <div className="score-display">{score.correct} / {QUIZ_CONFIG.questionsPerRound}</div>
      </header>

      <div className="quiz-prompt">Combien y en a-t-il ?</div>

      <div className="subitize-visual">
        <div className="subitize-dots">
          {dots.map((emoji, i) => (
            <span key={i} className="subitize-dot">{emoji}</span>
          ))}
        </div>
      </div>

      <div className="quiz-choices">
        {question.choices.map(choice => {
          let extraClass = '';
          if (answered) {
            if (choice.key === correctKey) extraClass = 'correct';
            else if (choice.key === selectedKey) extraClass = 'wrong';
          }
          return (
            <button
              key={choice.key}
              className={`choice-btn ${extraClass}`}
              disabled={answered}
              onClick={() => handleAnswer(choice)}
            >
              <span>{choice.digit}</span>
              <span className="choice-sub">{choice.name}</span>
            </button>
          );
        })}
      </div>

      <Confetti active={showConfetti} />
    </div>
  );
}
