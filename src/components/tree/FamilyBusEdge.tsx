'use client';

import React from 'react';
import { BaseEdge, type EdgeProps } from '@xyflow/react';

export const FamilyBusEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  data,
}) => {
  // Cao độ thanh ngang chung (Bus Line): Ưu tiên data.busY từ layout engine,
  // nếu không có thì fallback về trung điểm (sourceY + (targetY - sourceY) / 2)
  const busY =
    typeof (data as any)?.busY === 'number'
      ? (data as any).busY
      : sourceY + (targetY - sourceY) / 2;

  // Định tuyến đường đi thước thợ vuông góc 90 độ dứt khoát:
  // 1. Đi thẳng đứng từ cha mẹ (sourceX, sourceY) xuống cao độ busY
  // 2. Chạy ngang từ sourceX sang targetX tại đúng cao độ busY
  // 3. Cắm thẳng đứng từ (targetX, busY) xuống đỉnh thẻ con (targetX, targetY)
  const path = `M ${sourceX} ${sourceY} V ${busY} H ${targetX} V ${targetY}`;

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke: '#059669',
        strokeWidth: 1.5,
        ...style,
      }}
      markerEnd={markerEnd}
    />
  );
};

FamilyBusEdge.displayName = 'FamilyBusEdge';
