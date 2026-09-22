import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';

interface AnimatedBorderBeamProps {
  /** Radius sudut (px), disesuaikan dengan rounded-3xl (24px) */
  radius?: number;
  /** Durasi satu putaran penuh mengelilingi kartu dalam detik */
  duration?: number;
  /** Panjang garis semu merah yang bergerak (px) */
  beamLength?: number;
  /** Warna utama garis semu merah */
  color?: string;
  /** Ketebalan garis outline */
  strokeWidth?: number;
}

export default function AnimatedBorderBeam({
  radius = 24,
  duration = 5,
  beamLength = 160,
  color = '#ef4444',
  strokeWidth = 2,
}: AnimatedBorderBeamProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  // Default perkiraan ukuran card max-w-md untuk menghindari keterlambatan render pertama
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 448, height: 580 });

  useEffect(() => {
    const parent = svgRef.current?.parentElement;
    if (!parent) return;

    const updateSize = () => {
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      if (w > 0 && h > 0) {
        setSize({ width: w, height: h });
      }
    };

    updateSize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateSize);
      ro.observe(parent);
    }

    return () => {
      if (ro) ro.disconnect();
    };
  }, []);

  // Hitung keliling presisi bangun persegi panjang dengan 4 sudut melengkung (rounded rectangle)
  // Perimeter = 2*(w - 2r) + 2*(h - 2r) + 2*PI*r
  const r = Math.min(radius, Math.floor(size.width / 2), Math.floor(size.height / 2));
  const perimeter = Math.max(100, Math.round(2 * (size.width + size.height) - r * (8 - 2 * Math.PI)));
  const effectiveBeam = Math.min(beamLength, Math.round(perimeter * 0.35));

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible rounded-[inherit] z-20"
      style={{
        width: '100%',
        height: '100%',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Filter pendaran semu merah (glowing aura) */}
        <filter id="borderBeamGlowEffect" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradien warna pudar untuk ekor garis semu merah */}
        <linearGradient id="borderBeamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f87171" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#ef4444" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* 1. Lapisan Aura Pendaran Luar (Soft Glowing Halo) */}
      <motion.rect
        x="0.5"
        y="0.5"
        width={Math.max(0, size.width - 1)}
        height={Math.max(0, size.height - 1)}
        rx={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth + 2.5}
        strokeLinecap="round"
        strokeDasharray={`${Math.round(effectiveBeam * 1.15)} ${Math.round(perimeter - effectiveBeam * 1.15)}`}
        strokeOpacity="0.45"
        filter="url(#borderBeamGlowEffect)"
        animate={{ strokeDashoffset: [0, -perimeter] }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* 2. Garis Inti Semu Merah (Core Crimson Beam) */}
      <motion.rect
        x="0.5"
        y="0.5"
        width={Math.max(0, size.width - 1)}
        height={Math.max(0, size.height - 1)}
        rx={r}
        fill="none"
        stroke="url(#borderBeamGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${effectiveBeam} ${perimeter - effectiveBeam}`}
        strokeOpacity="0.95"
        animate={{ strokeDashoffset: [0, -perimeter] }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* 3. Titik Kilau Putih-Merah di Ujung Terdepan (Leading Spark Highlight) */}
      <motion.rect
        x="0.5"
        y="0.5"
        width={Math.max(0, size.width - 1)}
        height={Math.max(0, size.height - 1)}
        rx={r}
        fill="none"
        stroke="#ffffff"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`6 ${perimeter - 6}`}
        strokeOpacity="0.9"
        animate={{ strokeDashoffset: [0, -perimeter] }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </svg>
  );
}
