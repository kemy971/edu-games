import { useState, useEffect, useRef, useCallback } from 'react';
import { ALPHABET_DATA } from '../data/alphabet';
import { NUMBERS_DATA } from '../data/numbers';
import { useSpeech } from '../hooks/useSpeech';
import BackButton from './BackButton';
import Confetti from './Confetti';

type TraceMode = 'letters' | 'numbers';

const STROKE_WIDTH = 20;
const STROKE_COLOR = '#4DA6FF';
const SUCCESS_COLOR = '#6BCB77';
/** Rayon de détection : fraction du petit côté du canvas (~65px sur tablette) */
const HIT_RADIUS_RATIO = 0.13;

interface WP { x: number; y: number; } // coordonnées normalisées [0,1]

/* =============================================
   CHEMINS PAR LETTRE
   Chaque point = endroit clé que l'enfant DOIT traverser
   pour que la lettre soit considérée complète.
   ============================================= */
const LETTER_PATHS: Record<string, WP[]> = {
  A: [
    { x: 0.50, y: 0.10 }, // sommet
    { x: 0.15, y: 0.88 }, // bas-gauche
    { x: 0.85, y: 0.88 }, // bas-droite
    { x: 0.32, y: 0.55 }, // barre-gauche
    { x: 0.68, y: 0.55 }, // barre-droite
  ],
  B: [
    { x: 0.25, y: 0.12 }, // haut-gauche
    { x: 0.25, y: 0.88 }, // bas-gauche
    { x: 0.72, y: 0.28 }, // bosse-haut
    { x: 0.75, y: 0.50 }, // milieu-droite
    { x: 0.72, y: 0.72 }, // bosse-bas
  ],
  C: [
    { x: 0.78, y: 0.22 }, // haut-droite
    { x: 0.30, y: 0.14 }, // haut-gauche
    { x: 0.14, y: 0.50 }, // milieu-gauche
    { x: 0.30, y: 0.86 }, // bas-gauche
    { x: 0.78, y: 0.78 }, // bas-droite
  ],
  D: [
    { x: 0.25, y: 0.12 }, // haut-gauche
    { x: 0.25, y: 0.88 }, // bas-gauche
    { x: 0.62, y: 0.18 }, // haut-droite
    { x: 0.85, y: 0.50 }, // milieu-droite
    { x: 0.62, y: 0.82 }, // bas-droite
  ],
  E: [
    { x: 0.25, y: 0.12 }, // haut-gauche
    { x: 0.80, y: 0.12 }, // haut-droite
    { x: 0.25, y: 0.50 }, // milieu-gauche
    { x: 0.68, y: 0.50 }, // milieu-droite
    { x: 0.25, y: 0.88 }, // bas-gauche
    { x: 0.80, y: 0.88 }, // bas-droite
  ],
  F: [
    { x: 0.25, y: 0.12 }, // haut-gauche
    { x: 0.80, y: 0.12 }, // haut-droite
    { x: 0.25, y: 0.50 }, // milieu-gauche
    { x: 0.68, y: 0.50 }, // milieu-droite
    { x: 0.25, y: 0.88 }, // bas
  ],
  G: [
    { x: 0.78, y: 0.22 }, // haut-droite
    { x: 0.30, y: 0.14 }, // haut-gauche
    { x: 0.14, y: 0.50 }, // milieu-gauche
    { x: 0.30, y: 0.86 }, // bas-gauche
    { x: 0.78, y: 0.82 }, // bas-droite
    { x: 0.80, y: 0.56 }, // milieu-droite
    { x: 0.55, y: 0.56 }, // centre
  ],
  H: [
    { x: 0.20, y: 0.12 }, // haut-gauche
    { x: 0.20, y: 0.88 }, // bas-gauche
    { x: 0.80, y: 0.12 }, // haut-droite
    { x: 0.80, y: 0.88 }, // bas-droite
    { x: 0.20, y: 0.50 }, // barre-gauche
    { x: 0.80, y: 0.50 }, // barre-droite
  ],
  I: [
    { x: 0.50, y: 0.12 }, // haut
    { x: 0.50, y: 0.50 }, // milieu
    { x: 0.50, y: 0.88 }, // bas
  ],
  J: [
    { x: 0.60, y: 0.12 }, // haut
    { x: 0.60, y: 0.72 }, // milieu
    { x: 0.50, y: 0.88 }, // courbe-bas
    { x: 0.30, y: 0.80 }, // crochet-gauche
  ],
  K: [
    { x: 0.25, y: 0.12 }, // haut-gauche
    { x: 0.25, y: 0.88 }, // bas-gauche
    { x: 0.30, y: 0.50 }, // milieu-centre
    { x: 0.80, y: 0.12 }, // haut-droite
    { x: 0.80, y: 0.88 }, // bas-droite
  ],
  L: [
    { x: 0.25, y: 0.12 }, // haut
    { x: 0.25, y: 0.88 }, // bas-gauche
    { x: 0.78, y: 0.88 }, // bas-droite
  ],
  M: [
    { x: 0.12, y: 0.88 }, // bas-gauche
    { x: 0.12, y: 0.12 }, // haut-gauche
    { x: 0.50, y: 0.58 }, // creux-centre
    { x: 0.88, y: 0.12 }, // haut-droite
    { x: 0.88, y: 0.88 }, // bas-droite
  ],
  N: [
    { x: 0.20, y: 0.88 }, // bas-gauche
    { x: 0.20, y: 0.12 }, // haut-gauche
    { x: 0.80, y: 0.88 }, // bas-droite
    { x: 0.80, y: 0.12 }, // haut-droite
  ],
  O: [
    { x: 0.50, y: 0.10 }, // haut
    { x: 0.88, y: 0.50 }, // droite
    { x: 0.50, y: 0.90 }, // bas
    { x: 0.12, y: 0.50 }, // gauche
  ],
  P: [
    { x: 0.25, y: 0.12 }, // haut-gauche
    { x: 0.25, y: 0.88 }, // bas
    { x: 0.75, y: 0.22 }, // haut-droite
    { x: 0.75, y: 0.48 }, // milieu-droite
    { x: 0.30, y: 0.50 }, // milieu-gauche
  ],
  Q: [
    { x: 0.50, y: 0.10 }, // haut
    { x: 0.88, y: 0.50 }, // droite
    { x: 0.50, y: 0.88 }, // bas
    { x: 0.12, y: 0.50 }, // gauche
    { x: 0.78, y: 0.82 }, // queue
  ],
  R: [
    { x: 0.25, y: 0.12 }, // haut-gauche
    { x: 0.25, y: 0.88 }, // bas
    { x: 0.75, y: 0.22 }, // haut-droite
    { x: 0.75, y: 0.48 }, // milieu-droite
    { x: 0.30, y: 0.50 }, // milieu-gauche
    { x: 0.82, y: 0.88 }, // jambe-droite
  ],
  S: [
    { x: 0.72, y: 0.18 }, // haut-droite
    { x: 0.28, y: 0.14 }, // haut-gauche
    { x: 0.22, y: 0.38 }, // haut-gauche-courbe
    { x: 0.50, y: 0.50 }, // centre
    { x: 0.78, y: 0.62 }, // bas-droite-courbe
    { x: 0.72, y: 0.86 }, // bas-droite
    { x: 0.28, y: 0.82 }, // bas-gauche
  ],
  T: [
    { x: 0.12, y: 0.12 }, // haut-gauche
    { x: 0.88, y: 0.12 }, // haut-droite
    { x: 0.50, y: 0.12 }, // haut-centre
    { x: 0.50, y: 0.88 }, // bas
  ],
  U: [
    { x: 0.22, y: 0.12 }, // haut-gauche
    { x: 0.22, y: 0.75 }, // bas-gauche
    { x: 0.50, y: 0.90 }, // bas-centre
    { x: 0.78, y: 0.75 }, // bas-droite
    { x: 0.78, y: 0.12 }, // haut-droite
  ],
  V: [
    { x: 0.12, y: 0.12 }, // haut-gauche
    { x: 0.50, y: 0.88 }, // bas-centre
    { x: 0.88, y: 0.12 }, // haut-droite
  ],
  W: [
    { x: 0.10, y: 0.12 }, // haut-gauche
    { x: 0.30, y: 0.80 }, // creux-gauche
    { x: 0.50, y: 0.50 }, // sommet-centre
    { x: 0.70, y: 0.80 }, // creux-droite
    { x: 0.90, y: 0.12 }, // haut-droite
  ],
  X: [
    { x: 0.15, y: 0.12 }, // haut-gauche
    { x: 0.50, y: 0.50 }, // centre
    { x: 0.85, y: 0.88 }, // bas-droite
    { x: 0.85, y: 0.12 }, // haut-droite
    { x: 0.15, y: 0.88 }, // bas-gauche
  ],
  Y: [
    { x: 0.15, y: 0.12 }, // haut-gauche
    { x: 0.50, y: 0.50 }, // centre
    { x: 0.85, y: 0.12 }, // haut-droite
    { x: 0.50, y: 0.88 }, // bas
  ],
  Z: [
    { x: 0.15, y: 0.12 }, // haut-gauche
    { x: 0.85, y: 0.12 }, // haut-droite
    { x: 0.15, y: 0.88 }, // bas-gauche
    { x: 0.85, y: 0.88 }, // bas-droite
  ],
};

/* =============================================
   CHEMINS PAR CHIFFRE
   ============================================= */
const NUMBER_PATHS: Record<string, WP[]> = {
  '1': [
    { x: 0.35, y: 0.22 }, // empattement-haut-gauche
    { x: 0.50, y: 0.12 }, // haut
    { x: 0.50, y: 0.88 }, // bas
  ],
  '2': [
    { x: 0.28, y: 0.22 }, // haut-gauche
    { x: 0.72, y: 0.22 }, // haut-droite
    { x: 0.72, y: 0.45 }, // milieu-droite
    { x: 0.45, y: 0.60 }, // centre
    { x: 0.18, y: 0.88 }, // bas-gauche
    { x: 0.82, y: 0.88 }, // bas-droite
  ],
  '3': [
    { x: 0.25, y: 0.18 }, // haut-gauche
    { x: 0.72, y: 0.22 }, // haut-droite
    { x: 0.65, y: 0.48 }, // milieu-droite
    { x: 0.42, y: 0.50 }, // milieu-centre
    { x: 0.72, y: 0.78 }, // bas-droite
    { x: 0.25, y: 0.82 }, // bas-gauche
  ],
  '4': [
    { x: 0.22, y: 0.12 }, // haut-gauche
    { x: 0.22, y: 0.62 }, // milieu-gauche
    { x: 0.78, y: 0.62 }, // milieu-droite
    { x: 0.72, y: 0.12 }, // haut-droite
    { x: 0.72, y: 0.88 }, // bas-droite
  ],
  '5': [
    { x: 0.78, y: 0.12 }, // haut-droite
    { x: 0.22, y: 0.12 }, // haut-gauche
    { x: 0.22, y: 0.48 }, // milieu-gauche
    { x: 0.72, y: 0.55 }, // milieu-droite
    { x: 0.72, y: 0.80 }, // bas-droite
    { x: 0.28, y: 0.88 }, // bas-gauche
  ],
  '6': [
    { x: 0.72, y: 0.18 }, // haut-droite
    { x: 0.35, y: 0.12 }, // haut-gauche
    { x: 0.18, y: 0.45 }, // gauche
    { x: 0.28, y: 0.85 }, // bas-gauche
    { x: 0.72, y: 0.85 }, // bas-droite
    { x: 0.80, y: 0.62 }, // milieu-droite
    { x: 0.50, y: 0.55 }, // centre
  ],
  '7': [
    { x: 0.18, y: 0.12 }, // haut-gauche
    { x: 0.82, y: 0.12 }, // haut-droite
    { x: 0.30, y: 0.88 }, // bas-gauche
  ],
  '8': [
    { x: 0.50, y: 0.12 }, // haut
    { x: 0.75, y: 0.30 }, // haut-droite
    { x: 0.50, y: 0.50 }, // centre
    { x: 0.75, y: 0.70 }, // bas-droite
    { x: 0.50, y: 0.88 }, // bas
    { x: 0.25, y: 0.70 }, // bas-gauche
    { x: 0.25, y: 0.30 }, // haut-gauche
  ],
  '9': [
    { x: 0.50, y: 0.12 }, // haut
    { x: 0.82, y: 0.38 }, // droite
    { x: 0.72, y: 0.55 }, // bas-droite
    { x: 0.20, y: 0.38 }, // gauche
    { x: 0.50, y: 0.52 }, // centre
    { x: 0.68, y: 0.88 }, // queue-bas
  ],
  '10': [
    // chiffre "1" (gauche)
    { x: 0.18, y: 0.12 }, // 1-haut
    { x: 0.18, y: 0.88 }, // 1-bas
    // chiffre "0" (droite)
    { x: 0.62, y: 0.10 }, // 0-haut
    { x: 0.88, y: 0.50 }, // 0-droite
    { x: 0.62, y: 0.90 }, // 0-bas
    { x: 0.42, y: 0.50 }, // 0-gauche
  ],
};

interface TracingScreenProps {
  onBack: () => void;
}

export default function TracingScreen({ onBack }: TracingScreenProps) {
  const [mode, setMode] = useState<TraceMode>('letters');
  const [index, setIndex] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [visited, setVisited] = useState<boolean[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const visitedRef = useRef<boolean[]>([]);
  const successFiredRef = useRef(false);
  const { speak } = useSpeech();

  const items = mode === 'letters' ? ALPHABET_DATA : NUMBERS_DATA;
  const current = items[index];
  const label = 'word' in current ? current.key : String(current.digit);
  const hint = 'word' in current ? `${current.emoji} ${current.word}` : current.name;
  const paths = mode === 'letters' ? LETTER_PATHS : NUMBER_PATHS;
  const waypoints: WP[] = paths[label] ?? [];

  const progress = waypoints.length > 0
    ? visited.filter(Boolean).length / waypoints.length
    : 0;

  // ---- Canvas helpers ----

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // ---- Reset on letter/mode change ----

  const resetState = useCallback((wps: WP[]) => {
    clearCanvas();
    const fresh = Array(wps.length).fill(false);
    visitedRef.current = fresh;
    setVisited(fresh);
    successFiredRef.current = false;
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }, [clearCanvas]);

  useEffect(() => {
    resizeCanvas();
    const wps = (mode === 'letters' ? LETTER_PATHS : NUMBER_PATHS)[
      mode === 'letters'
        ? (ALPHABET_DATA[index]?.key ?? '')
        : (NUMBERS_DATA[index]?.key ?? '')
    ] ?? [];
    resetState(wps);

    const timer = setTimeout(() => {
      if ('word' in current) speak(`${current.key} comme ${current.word}`);
      else speak(current.name);
    }, 300);
    return () => clearTimeout(timer);
  }, [index, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Success ----

  const triggerSuccess = useCallback(() => {
    if (successFiredRef.current) return;
    successFiredRef.current = true;
    setCelebrating(true);
    setShowConfetti(true);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = SUCCESS_COLOR;
        ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    speak('Bravo ! Très bien tracé !');
    setTimeout(() => {
      setShowConfetti(false);
      setCelebrating(false);
      setIndex(i => (i + 1) % items.length);
    }, 2200);
  }, [speak, items.length]);

  // ---- Drawing ----

  const getPos = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startStroke = useCallback((pos: { x: number; y: number }) => {
    if (celebrating) return;
    isDrawingRef.current = true;
    lastPosRef.current = pos;
  }, [celebrating]);

  const continueStroke = useCallback((pos: { x: number; y: number }) => {
    if (!isDrawingRef.current || celebrating || !lastPosRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw stroke
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Check waypoints
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const hitRadius = HIT_RADIUS_RATIO * Math.min(W, H);

    let changed = false;
    const newVisited = [...visitedRef.current];

    waypoints.forEach((wp, i) => {
      if (newVisited[i]) return; // already visited
      const wpX = wp.x * W;
      const wpY = wp.y * H;
      const dx = pos.x - wpX;
      const dy = pos.y - wpY;
      if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) {
        newVisited[i] = true;
        changed = true;
      }
    });

    if (changed) {
      visitedRef.current = newVisited;
      setVisited([...newVisited]);
      if (newVisited.every(Boolean)) {
        triggerSuccess();
      }
    }

    lastPosRef.current = pos;
  }, [celebrating, waypoints, triggerSuccess]);

  const endStroke = useCallback(() => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }, []);

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (c) startStroke(getPos(e.nativeEvent, c));
  };
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (c) continueStroke(getPos(e.nativeEvent, c));
  };

  // Touch handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); startStroke(getPos(e.touches[0], canvas)); };
    const onTouchMove  = (e: TouchEvent) => { e.preventDefault(); continueStroke(getPos(e.touches[0], canvas)); };
    const onTouchEnd   = (e: TouchEvent) => { e.preventDefault(); endStroke(); };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('touchend',   onTouchEnd);
    };
  }, [startStroke, continueStroke, endStroke]);

  const switchMode = (m: TraceMode) => { setMode(m); setIndex(0); };
  const skipItem = () => {
    setCelebrating(false);
    setShowConfetti(false);
    setIndex(i => (i + 1) % items.length);
  };

  return (
    <div className="page page-tracing">
      <header className="screen-header">
        <BackButton onBack={onBack} />
        <h2>Tracé</h2>
        <div className="header-spacer" />
      </header>

      <div className="tab-row">
        <button className={`tab-btn ${mode === 'letters' ? 'active' : ''}`} onClick={() => switchMode('letters')}>🔤 Lettres</button>
        <button className={`tab-btn ${mode === 'numbers' ? 'active' : ''}`} onClick={() => switchMode('numbers')}>🔢 Chiffres</button>
      </div>

      <div className="tracing-area">
        {/* Lettre guide en arrière-plan */}
        <div className="tracing-guide" aria-hidden="true">{label}</div>

        {/* Points de passage à atteindre */}
        {waypoints.map((wp, i) => (
          <div
            key={i}
            className={`tracing-wp ${visited[i] ? 'visited' : ''}`}
            style={{ left: `${wp.x * 100}%`, top: `${wp.y * 100}%` }}
            aria-hidden="true"
          />
        ))}

        {/* Canvas de dessin */}
        <canvas
          ref={canvasRef}
          className="tracing-canvas"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endStroke}
          onMouseLeave={endStroke}
        />

        {celebrating && <div className="tracing-star">⭐</div>}
      </div>

      <div className="tracing-footer">
        <div className="tracing-hint">{hint}</div>
        <div className="tracing-progress-bar-track">
          <div
            className="tracing-progress-bar-fill"
            style={{
              width: `${progress * 100}%`,
              background: progress >= 1 ? SUCCESS_COLOR : STROKE_COLOR,
            }}
          />
        </div>
        <div className="tracing-nav">
          <span className="tracing-counter">{index + 1} / {items.length}</span>
          <button className="btn-skip" onClick={skipItem}>Suivant →</button>
        </div>
      </div>

      <Confetti active={showConfetti} />
    </div>
  );
}
