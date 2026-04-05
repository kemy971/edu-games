import type { LetterData } from '../types';

export const ALPHABET_DATA: LetterData[] = [
  { key: 'A', emoji: '🍍', word: 'Ananas',     article: 'un',   variants: [{ emoji: '🐝', word: 'Abeille',     article: 'une' }, { emoji: '✈️', word: 'Avion',       article: 'un'  }] },
  { key: 'B', emoji: '🎈', word: 'Ballon',     article: 'un',   variants: [{ emoji: '⛵', word: 'Bateau',      article: 'un'  }, { emoji: '🍌', word: 'Banane',      article: 'une' }] },
  { key: 'C', emoji: '🐱', word: 'Chat',       article: 'un',   variants: [{ emoji: '🐷', word: 'Cochon',      article: 'un'  }, { emoji: '🍒', word: 'Cerise',      article: 'une' }] },
  { key: 'D', emoji: '🐬', word: 'Dauphin',    article: 'un',   variants: [{ emoji: '🦕', word: 'Dinosaure',   article: 'un'  }] },
  { key: 'E', emoji: '🐘', word: 'Éléphant',   article: 'un',   variants: [{ emoji: '⭐', word: 'Étoile',      article: 'une' }, { emoji: '🐌', word: 'Escargot',    article: 'un'  }] },
  { key: 'F', emoji: '🌸', word: 'Fleur',      article: 'une',  variants: [{ emoji: '🍓', word: 'Fraise',      article: 'une' }, { emoji: '🦩', word: 'Flamant',     article: 'un'  }, { emoji: '🔥', word: 'Feu',         article: 'le'  }] },
  { key: 'G', emoji: '🐸', word: 'Grenouille', article: 'une',  variants: [{ emoji: '🦒', word: 'Girafe',      article: 'une' }, { emoji: '🍦', word: 'Glace',       article: 'une' }] },
  { key: 'H', emoji: '🦉', word: 'Hibou',      article: 'un',   variants: [{ emoji: '🚁', word: 'Hélicoptère', article: 'un'  }] },
  { key: 'I', emoji: '🏝️', word: 'Île',        article: 'une' },
  { key: 'J', emoji: '🐆', word: 'Jaguar',     article: 'un',   variants: [{ emoji: '🦵', word: 'Jambe',       article: 'une' }] },
  { key: 'K', emoji: '🦘', word: 'Kangourou',  article: 'un',   variants: [{ emoji: '👘', word: 'Kimono',      article: 'un'  }] },
  { key: 'L', emoji: '🦁', word: 'Lion',       article: 'un',   variants: [{ emoji: '🐰', word: 'Lapin',       article: 'un'  }, { emoji: '🌙', word: 'Lune',        article: 'la'  }] },
  { key: 'M', emoji: '🐑', word: 'Mouton',     article: 'un',   variants: [{ emoji: '🏠', word: 'Maison',      article: 'une' }, { emoji: '🥭', word: 'Mangue',      article: 'une' }, { emoji: '🎤', word: 'Micro',       article: 'un'  }] },
  { key: 'N', emoji: '☁️', word: 'Nuage',      article: 'un',   variants: [{ emoji: '🌰', word: 'Noisette',    article: 'une' }] },
  { key: 'O', emoji: '🐻', word: 'Ours',       article: 'un',   variants: [{ emoji: '🐦', word: 'Oiseau',      article: 'un'  }, { emoji: '🍊', word: 'Orange',      article: 'une' }] },
  { key: 'P', emoji: '🦋', word: 'Papillon',   article: 'un',   variants: [{ emoji: '🐧', word: 'Pingouin',    article: 'un'  }, { emoji: '🍎', word: 'Pomme',       article: 'une' }, { emoji: '🐟', word: 'Poisson',     article: 'un'  }] },
  { key: 'Q', emoji: '🎳', word: 'Quille',     article: 'une' },
  { key: 'R', emoji: '🦊', word: 'Renard',     article: 'un',   variants: [{ emoji: '🤖', word: 'Robot',       article: 'un'  }, { emoji: '🍇', word: 'Raisin',      article: 'du'  }] },
  { key: 'S', emoji: '☀️', word: 'Soleil',     article: 'le',   variants: [{ emoji: '🐍', word: 'Serpent',     article: 'un'  }, { emoji: '🐵', word: 'Singe',       article: 'un'  }, { emoji: '🐭', word: 'Souris',      article: 'une' }] },
  { key: 'T', emoji: '🐢', word: 'Tortue',     article: 'une',  variants: [{ emoji: '🐯', word: 'Tigre',       article: 'un'  }, { emoji: '🍅', word: 'Tomate',      article: 'une' }] },
  { key: 'U', emoji: '🌌', word: 'Univers',    article: 'un' },
  { key: 'V', emoji: '🐄', word: 'Vache',      article: 'une',  variants: [{ emoji: '🚲', word: 'Vélo',        article: 'un'  }, { emoji: '🚗', word: 'Voiture',     article: 'une' }] },
  { key: 'W', emoji: '🚃', word: 'Wagon',      article: 'un' },
  { key: 'X', emoji: '🎶', word: 'Xylophone',  article: 'un' },
  { key: 'Y', emoji: '🥛', word: 'Yaourt',     article: 'un' },
  { key: 'Z', emoji: '🦓', word: 'Zèbre',      article: 'un' },
];

export function pickLetterVariant(letter: LetterData): { emoji: string; word: string; article: string } {
  const all = [
    { emoji: letter.emoji, word: letter.word, article: letter.article },
    ...(letter.variants ?? []),
  ];
  return all[Math.floor(Math.random() * all.length)];
}
