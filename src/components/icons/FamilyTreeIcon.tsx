import React from 'react';

export interface FamilyTreeIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
  strokeWidth?: number | string;
}

/**
 * FamilyTreeIcon - Biểu tượng Cây Phả Hệ chuẩn 3 ô vuông
 * - 1 ô vuông thế hệ tiền nhân ở trên
 * - Trục gia tộc nối xuống rẽ 2 nhánh hạ xuống
 * - 2 ô vuông thế hệ hậu duệ ở dưới
 */
export default function FamilyTreeIcon({
  className = 'w-4 h-4',
  size,
  strokeWidth = 2,
  ...props
}: FamilyTreeIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Ô vuông thế hệ tiền nhân ở trên */}
      <rect x="9" y="3" width="6" height="5" rx="1" />

      {/* Trục liên kết đi xuống rẽ nhánh */}
      <path d="M12 8v4" />
      <path d="M6 12h12" />
      <path d="M6 12v4" />
      <path d="M18 12v4" />

      {/* 2 Ô vuông thế hệ hậu duệ ở dưới */}
      <rect x="3" y="16" width="6" height="5" rx="1" />
      <rect x="15" y="16" width="6" height="5" rx="1" />
    </svg>
  );
}
