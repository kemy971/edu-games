# EduGame 🎓

Application éducative interactive pour enfants, conçue pour apprendre le français de manière ludique.

## Stack

- **React 18** + **TypeScript** + **Vite**
- Pas de librairie UI externe — tout le style est dans `src/index.css`
- Synthèse vocale via l'API Web Speech (`lang: fr-FR`)

## Activités

| Activité | Description |
|---|---|
| 🔤 L'Alphabet | Découvrir les 26 lettres avec émojis et mots français |
| 🔢 Les Chiffres | Apprendre les chiffres de 1 à 10 |
| 🃏 Mémoire | Jeu de memory avec les lettres |
| 🎵 Phonétique | Associer un son à la bonne lettre |
| ⚡ Combien ? | Subitizing — reconnaître une quantité d'un coup d'œil |
| ⚖️ Plus ou Moins | Comparer deux nombres |
| 🔟 Cadre de 10 | Compter dans un ten-frame |

## Lancer le projet

```bash
npm install
npm run dev        # serveur de développement → http://localhost:5173
npm run build      # build de production
npm run preview    # prévisualiser le build
```

> **Note** : si `npm` n'est pas dans le PATH, utiliser le binaire complet :
> `/opt/homebrew/bin/node ./node_modules/.bin/vite`

## Structure

```
src/
├── App.tsx                  # Machine à états principale (navigation)
├── types/index.ts           # Types partagés (Screen, ChildProfile, QuizScore…)
├── index.css                # Tout le CSS (variables, pages, composants)
├── data/
│   ├── alphabet.ts          # 26 lettres { key, emoji, word, article }
│   ├── numbers.ts           # 10 chiffres { key, digit, name, emoji }
│   └── quiz.ts              # Config quiz, générateurs de questions
├── hooks/
│   └── useSpeech.ts         # Synthèse vocale (fr-FR, rate 0.82)
└── components/
    ├── OnboardingScreen.tsx  # Saisie du prénom et du sexe (premier lancement)
    ├── MenuScreen.tsx        # Menu principal
    ├── SummaryScreen.tsx     # Écran de score après une activité
    └── ...                   # Un fichier par activité
```

## Profil enfant

Au premier lancement, l'app demande le prénom et le sexe de l'enfant. Ces informations sont sauvegardées dans le `localStorage` (`edugame-profile`) et ne sont plus redemandées. La mascotte choisie dans le menu est également persistée dans ce même objet.

Pour réinitialiser le profil, supprimer la clé `edugame-profile` dans le `localStorage` du navigateur.
