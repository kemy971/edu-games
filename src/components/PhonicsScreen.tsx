import { useState, useEffect, useRef, useCallback } from 'react';
import { ALPHABET_DATA, pickLetterVariant } from '../data/alphabet';
import { shuffleArray, pickPhrase, buildSuccessPhrases, buildFailurePhrases, QUIZ_CONFIG } from '../data/quiz';
import { useSpeech } from '../hooks/useSpeech';
import type { LetterData, QuizScore, ChildProfile } from '../types';
import BackButton from './BackButton';
import Confetti from './Confetti';

interface PhonicsQuestion {
  target: LetterData;
  choices: LetterData[];
}

function buildQuestion(excludeKeys: string[] = []): PhonicsQuestion {
  const pool = ALPHABET_DATA.filter(l => !excludeKeys.includes(l.key));
  const source = pool.length > 0 ? pool : ALPHABET_DATA;
  const picked = shuffleArray([...source])[0];
  const variant = pickLetterVariant(picked);
  const target: LetterData = { ...picked, ...variant };
  const others = shuffleArray(ALPHABET_DATA.filter(l => l.key !== picked.key)).slice(0, 3);
  return { target, choices: shuffleArray([target, ...others]) };
}

interface PhonicsScreenProps {
  profile: ChildProfile;
  onComplete: (score: QuizScore) => void;
  onBack: () => void;
}

export default function PhonicsScreen({ profile, onComplete, onBack }: PhonicsScreenProps) {
  const { speak, cancel } = useSpeech();
  const [question, setQuestion] = useState<PhonicsQuestion>(buildQuestion);
  const [answered, setAnswered] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [score, setScore] = useState<QuizScore>({ correct: 0, total: 0 });

  const scoreRef = useRef<QuizScore>({ correct: 0, total: 0 });
  const answeredRef = useRef(false);
  const usedKeysRef = useRef<string[]>([]);

  const askQuestion = useCallback((q: PhonicsQuestion) => {
    setQuestion(q);
    setAnswered(false);
    answeredRef.current = false;
    setSelectedKey(null);
    setShowConfetti(false);
    setTimeout(() => speak(`Écoute bien… ${q.target.word}. Quelle lettre entends-tu au début ?`), QUIZ_CONFIG.speechDelay);
  }, [speak]);

  useEffect(() => {
    scoreRef.current = { correct: 0, total: 0 };
    usedKeysRef.current = [];
    setScore({ correct: 0, total: 0 });
    const q = buildQuestion([]);
    usedKeysRef.current = [q.target.key];
    askQuestion(q);
    return () => cancel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = useCallback((key: string) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setAnswered(true);
    setSelectedKey(key);

    const isCorrect = key === question.target.key;
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
          const next = buildQuestion(usedKeysRef.current);
          usedKeysRef.current = [...usedKeysRef.current, next.target.key];
          askQuestion(next);
        }
      }, 400);
    });
  }, [question, speak, onComplete, askQuestion]);

  const speakHint = () => {
    speak(`${question.target.word}. ${question.target.key} comme ${question.target.word}.`);
  };

  return (
    <div className="page page-quiz">
      <header className="screen-header">
        <BackButton onBack={onBack} label="← Menu" />
        <h2>Phonétique</h2>
        <div className="score-display">{score.correct} / {QUIZ_CONFIG.questionsPerRound}</div>
      </header>

      <div className="quiz-prompt">
        Quelle lettre commence ce mot ?
      </div>

      {/* Show emoji but NOT the word text — child must listen */}
      <div className="phonics-visual" onClick={speakHint}>
        <span className="phonics-emoji">{question.target.emoji}</span>
        <span className="phonics-listen">🔊 Écouter</span>
      </div>

      <div className="quiz-choices">
        {question.choices.map(choice => {
          let extraClass = '';
          if (answered) {
            if (choice.key === question.target.key) extraClass = 'correct';
            else if (choice.key === selectedKey) extraClass = 'wrong';
          }
          return (
            <button
              key={choice.key}
              className={`choice-btn ${extraClass}`}
              disabled={answered}
              onClick={() => handleAnswer(choice.key)}
            >
              <span>{choice.key}</span>
            </button>
          );
        })}
      </div>

      <Confetti active={showConfetti} />
    </div>
  );
}
