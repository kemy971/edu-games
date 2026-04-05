import { useState, useEffect, useCallback, useRef } from 'react';
import Lottie from 'lottie-react';
import { ALPHABET_DATA } from '../data/alphabet';
import { NUMBERS_DATA } from '../data/numbers';
import { shuffleArray } from '../data/quiz';
import { useSpeech } from '../hooks/useSpeech';
import type { ChildProfile } from '../types';
import BackButton from './BackButton';
import Confetti from './Confetti';
import chestAnimation from '../assets/lottie/treasure chest.json';
import explosionAnimation from '../assets/lottie/explosion.json';

const MAX_MISTAKES = 3;
const COMBO_LENGTH = 4;

const SINGLE_DIGIT_NUMBERS = NUMBERS_DATA.filter(n => n.digit <= 9);

interface ComboChar {
  type: 'letter' | 'digit';
  value: string;
  speechText: string;
}

function generateCombo(): ComboChar[] {
  const combo: ComboChar[] = [];
  for (let i = 0; i < COMBO_LENGTH; i++) {
    if (Math.random() < 0.5) {
      const letter = shuffleArray([...ALPHABET_DATA])[0];
      combo.push({
        type: 'letter',
        value: letter.key,
        speechText: `${letter.key}, comme ${letter.word}`,
      });
    } else {
      const num = shuffleArray([...SINGLE_DIGIT_NUMBERS])[0];
      combo.push({
        type: 'digit',
        value: String(num.digit),
        speechText: num.name,
      });
    }
  }
  return combo;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DIGITS = '123456789'.split('');

interface TreasureChestScreenProps {
  profile: ChildProfile;
  onBack: () => void;
  onReplay: () => void;
}

export default function TreasureChestScreen({ profile, onBack, onReplay }: TreasureChestScreenProps) {
  const { speak, cancel } = useSpeech();

  const [combo, setCombo] = useState<ComboChar[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [chestState, setChestState] = useState<'locked' | 'opened' | 'destroyed'>('locked');
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [feedbackChar, setFeedbackChar] = useState<{ key: string; correct: boolean } | null>(null);

  const answeredRef = useRef(false);

  const startRound = useCallback(() => {
    const newCombo = generateCombo();
    setCombo(newCombo);
    setCurrentIndex(0);
    setMistakes(0);
    setRevealed([]);
    setChestState('locked');
    setShowConfetti(false);
    setFeedbackChar(null);
    answeredRef.current = false;

    setTimeout(() => {
      speak(`Ouvre le coffre ! ${newCombo[0].speechText}`);
    }, 500);
  }, [speak]);

  useEffect(() => {
    startRound();
    return () => cancel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyPress = useCallback((key: string) => {
    if (answeredRef.current || chestState !== 'locked') return;

    const current = combo[currentIndex];
    if (!current) return;

    if (key === current.value) {
      const newRevealed = [...revealed, key];
      setRevealed(newRevealed);
      setFeedbackChar({ key, correct: true });
      setTimeout(() => setFeedbackChar(null), 400);

      const nextIndex = currentIndex + 1;

      if (nextIndex >= COMBO_LENGTH) {
        answeredRef.current = true;
        setChestState('opened');
        setShowConfetti(true);
        speak(`Bravo ${profile.name} ! Le coffre est ouvert !`);
      } else {
        setCurrentIndex(nextIndex);
        setTimeout(() => speak(combo[nextIndex].speechText), 400);
      }
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      setShakeWrong(true);
      setFeedbackChar({ key, correct: false });
      setTimeout(() => { setShakeWrong(false); setFeedbackChar(null); }, 500);

      if (newMistakes >= MAX_MISTAKES) {
        answeredRef.current = true;
        setChestState('destroyed');
        speak('Oh non ! Le coffre est détruit !');
      } else {
        speak(`Non ! ${current.speechText}`);
      }
    }
  }, [combo, currentIndex, revealed, mistakes, chestState, speak, profile]);

  const currentChar = combo[currentIndex];
  const showLetters = chestState === 'locked' && currentChar?.type === 'letter';
  const keys = showLetters ? LETTERS : DIGITS;

  return (
    <div className="page page-chest">
      <header className="screen-header">
        <BackButton onBack={onBack} />
        <h2>Coffre au Trésor</h2>
        <div className="header-spacer" />
      </header>

      <div className="chest-center">
        <div className="chest-lives">
          {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
            <span key={i} className={`chest-heart ${i < MAX_MISTAKES - mistakes ? '' : 'chest-heart-lost'}`}>
              {i < MAX_MISTAKES - mistakes ? '❤️' : '🖤'}
            </span>
          ))}
        </div>

        <div className={`chest-lottie ${shakeWrong ? 'chest-shake' : ''}`}>
          <Lottie
            key={chestState}
            animationData={chestState === 'destroyed' ? explosionAnimation : chestAnimation}
            loop={false}
            autoplay={chestState !== 'locked'}
          />
        </div>

        <div className="chest-combo">
          {combo.map((char, i) => {
            const isActive = i === currentIndex && chestState === 'locked';
            return (
              <button
                key={i}
                className={`chest-slot ${isActive ? 'chest-slot-active' : ''} ${i < revealed.length ? 'chest-slot-revealed' : ''}`}
                onClick={isActive ? () => speak(char.speechText) : undefined}
                disabled={!isActive}
              >
                {i < revealed.length ? revealed[i] : (isActive ? '?' : '•')}
              </button>
            );
          })}
        </div>

        {chestState !== 'locked' && (
          <>
            <p className="chest-result-text">
              {chestState === 'opened' ? 'Coffre ouvert !' : 'Le coffre est détruit…'}
            </p>
            <div className="chest-end-buttons">
              <button className="menu-btn btn-green" onClick={onReplay}>
                <span className="btn-icon">🔄</span>
                <span>Rejouer</span>
              </button>
              <button className="menu-btn btn-blue" onClick={onBack}>
                <span className="btn-icon">🏠</span>
                <span>Menu</span>
              </button>
            </div>
          </>
        )}
      </div>

      {chestState === 'locked' && (
        <div className={`chest-keyboard ${showLetters ? 'chest-kb-letters' : 'chest-kb-digits'}`}>
          {keys.map(k => (
            <button
              key={k}
              className={`chest-key ${feedbackChar?.key === k ? (feedbackChar.correct ? 'chest-key-correct' : 'chest-key-wrong') : ''}`}
              onClick={() => handleKeyPress(k)}
            >
              {k}
            </button>
          ))}
        </div>
      )}

      <Confetti active={showConfetti} />
    </div>
  );
}
