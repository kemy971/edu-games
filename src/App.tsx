import { useState, useCallback } from 'react';
import type { Screen, QuizMode, QuizScore, ChildProfile } from './types';
import OnboardingScreen, { loadProfile } from './components/OnboardingScreen';
import MenuScreen from './components/MenuScreen';
import AlphabetScreen from './components/AlphabetScreen';
import NumbersScreen from './components/NumbersScreen';
import QuizSelectScreen from './components/QuizSelectScreen';
import QuizScreen from './components/QuizScreen';
import SummaryScreen from './components/SummaryScreen';
import MemoryScreen from './components/MemoryScreen';
import PhonicsScreen from './components/PhonicsScreen';
import SubitizingScreen from './components/SubitizingScreen';
import TracingScreen from './components/TracingScreen';
import MoreOrLessScreen from './components/MoreOrLessScreen';
import TenFrameScreen from './components/TenFrameScreen';
import TreasureChestScreen from './components/TreasureChestScreen';
import MatchingScreen from './components/MatchingScreen';

interface AppState {
  screen: Screen;
  profile: ChildProfile | null;
  quizMode: QuizMode;
  lastQuizMode: QuizMode;
  summary: QuizScore | null;
  /** Which scored activity to restart on replay */
  replayScreen: Screen;
  /** Key to force remount of quiz/phonics/subitizing on replay */
  activityKey: number;
}

const savedProfile = loadProfile();

export default function App() {
  const [state, setState] = useState<AppState>({
    screen: savedProfile ? 'menu' : 'onboarding',
    profile: savedProfile,
    quizMode: 'letters',
    lastQuizMode: 'letters',
    summary: null,
    replayScreen: 'quiz',
    activityKey: 0,
  });

  const goTo = useCallback((screen: Screen) => setState(s => ({ ...s, screen })), []);

  const handleOnboardingComplete = useCallback((profile: ChildProfile) => {
    setState(s => ({ ...s, profile, screen: 'menu' }));
  }, []);

  const startQuiz = useCallback((mode: QuizMode) => {
    setState(s => ({ ...s, screen: 'quiz', quizMode: mode, lastQuizMode: mode, replayScreen: 'quiz', activityKey: s.activityKey + 1 }));
  }, []);

  const showSummary = useCallback((score: QuizScore, replayScreen: Screen) => {
    setState(s => ({ ...s, screen: 'summary', summary: score, replayScreen }));
  }, []);

  const handleReplay = useCallback(() => {
    setState(s => ({
      ...s,
      screen: s.replayScreen,
      activityKey: s.activityKey + 1,
    }));
  }, []);

  const startActivity = useCallback((screen: Screen) => {
    setState(s => ({ ...s, screen, activityKey: s.activityKey + 1 }));
  }, []);

  const profile = state.profile!;

  switch (state.screen) {
    case 'onboarding':
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;

    case 'menu':
      return (
        <MenuScreen
          profile={profile}
          onAlphabet={() => goTo('alphabet')}
          onNumbers={() => goTo('numbers')}
          onMemory={() => goTo('memory')}
          onPhonics={() => startActivity('phonics')}
          onSubitizing={() => startActivity('subitizing')}
          onTracing={() => goTo('tracing')}
          onMoreOrLess={() => startActivity('more-or-less')}
          onTenFrame={() => startActivity('ten-frame')}
          onTreasureChest={() => startActivity('treasure-chest')}
          onMatching={() => goTo('matching')}
        />
      );

    case 'alphabet':
      return <AlphabetScreen onBack={() => goTo('menu')} />;

    case 'numbers':
      return <NumbersScreen onBack={() => goTo('menu')} />;

    case 'memory':
      return <MemoryScreen onBack={() => goTo('menu')} />;

    case 'tracing':
      return <TracingScreen onBack={() => goTo('menu')} />;

    case 'phonics':
      return (
        <PhonicsScreen
          key={state.activityKey}
          profile={profile}
          onComplete={score => showSummary(score, 'phonics')}
          onBack={() => goTo('menu')}
        />
      );

    case 'subitizing':
      return (
        <SubitizingScreen
          key={state.activityKey}
          profile={profile}
          onComplete={score => showSummary(score, 'subitizing')}
          onBack={() => goTo('menu')}
        />
      );

    case 'more-or-less':
      return (
        <MoreOrLessScreen
          key={state.activityKey}
          profile={profile}
          onComplete={score => showSummary(score, 'more-or-less')}
          onBack={() => goTo('menu')}
        />
      );

    case 'ten-frame':
      return (
        <TenFrameScreen
          key={state.activityKey}
          profile={profile}
          onComplete={score => showSummary(score, 'ten-frame')}
          onBack={() => goTo('menu')}
        />
      );

    case 'treasure-chest':
      return (
        <TreasureChestScreen
          key={state.activityKey}
          profile={profile}
          onBack={() => goTo('menu')}
          onReplay={() => startActivity('treasure-chest')}
        />
      );

    case 'quiz-select':
      return <QuizSelectScreen onSelect={startQuiz} onBack={() => goTo('menu')} />;

    case 'quiz':
      return (
        <QuizScreen
          key={state.activityKey}
          mode={state.quizMode}
          profile={profile}
          onComplete={score => showSummary(score, 'quiz')}
          onBack={() => goTo('quiz-select')}
        />
      );

    case 'matching':
      return <MatchingScreen onBack={() => goTo('menu')} />;

    case 'summary':
      return (
        <SummaryScreen
          score={state.summary ?? { correct: 0, total: 5 }}
          onReplay={handleReplay}
          onMenu={() => goTo('menu')}
        />
      );

    default:
      return null;
  }
}
