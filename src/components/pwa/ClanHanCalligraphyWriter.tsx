'use client';

import React, { useState, useEffect, useId } from 'react';
import { CLAN_HAN_CALLIGRAPHY_PATH } from '@/components/icons/ClanHanLogo';

export interface ClanHanCalligraphyWriterProps {
  size?: number;
  className?: string;
  strokeColor?: string;
  outlineColor?: string;
  showOutline?: boolean;
  onComplete?: () => void;
  isLivingIdle?: boolean;
  autoStart?: boolean;
  interactive?: boolean;
}

/**
 * 8 nét cọ theo thứ tự bút thuận truyền thống của chữ Hán "Phạm" (范):
 * 1. Nét hoành ngắn (Thảo đầu trái)
 * 2. Nét thụ ngắn (Thảo đầu trái)
 * 3. Nét thụ ngắn (Thảo đầu phải)
 * 4. Nét hoành (Thảo đầu phải)
 * 5. Nét chấm thủy trên
 * 6. Nét thủy dưới (dài, lượn hất)
 * 7. Nét phẩy thân chữ
 * 8. Nét hoành triết loan câu (bộ Tỵ) lượn đáy hất lên
 */
export const CLAN_HAN_STROKES = [
  { d: 'M 19 28 L 45 26', duration: 0.18, delay: 0 },
  { d: 'M 32 8 L 32 39', duration: 0.20, delay: 0.18 },
  { d: 'M 56 6 L 53 40', duration: 0.20, delay: 0.38 },
  { d: 'M 48 20 L 76 21', duration: 0.18, delay: 0.58 },
  { d: 'M 23 42 L 36 55', duration: 0.16, delay: 0.76 },
  { d: 'M 15 57 C 14 72 16 83 20 89 L 24 94', duration: 0.26, delay: 0.92 },
  { d: 'M 59 37 C 54 46 45 54 34 60', duration: 0.22, delay: 1.18 },
  { d: 'M 41 48 L 59 38 L 54 62 C 44 60 40 75 40 82 C 42 93 62 93 72 92 C 80 91 84 86 85 88', duration: 0.38, delay: 1.40 },
];

/**
 * Component Múa Bút Thư Pháp Logo Dòng Họ (Clan Han Calligraphy Writer)
 * - Sử dụng trực tiếp vector thư pháp dày dặn của Logo dòng họ (CLAN_HAN_CALLIGRAPHY_PATH).
 * - Sử dụng kỹ thuật SVG Mask Reveal: 8 đường cọ tâm màu trắng dày 19px chạy theo thứ tự bút thuận để quét mở hình bao thư pháp của cụ tổ.
 * - Chuẩn xác 100% hình thái của Logo, không phụ thuộc font máy tính thanh mảnh.
 * - Hỗ trợ trạng thái Living Idle State (hào quang thở ngọc bích) khi chờ nạp dữ liệu.
 */
export default function ClanHanCalligraphyWriter({
  size = 120,
  className = '',
  strokeColor = '#059669',
  outlineColor = 'rgba(5, 150, 105, 0.12)',
  showOutline = true,
  onComplete,
  isLivingIdle = false,
  autoStart = true,
  interactive = true,
}: ClanHanCalligraphyWriterProps) {
  const [animKey, setAnimKey] = useState(0);
  const [isFinished, setIsFinished] = useState(!autoStart);
  const [isAnimating, setIsAnimating] = useState(autoStart);
  const rawId = useId();
  const maskId = `clan-brush-mask-${rawId.replace(/:/g, '')}`;

  useEffect(() => {
    if (!autoStart) return;

    setIsAnimating(true);
    setIsFinished(false);

    // Tổng thời gian hoàn thành 8 nét: 1.40s + 0.38s = 1.78s
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setIsFinished(true);
      if (onComplete) onComplete();
    }, 1800);

    return () => clearTimeout(timer);
  }, [animKey, autoStart, onComplete]);

  const handleReplay = () => {
    if (!interactive || isAnimating) return;
    setAnimKey((prev) => prev + 1);
  };

  const livingIdleGlow =
    isFinished && isLivingIdle
      ? 'animate-pulse drop-shadow-[0_0_16px_rgba(5,150,105,0.45)]'
      : '';

  return (
    <div
      onClick={handleReplay}
      className={`relative inline-flex items-center justify-center select-none transition-all duration-700 ${livingIdleGlow} ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      title={interactive ? 'Chạm vào để xem lại nét múa bút thư pháp' : undefined}
      aria-label="Thư pháp chữ Hán Phạm"
      data-testid="clan-han-calligraphy-writer"
    >
      <style>{`
        @keyframes clanBrushDraw {
          0% {
            stroke-dashoffset: 120;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="w-full h-full overflow-visible"
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
            {/* Nền đen chặn toàn bộ khi chưa vẽ */}
            <rect width="100" height="100" fill="black" />
            {/* 8 nét cọ tâm màu trắng mở dần hình bao thư pháp */}
            <g
              stroke="white"
              strokeWidth="19"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            >
              {CLAN_HAN_STROKES.map((stroke, index) => {
                const isDrawn = isFinished;
                const style: React.CSSProperties = isDrawn
                  ? { strokeDasharray: 120, strokeDashoffset: 0 }
                  : isAnimating
                  ? {
                      strokeDasharray: 120,
                      strokeDashoffset: 120,
                      animation: `clanBrushDraw ${stroke.duration}s cubic-bezier(0.25, 0.1, 0.25, 1) forwards ${stroke.delay}s`,
                    }
                  : { strokeDasharray: 120, strokeDashoffset: 120 };

                return <path key={`${animKey}-${index}`} d={stroke.d} style={style} />;
              })}
            </g>
          </mask>
        </defs>

        {/* Nét bóng mờ khung chữ (chỉ dẫn cọ thư pháp thanh tao) */}
        {showOutline && (
          <path
            d={CLAN_HAN_CALLIGRAPHY_PATH}
            fill={outlineColor}
            fillRule="evenodd"
            className="transition-opacity duration-500"
          />
        )}

        {/* Nét chữ thư pháp chính thức màu xanh ngọc bích lộ dần qua mặt nạ SVG */}
        <path
          d={CLAN_HAN_CALLIGRAPHY_PATH}
          fill={strokeColor}
          fillRule="evenodd"
          mask={`url(#${maskId})`}
        />
      </svg>
    </div>
  );
}
