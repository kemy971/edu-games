export interface LetterData {
  key: string;
  emoji: string;
  word: string;
  article: string;
  variants?: Array<{ emoji: string; word: string; article: string }>;
}

export interface NumberData {
  key: string;
  digit: number;
  name: string;
  emoji: string;
}

export interface ChildProfile {
  name: string;
  gender: 'boy' | 'girl';
  mascot?: string;
}

export type Screen =
  | 'onboarding'
  | 'menu'
  | 'alphabet' | 'numbers'
  | 'quiz-select' | 'quiz' | 'summary'
  | 'memory'
  | 'phonics' | 'phonics-summary'
  | 'subitizing' | 'subitizing-summary'
  | 'tracing'
  | 'more-or-less'
  | 'ten-frame'
  | 'treasure-chest';
export type QuizMode = 'letters' | 'numbers' | 'mixed';

export type Question =
  | { type: 'letter'; prompt: string; target: LetterData; choices: LetterData[] }
  | { type: 'number-count'; prompt: string; visual: string; target: NumberData; choices: NumberData[] }
  | { type: 'number-name'; prompt: string; target: NumberData; choices: NumberData[] };

export interface QuizScore {
  correct: number;
  total: number;
}
