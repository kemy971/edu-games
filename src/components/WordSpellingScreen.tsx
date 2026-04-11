import { useState, useEffect, useRef, useCallback } from 'react';
import { ALPHABET_DATA } from '../data/alphabet';
import { shuffleArray } from '../data/quiz';
import { useSpeech } from '../hooks/useSpeech';
import type { ChildProfile } from '../types';
import BackButton from './BackButton';
import Confetti from './Confetti';

const WORDS_PER_ROUND = 8;

// Map each character to a spoken hint, e.g. "c, comme Chat"
const LETTER_HINT: Record<string, string> = {};
for (const entry of ALPHABET_DATA) {
  LETTER_HINT[entry.key] = `${entry.key.toLowerCase()}, comme ${entry.word}`;
}
LETTER_HINT['É'] = 'é, comme éléphant';
LETTER_HINT['È'] = 'è, comme zèbre';
LETTER_HINT['Î'] = 'î, comme île';

function getLetterHint(letter: string): string {
  return LETTER_HINT[letter] ?? letter;
}

const KEYBOARD_ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
  ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  ['É', 'È', 'Î'],
];

const SUCCESS_PHRASES = [
  'Bravo ! Super épellation !',
  'Excellent ! Tu as bien écrit ce mot !',
  'Parfait ! Tu es très fort !',
  "C'est ça ! Magnifique !",
  'Super ! Continue comme ça !',
  'Génial ! Bien joué !',
  'Ouais ! Tu y es arrivé !',
  "Félicitations ! C'est parfait !",
];

interface WordEntry {
  emoji: string;
  word: string;
}

function buildWordPool(): WordEntry[] {
  const words: WordEntry[] = [];
  for (const letter of ALPHABET_DATA) {
    words.push({ emoji: letter.emoji, word: letter.word });
    if (letter.variants) {
      for (const v of letter.variants) {
        words.push({ emoji: v.emoji, word: v.word });
      }
    }
  }
  return words;
}

interface Props {
  profile: ChildProfile;
  onBack: () => void;
  onReplay: () => void;
}

export default function WordSpellingScreen({ profile: _profile, onBack, onReplay }: Props) {
  const { speak, cancel } = useSpeech();

  const [words] = useState<WordEntry[]>(() =>
    shuffleArray(buildWordPool()).slice(0, WORDS_PER_ROUND)
  );
  const [wordIndex, setWordIndex] = useState(0);
  const [typed, setTyped] = useState<string[]>([]);
  const [phase, setPhase] = useState<'playing' | 'success' | 'end'>('playing');
  const [showConfetti, setShowConfetti] = useState(false);

  // Refs for stable callbacks (avoid stale closures)
  const wordIndexRef = useRef(0);
  const typedRef = useRef<string[]>([]);
  const phaseRef = useRef<'playing' | 'success' | 'end'>('playing');
  const autoAdvanceRef = useRef<number | null>(null);
  const slotsRef = useRef<HTMLDivElement>(null);

  // Trigger shake animation using DOM class toggling
  const triggerShake = useCallback(() => {
    const el = slotsRef.current;
    if (!el) return;
    el.classList.remove('spelling-shake');
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add('spelling-shake');
  }, []);

  const startWord = useCallback(
    (idx: number) => {
      const word = words[idx];
      wordIndexRef.current = idx;
      typedRef.current = [];
      phaseRef.current = 'playing';
      setWordIndex(idx);
      setTyped([]);
      setPhase('playing');
      setShowConfetti(false);
      const wordUpper = word.word.toUpperCase();
      setTimeout(() => {
        speak(word.word, () => {
          setTimeout(() => speak(getLetterHint(wordUpper[0])), 350);
        });
      }, 400);
    },
    [words, speak]
  );

  useEffect(() => {
    startWord(0);
    return () => {
      cancel();
      if (autoAdvanceRef.current !== null) clearTimeout(autoAdvanceRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLetter = useCallback(
    (letter: string) => {
      if (phaseRef.current !== 'playing') return;

      const wordIdx = wordIndexRef.current;
      const wordUpper = words[wordIdx].word.toUpperCase();
      const currentTyped = typedRef.current;
      const expected = wordUpper[currentTyped.length];

      if (letter === expected) {
        const newTyped = [...currentTyped, letter];
        typedRef.current = newTyped;
        setTyped(newTyped);

        if (newTyped.length === wordUpper.length) {
          // Word complete!
          phaseRef.current = 'success';
          setPhase('success');
          setShowConfetti(true);
          const phrase = SUCCESS_PHRASES[Math.floor(Math.random() * SUCCESS_PHRASES.length)];
          speak(letter.toLowerCase(), () => speak(phrase));

          autoAdvanceRef.current = window.setTimeout(() => {
            cancel();
            setShowConfetti(false);
            const nextIdx = wordIdx + 1;
            if (nextIdx >= words.length) {
              phaseRef.current = 'end';
              setPhase('end');
            } else {
              startWord(nextIdx);
            }
          }, 2900);
        } else {
          // Correct but not last letter — speak letter then hint for next
          const nextHint = getLetterHint(wordUpper[newTyped.length]);
          speak(letter.toLowerCase(), () => setTimeout(() => speak(nextHint), 350));
        }
      } else {
        // Wrong letter — speak it, prompt to retry, then replay the hint
        triggerShake();
        const hint = getLetterHint(expected);
        speak(letter.toLowerCase(), () => speak('Essaie encore !', () => setTimeout(() => speak(hint), 300)));
      }
    },
    [words, speak, cancel, startWord, triggerShake]
  );

  const handleBackspace = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const currentTyped = typedRef.current;
    if (currentTyped.length > 0) {
      const newTyped = currentTyped.slice(0, -1);
      typedRef.current = newTyped;
      setTyped(newTyped);
    }
  }, []);

  const speakWord = useCallback(() => {
    speak(words[wordIndexRef.current].word);
  }, [words, speak]);

  // ── End screen ──────────────────────────────────────────
  if (phase === 'end') {
    return (
      <div className="page page-word-spelling">
        <header className="screen-header">
          <BackButton onBack={onBack} />
          <h2>Épellation</h2>
          <div className="header-spacer" />
        </header>
        <div className="spelling-end">
          <div className="spelling-end-trophy">🏆</div>
          <p className="spelling-end-msg">Bravo !<br />Tu as écrit tous les mots !</p>
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
        </div>
      </div>
    );
  }

  // ── Playing / success screen ─────────────────────────────
  const word = words[wordIndex];
  const wordUpper = word.word.toUpperCase();
  const wordLetters = wordUpper.split('');

  return (
    <div className="page page-word-spelling">
      <header className="screen-header">
        <BackButton onBack={onBack} />
        <h2>Épellation</h2>
        <div className="spelling-progress">
          {wordIndex + 1} / {words.length}
        </div>
      </header>

      {/* Emoji + word label (click to hear) */}
      <div className="spelling-content">
        <button className="spelling-word-display" onClick={speakWord} aria-label={`Écouter ${word.word}`}>
          <span className="spelling-emoji">{word.emoji}</span>
          <span className="spelling-label">{word.word.toUpperCase()}</span>
          <span className="spelling-listen-hint">🔊</span>
        </button>

        {/* Letter slots */}
        <div
          ref={slotsRef}
          className="spelling-slots"
          onAnimationEnd={() => slotsRef.current?.classList.remove('spelling-shake')}
          style={{ '--word-len': wordLetters.length } as React.CSSProperties}
        >
          {wordLetters.map((letter, i) => {
            const isCurrent = i === typed.length && phase === 'playing';
            return (
              <div
                key={i}
                className={`spelling-slot ${
                  i < typed.length
                    ? 'slot-filled'
                    : isCurrent
                      ? 'slot-current'
                      : 'slot-empty'
                }`}
                onClick={isCurrent ? () => speak(getLetterHint(letter)) : undefined}
                style={isCurrent ? { cursor: 'pointer' } : undefined}
              >
                {i < typed.length ? typed[i] : isCurrent ? '?' : '•'}
              </div>
            );
          })}
        </div>
      </div>

      {/* Virtual keyboard */}
      <div className="spelling-keyboard">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="spelling-keyboard-row">
            {row.map(letter => (
              <button
                key={letter}
                className="spelling-key"
                onClick={() => handleLetter(letter)}
                disabled={phase !== 'playing'}
              >
                {letter}
              </button>
            ))}
          </div>
        ))}
        <div className="spelling-keyboard-row">
          <button
            className="spelling-key spelling-key-back"
            onClick={handleBackspace}
            disabled={phase !== 'playing' || typed.length === 0}
          >
            ← Effacer
          </button>
        </div>
      </div>

      <Confetti active={showConfetti} />
    </div>
  );
}
