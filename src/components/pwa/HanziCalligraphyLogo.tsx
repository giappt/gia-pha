'use client';

import React, { useEffect, useRef, useState } from 'react';
import { HANZI_FAN_DATA } from '@/lib/pwa/hanzi-fan-data';

export interface HanziCalligraphyLogoProps {
  size?: number;
  className?: string;
  strokeColor?: string;
  outlineColor?: string;
  showOutline?: boolean;
  strokeAnimationSpeed?: number;
  delayBetweenStrokes?: number;
  onComplete?: () => void;
  isLivingIdle?: boolean;
  interactive?: boolean;
  autoStart?: boolean;
  badgeContainer?: boolean;
}

/**
 * Component Hiển thị Thư pháp chữ Hán "Phạm" (范) múa bút theo đúng thứ tự bút thuận 8 nét.
 * Sử dụng hanzi-writer kết hợp dữ liệu vector tĩnh local (offline 100%).
 * Hỗ trợ trạng thái Chờ Sống Động (Living Idle State) hào quang thở ngọc bích khi data chưa nạp xong.
 */
export default function HanziCalligraphyLogo({
  size = 72,
  className = '',
  strokeColor = '#059669',
  outlineColor = 'rgba(5, 150, 105, 0.15)',
  showOutline = true,
  strokeAnimationSpeed = 1.3,
  delayBetweenStrokes = 120,
  onComplete,
  isLivingIdle = false,
  interactive = true,
  autoStart = true,
  badgeContainer = false,
}: HanziCalligraphyLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    // Dynamic import hanzi-writer client-side an toàn
    import('hanzi-writer').then(({ default: HanziWriter }) => {
      if (isCancelled || !containerRef.current) return;

      containerRef.current.innerHTML = '';
      const writer = HanziWriter.create(containerRef.current, '范', {
        width: size,
        height: size,
        padding: Math.max(4, Math.round(size * 0.06)),
        strokeColor: strokeColor,
        outlineColor: outlineColor,
        showOutline: showOutline,
        strokeAnimationSpeed: strokeAnimationSpeed,
        delayBetweenStrokes: delayBetweenStrokes,
        charDataLoader: () => HANZI_FAN_DATA,
      });

      writerRef.current = writer;

      if (autoStart) {
        setIsAnimating(true);
        writer.animateCharacter({
          onComplete: () => {
            if (!isCancelled) {
              setIsFinished(true);
              setIsAnimating(false);
              if (onComplete) onComplete();
            }
          },
        });
      }
    }).catch(err => {
      console.error('Không thể khởi tạo HanziWriter:', err);
    });

    return () => {
      isCancelled = true;
    };
  }, [size, strokeColor, outlineColor, showOutline, strokeAnimationSpeed, delayBetweenStrokes, autoStart, onComplete]);

  const handleReplay = () => {
    if (!interactive || isAnimating || !writerRef.current) return;
    setIsAnimating(true);
    writerRef.current.animateCharacter({
      onComplete: () => {
        setIsAnimating(false);
        setIsFinished(true);
        if (onComplete) onComplete();
      },
    });
  };

  const livingIdleGlow = isFinished && isLivingIdle
    ? 'animate-pulse drop-shadow-[0_0_14px_rgba(5,150,105,0.45)]'
    : '';

  const logoNode = (
    <div
      ref={containerRef}
      onClick={handleReplay}
      className={`relative inline-flex items-center justify-center select-none transition-all duration-700 ${livingIdleGlow} ${interactive ? 'cursor-pointer' : ''}`}
      style={{ width: size, height: size }}
      title={interactive ? 'Chạm vào để xem lại nét chữ thư pháp' : undefined}
      aria-label="Thư pháp chữ Hán Phạm"
    />
  );

  if (badgeContainer) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-md ${className}`}
        style={{ padding: Math.round(size * 0.15) }}
      >
        {logoNode}
      </div>
    );
  }

  return <div className={`inline-flex items-center justify-center ${className}`}>{logoNode}</div>;
}
