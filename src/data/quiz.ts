import type { Question, LetterData, NumberData } from '../types';
import { ALPHABET_DATA } from './alphabet';
import { NUMBERS_DATA } from './numbers';

export const QUIZ_CONFIG = {
  questionsPerRound: 5,
  choicesPerQuestion: 4,
  speechDelay: 400,
} as const;

export const SUCCESS_PHRASES = [
  "Bravo ! C'est exact !",
  'Super ! Bien joué !',
  'Excellent ! Tu es fort !',
  'Parfait ! Bravo !',
];

export const FAILURE_PHRASES = [
  'Pas tout à fait… Essaie encore !',
  'Presque ! Continue !',
];

export const CONFETTI_COLORS = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4DA6FF', '#A78BFA', '#FF9F43', '#FF78C4',
];

const EMOJI_NAMES: Record<string, string> = {
  '🍎': 'pommes',  '🍊': 'oranges',   '🍋': 'citrons',
  '🍇': 'raisins', '🍓': 'fraises',   '🥝': 'kiwis',
  '🍒': 'cerises', '🫐': 'myrtilles', '🍑': 'pêches', '🥭': 'mangues',
};

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom<T>(arr: T[], exclude: T[], count: number): T[] {
  const pool = arr.filter(item => !exclude.includes(item));
  return shuffleArray(pool).slice(0, count);
}

export function generateLetterQuestion(excludeKeys: string[] = []): Question {
  const pool = ALPHABET_DATA.filter(l => !excludeKeys.includes(l.key));
  const source = pool.length > 0 ? pool : ALPHABET_DATA;
  const target = shuffleArray([...source])[0] as LetterData;
  const distractors = pickRandom(ALPHABET_DATA, [target], QUIZ_CONFIG.choicesPerQuestion - 1) as LetterData[];
  const choices = shuffleArray([target, ...distractors]);
  return {
    type: 'letter',
    prompt: `Clique sur la lettre ${target.key}`,
    target,
    choices,
  };
}

export function generateNumberQuestion(excludeKeys: string[] = []): Question {
  const useCountVariant = Math.random() < 0.5;
  const pool = NUMBERS_DATA.filter(n => !excludeKeys.includes(n.key));
  const source = pool.length > 0 ? pool : NUMBERS_DATA;
  const target = shuffleArray([...source])[0] as NumberData;
  const distractors = pickRandom(NUMBERS_DATA, [target], QUIZ_CONFIG.choicesPerQuestion - 1) as NumberData[];
  const choices = shuffleArray([target, ...distractors]);

  if (useCountVariant) {
    const emojiName = EMOJI_NAMES[target.emoji] ?? 'fruits';
    return {
      type: 'number-count',
      prompt: `Combien y a-t-il de ${emojiName} ?`,
      visual: Array(target.digit).fill(target.emoji).join(' '),
      target,
      choices,
    };
  }

  return {
    type: 'number-name',
    prompt: `Clique sur le chiffre ${target.name}`,
    target,
    choices,
  };
}

export function pickPhrase(phrases: string[]): string {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export function buildSuccessPhrases(name: string, gender: 'boy' | 'girl'): string[] {
  const adj = gender === 'boy' ? 'fort' : 'forte';
  return [
    `Bravo ${name} ! C'est exact !`,
    `Super ${name} ! Bien joué !`,
    `Excellent ${name} ! Tu es ${adj} !`,
    `Parfait ${name} ! Bravo !`,
  ];
}

export function buildFailurePhrases(name: string): string[] {
  return [
    `Pas tout à fait ${name}… Essaie encore !`,
    `Presque ${name} ! Continue !`,
  ];
}
