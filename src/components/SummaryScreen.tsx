import { useEffect } from 'react';
import type { QuizScore } from '../types';
import { QUIZ_CONFIG } from '../data/quiz';
import { useSpeech } from '../hooks/useSpeech';

interface SummaryScreenProps {
  score: QuizScore;
  onReplay: () => void;
  onMenu: () => void;
}

function getStars(correct: number, total: number): number {
  const ratio = correct / total;
  if (ratio >= 1.0) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.4) return 1;
  return 0;
}

const MESSAGES = [
  'Continue, tu vas y arriver !',
  'Bien essayé ! Encore un peu !',
  'Très bien ! Tu apprends vite !',
  'Parfait ! Tu es brillant·e !',
];

export default function SummaryScreen({ score, onReplay, onMenu }: SummaryScreenProps) {
  const { speak } = useSpeech();
  const stars = getStars(score.correct, QUIZ_CONFIG.questionsPerRound);
  const title = stars >= 2 ? 'Bravo ! 🎉' : 'Bien joué ! 💪';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (stars === 3) speak('Parfait ! Bravo !');
      else if (stars === 2) speak('Très bien !');
      else speak('Continue, tu vas y arriver !');
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page page-menu">
      <div className="summary-content">
        <h2>{title}</h2>
        <div className="stars-display">
          {[1, 2, 3].map(i => (
            <span
              key={i}
              className={`star ${i <= stars ? 'earned' : ''}`}
              style={i <= stars ? { animationDelay: `${(i - 1) * 0.2}s` } : undefined}
            >
              ⭐
            </span>
          ))}
        </div>
        <p className="summary-score">
          {score.correct} bonne{score.correct > 1 ? 's' : ''} réponse{score.correct > 1 ? 's' : ''} sur {QUIZ_CONFIG.questionsPerRound}
        </p>
        <p className="summary-message">{MESSAGES[stars]}</p>
        <div className="summary-buttons">
          <button className="menu-btn btn-green" onClick={onReplay}>
            <span className="btn-icon">🔄</span>
            <span>Rejouer</span>
          </button>
          <button className="menu-btn btn-blue" onClick={onMenu}>
            <span className="btn-icon">🏠</span>
            <span>Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
