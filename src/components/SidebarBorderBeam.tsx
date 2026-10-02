import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';

interface SidebarBorderBeamProps {
  /** Durasi satu siklus meluncur dari atas ke bawah (detik) */
  duration?: number;
  /** Panjang berkas garis merah yang berjalan (px) */
  beamLength?: number;
  /** Warna utama garis laser */
  color?: string;
  /** Ketebalan garis inti (px) */
  strokeWidth?: number;
}

/**
 * SidebarBorderBeam
 * Animasi garis merah vertikal yang meluncur halus dari atas ke bawah di outerline sisi kanan sidebar.
 * Terinspirasi dari estetika AnimatedBorderBeam di halaman Login:
 * - Aura pendaran lembut (soft glow halo)
 * - Garis inti gradien crimson Telkom Akses
 * - Titik kilau (spark highlight) di ujung terdepan
 * Dirancang tetap rapi, presisi di atas garis border-r, dan tidak mengganggu kenyamanan pengguna.
 */
export default function SidebarBorderBeam({
  duration = 4.2,
  beamLength = 160,
  color = '#ef4444',
  strokeWidth = 2,
}: SidebarBorderBeamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.max(400, window.innerHeight - 69);
    }
    return 750;
  });

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const updateHeight = () => {
      const h = parent.offsetHeight;
      if (h > 0) {
        setHeight(h);
      }
    };

    updateHeight();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateHeight);
      ro.observe(parent);
    }

    window.addEventListener('resize', updateHeight);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute top-0 bottom-0 -right-[4.5px] w-[9px] pointer-events-none overflow-hidden z-20 select-none"
      aria-hidden="true"
    >
      <motion.div
        key={height}
        initial={{ y: -beamLength }}
        animate={{ y: height + 24 }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          width: `${strokeWidth}px`,
          height: `${beamLength}px`,
        }}
      >
        {/* 1. Lapisan Aura Pendaran Luar (Soft Glowing Halo) */}
        <div
          className="absolute inset-0 rounded-full blur-[3px]"
          style={{
            background: `linear-gradient(to bottom, rgba(239, 68, 68, 0) 0%, rgba(239, 68, 68, 0.25) 30%, rgba(239, 68, 68, 0.6) 75%, ${color} 100%)`,
            transform: 'scaleX(2.8)',
            opacity: 0.85,
          }}
        />

        {/* 2. Garis Inti Laser Merah (Core Crimson Beam) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(to bottom, rgba(248, 113, 113, 0) 0%, rgba(239, 68, 68, 0.3) 25%, rgba(239, 68, 68, 0.85) 70%, #dc2626 92%, #ffffff 100%)`,
            boxShadow: `0 0 6px 1px rgba(239, 68, 68, 0.75), 0 0 12px 2px rgba(220, 38, 38, 0.35)`,
          }}
        />

        {/* 3. Titik Kilau Putih-Merah di Ujung Terdepan (Leading Spark Highlight) */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-2 rounded-full bg-white"
          style={{
            boxShadow: `0 0 4px 1px #ffffff, 0 0 8px 2px #ef4444, 0 0 14px 4px rgba(220, 38, 38, 0.6)`,
          }}
        />
      </motion.div>
    </div>
  );
}
