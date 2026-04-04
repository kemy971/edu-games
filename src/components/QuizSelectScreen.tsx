import type { QuizMode } from '../types';
import BackButton from './BackButton';

interface QuizSelectScreenProps {
  onSelect: (mode: QuizMode) => void;
  onBack: () => void;
}

export default function QuizSelectScreen({ onSelect, onBack }: QuizSelectScreenProps) {
  return (
    <div className="page page-center">
      <header className="screen-header">
        <BackButton onBack={onBack} />
        <h2>Quel Quiz ?</h2>
        <div className="header-spacer" />
      </header>
      <div className="quiz-mode-buttons">
        <button className="quiz-mode-btn btn-blue" onClick={() => onSelect('letters')}>
          <span>🔤</span>
          <span>Lettres</span>
        </button>
        <button className="quiz-mode-btn btn-green" onClick={() => onSelect('numbers')}>
          <span>🔢</span>
          <span>Chiffres</span>
        </button>
        <button className="quiz-mode-btn btn-purple" onClick={() => onSelect('mixed')}>
          <span>🎲</span>
          <span>Les Deux</span>
        </button>
      </div>
    </div>
  );
}
