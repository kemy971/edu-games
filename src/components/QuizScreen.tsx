import { useState, useEffect, useRef, useCallback } from 'react';
import type { QuizMode, Question, QuizScore, ChildProfile } from '../types';
import {
  QUIZ_CONFIG,
  buildSuccessPhrases,
  buildFailurePhrases,
  generateLetterQuestion,
  generateNumberQuestion,
  pickPhrase,
} from '../data/quiz';
import { useSpeech } from '../hooks/useSpeech';
import BackButton from './BackButton';
import Confetti from './Confetti';

interface QuizScreenProps {
  mode: QuizMode;
  profile: ChildProfile;
  onComplete: (score: QuizScore) => void;
  onBack: () => void;
}

export default function QuizScreen({ mode, profile, onComplete, onBack }: QuizScreenProps) {
  const { speak, cancel } = useSpeech();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answered, setAnswered] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [score, setScore] = useState<QuizScore>({ correct: 0, total: 0 });

  // Refs to access latest values inside callbacks
  const scoreRef = useRef<QuizScore>({ correct: 0, total: 0 });
  const answeredRef = useRef(false);
  const usedKeysRef = useRef<string[]>([]);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const buildQuestion = useCallback((): Question => {
    const effectiveMode = modeRef.current === 'mixed'
      ? (Math.random() < 0.5 ? 'letters' : 'numbers')
      : modeRef.current;
    return effectiveMode === 'letters'
      ? generateLetterQuestion(usedKeysRef.current)
      : generateNumberQuestion(usedKeysRef.current);
  }, []);

  const loadNextQuestion = useCallback(() => {
    const q = buildQuestion();
    usedKeysRef.current = [...usedKeysRef.current, q.target.key];
    setQuestion(q);
    setAnswered(false);
    answeredRef.current = false;
    setSelectedKey(null);
    setShowConfetti(false);
    setTimeout(() => speak(q.prompt), QUIZ_CONFIG.speechDelay);
  }, [buildQuestion, speak]);

  // Mount: start quiz
  useEffect(() => {
    scoreRef.current = { correct: 0, total: 0 };
    usedKeysRef.current = [];
    setScore({ correct: 0, total: 0 });
    loadNextQuestion();
    return () => cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = useCallback((key: string) => {
    if (answeredRef.current || !question) return;
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

    const phrase = pickPhrase(isCorrect ? buildSuccessPhrases(profile.name, profile.gender) : buildFailurePhrases(profile.name));
    speak(phrase, () => {
      setTimeout(() => {
        if (newScore.total >= QUIZ_CONFIG.questionsPerRound) {
          onComplete(newScore);
        } else {
          loadNextQuestion();
        }
      }, 400);
    });
  }, [question, speak, onComplete, loadNextQuestion]);

  if (!question) return null;

  const correctKey = question.target.key;

  return (
    <div className="page page-quiz">
      <header className="screen-header">
        <BackButton onBack={onBack} label="← Menu" />
        <h2>Quiz</h2>
        <div className="score-display">{score.correct} / {QUIZ_CONFIG.questionsPerRound}</div>
      </header>

      <div className="quiz-prompt">{question.prompt}</div>

      {question.type === 'number-count' && (
        <div className="quiz-visual">{question.visual}</div>
      )}

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
              onClick={() => handleAnswer(choice.key)}
            >
              {'word' in choice ? (
                <>
                  <span>{choice.key}</span>
                  <span className="choice-sub">{choice.emoji} {choice.word}</span>
                </>
              ) : (
                <>
                  <span>{choice.digit}</span>
                  <span className="choice-sub">{choice.name}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <Confetti active={showConfetti} />
    </div>
  );
}
