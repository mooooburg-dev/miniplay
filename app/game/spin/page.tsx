'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAudio } from '@/hooks/useAudio';
import { trackEvent } from '@/lib/gtag';

const PARTICLE_EMOJIS = ['⭐', '🌟', '💫', '🎉', '🎊', '✨', '🎆', '🎇', '🥳', '🍭'];

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  tx: string;
  ty: string;
  rot: string;
  size: number;
  delay: number;
}

const ACCENT = '#e91e63';
const SHADOW = '#f48fb1';
const SPIN_MIN_TURNS = 5;
const SPIN_MAX_TURNS = 10;
const SPIN_DURATION_MS = 3500;

type Phase = 'idle' | 'spinning' | 'done';

export default function SpinPage() {
  const router = useRouter();
  const { playClick, playFanfare, playPop } = useAudio();

  const [phase, setPhase] = useState<Phase>('idle');
  const [rotation, setRotation] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  const spin = useCallback(() => {
    if (phase !== 'idle') return;
    trackEvent('game_start', { game_name: 'spin' });
    playClick();
    setPhase('spinning');

    const extraTurns =
      SPIN_MIN_TURNS + Math.random() * (SPIN_MAX_TURNS - SPIN_MIN_TURNS);
    const totalDeg = rotation + extraTurns * 360;

    setRotation(totalDeg);

    setTimeout(() => {
      setPhase('done');
      playFanfare();
      playPop();

      // 파티클 생성
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const newParticles: Particle[] = Array.from({ length: 24 }, (_, i) => {
        const angle = Math.random() * 360;
        const dist = 180 + Math.random() * 350;
        return {
          id: i,
          emoji: PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)],
          x: cx,
          y: cy,
          tx: `${Math.cos((angle * Math.PI) / 180) * dist}px`,
          ty: `${Math.sin((angle * Math.PI) / 180) * dist - 80}px`,
          rot: `${(Math.random() - 0.5) * 720}deg`,
          size: 1.2 + Math.random() * 1.4,
          delay: Math.random() * 0.2,
        };
      });
      setParticles(newParticles);
    }, SPIN_DURATION_MS - 300);
  }, [phase, rotation, playClick, playFanfare, playPop]);

  const reset = useCallback(() => {
    setPhase('idle');
    setParticles([]);
  }, []);

  return (
    <div className="game-screen">
      {/* 파티클 */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="fixed pointer-events-none z-50 animate-particle-fly"
          style={{
            left: p.x,
            top: p.y,
            fontSize: `${p.size}rem`,
            animationDelay: `${p.delay}s`,
            ['--tx' as string]: p.tx,
            ['--ty' as string]: p.ty,
            ['--rot' as string]: p.rot,
          }}
        >
          {p.emoji}
        </span>
      ))}

      <button
        onClick={() => router.push('/')}
        className="fixed top-4 left-4 z-50 bg-white/70 backdrop-blur-md border border-white/80 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base text-gray-400 font-jua shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-90 transition-all hover:bg-white/90"
      >
        ← 홈으로
      </button>

      <h1
        className="text-3xl sm:text-4xl md:text-5xl font-jua mb-2"
        style={{ color: ACCENT }}
      >
        👉 화살표 스핀
      </h1>

      <p className="text-sm sm:text-base text-gray-400 font-jua mb-6">
        핸드폰을 가운데에 놓고 돌려보세요!
      </p>

      {/* 화살표 영역 */}
      <div
        className="relative w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px] rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, #fff, #fce4ec)',
          boxShadow: `0 8px 0 ${SHADOW}, 0 14px 32px rgba(233,30,99,0.18)`,
        }}
      >
        {/* 화살표 */}
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition:
              phase === 'spinning'
                ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.33, 1, 0.68, 1)`
                : undefined,
          }}
        >
          <svg width="80%" height="80%" viewBox="0 0 120 120">
            {/* 화살표 몸통 */}
            <line
              x1="60"
              y1="65"
              x2="60"
              y2="22"
              stroke={ACCENT}
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* 화살표 머리 */}
            <polygon points="60,6 46,28 74,28" fill={ACCENT} />
            {/* 중앙 원 */}
            <circle cx="60" cy="65" r="12" fill={ACCENT} />
            <circle cx="60" cy="65" r="6" fill="white" />
          </svg>
        </div>
      </div>

      {/* 메시지 */}
      <p
        className={`text-xl sm:text-2xl font-jua mt-6 min-h-[2rem] transition-all duration-300 ${
          phase === 'done' ? 'scale-110' : ''
        }`}
        style={{ color: ACCENT }}
      >
        {phase === 'idle' && '터치해서 돌리기! 🌀'}
        {phase === 'spinning' && '빙글빙글~ 🌀'}
        {phase === 'done' && '🎉 당첨! 🎉'}
      </p>

      {/* 스핀 / 다시 버튼 */}
      {phase === 'done' ? (
        <button
          onClick={() => {
            playClick();
            reset();
          }}
          className="relative mt-5 px-11 py-4 sm:px-14 sm:py-5 text-2xl sm:text-3xl md:text-4xl font-jua text-white rounded-full action-btn active:translate-y-1 transition-transform"
          style={{
            background: `linear-gradient(145deg, ${ACCENT}, #f06292)`,
            boxShadow: '0 8px 0 #c2185b',
          }}
        >
          🔄 다시 돌리기
        </button>
      ) : (
        <button
          onClick={spin}
          disabled={phase !== 'idle'}
          className="relative mt-5 px-11 py-4 sm:px-14 sm:py-5 text-2xl sm:text-3xl md:text-4xl font-jua text-white rounded-full action-btn disabled:opacity-50 active:translate-y-1 transition-transform"
          style={{
            background: `linear-gradient(145deg, ${ACCENT}, #f06292)`,
            boxShadow: '0 8px 0 #c2185b',
          }}
        >
          🌀 {phase === 'idle' ? '돌려!' : '돌아가는 중...'}
        </button>
      )}
    </div>
  );
}
