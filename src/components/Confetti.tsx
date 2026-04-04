import { useEffect, useRef } from 'react';
import { CONFETTI_COLORS } from '../data/quiz';

interface ConfettiProps {
  active: boolean;
}

export default function Confetti({ active }: ConfettiProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    for (let i = 0; i < 24; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const size = 8 + Math.random() * 8;
      piece.style.cssText = `
        left: ${Math.random() * 100}%;
        background: ${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
        animation-delay: ${Math.random() * 0.5}s;
        animation-duration: ${1.2 + Math.random() * 0.8}s;
        width: ${size}px;
        height: ${size}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      `;
      container.appendChild(piece);
    }

    const timer = setTimeout(() => {
      if (container) container.innerHTML = '';
    }, 2400);

    return () => clearTimeout(timer);
  }, [active]);

  return <div ref={containerRef} className="confetti-container" />;
}
