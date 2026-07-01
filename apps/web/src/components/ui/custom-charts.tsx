'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatLKR = (n: number) => {
  if (n >= 1000000000) return `LKR ${(n / 1000000000).toFixed(2)}B`;
  if (n >= 1000000) return `LKR ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `LKR ${(n / 1000).toFixed(0)}K`;
  return `LKR ${n.toLocaleString()}`;
};

// ── Types ───────────────────────────────────────────────────────────────────

interface DonutChartData {
  label: string;
  value: number;
  color: string; // Tailwind color class or hex, e.g. '#f59e0b'
}

interface DonutChartProps {
  data: DonutChartData[];
  title?: string;
  subtitle?: string;
  valuePrefix?: string;
  isCurrency?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DONUT CHART COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function DonutChart({
  data,
  title,
  subtitle = 'Total spent',
  valuePrefix = '',
  isCurrency = true
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string; visible: boolean }>({
    x: 0,
    y: 0,
    content: '',
    visible: false
  });

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // SVG parameters
  const size = 200;
  const radius = 70;
  const strokeWidth = 18;
  const activeStrokeWidth = 24;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate starting angles (cumulative progress)
  let accumulatedPercent = 0;

  const handleMouseMove = (e: React.MouseEvent, content: string, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Tooltip positioned relative to the container
    setTooltip({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 10,
      content,
      visible: true
    });
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setHoveredIndex(null);
  };

  const getDisplayValue = (val: number) => {
    return isCurrency ? formatLKR(val) : `${valuePrefix}${val.toLocaleString()}`;
  };

  return (
    <div className="relative flex flex-col sm:flex-row items-center justify-center gap-6 p-2 w-full">
      {/* SVG Container */}
      <div className="relative w-[200px] h-[200px] flex-shrink-0 select-none">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-100 dark:text-zinc-800/50"
          />
          {total > 0 && data.map((item, idx) => {
            const percentage = item.value / total;
            const strokeLength = percentage * circumference;
            const strokeOffset = circumference - (accumulatedPercent * circumference);
            
            // Advance accumulated percent for next segment
            accumulatedPercent += percentage;

            const isHovered = hoveredIndex === idx;
            const isAnyHovered = hoveredIndex !== null;

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? activeStrokeWidth : strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                style={{
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: isAnyHovered ? (isHovered ? 1 : 0.4) : 1,
                  cursor: 'pointer',
                }}
                onMouseMove={(e) => {
                  const pctText = `${(percentage * 100).toFixed(0)}%`;
                  handleMouseMove(e, `${item.label}: ${getDisplayValue(item.value)} (${pctText})`, idx);
                }}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
          {hoveredIndex !== null ? (
            <>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider truncate max-w-[130px]">
                {data[hoveredIndex].label}
              </p>
              <p className="text-sm font-black text-zinc-800 dark:text-white mt-0.5">
                {getDisplayValue(data[hoveredIndex].value)}
              </p>
              <p className="text-xs font-bold text-amber-500 mt-0.5">
                {((data[hoveredIndex].value / (total || 1)) * 100).toFixed(0)}%
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {subtitle}
              </p>
              <p className="text-base font-black text-zinc-800 dark:text-white mt-0.5">
                {getDisplayValue(total)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Legends */}
      <div className="flex-1 space-y-2 min-w-[140px] w-full">
        {title && <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{title}</h4>}
        <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
          {data.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                  isHovered
                    ? 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700'
                    : 'bg-transparent border-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40'
                }`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 ml-2 flex-shrink-0">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute z-50 pointer-events-none bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl shadow-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-all duration-100"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GROUPED BAR CHART COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface GroupedBarChartSeries {
  key: string;
  name: string;
  color: string; // Hex or CSS color, e.g. '#f59e0b'
}

interface GroupedBarChartProps {
  data: any[]; // Array of objects containing x-label and series keys
  xAxisKey: string; // e.g. 'code' or 'name'
  series: GroupedBarChartSeries[];
  height?: number;
  isCurrency?: boolean;
}

export function GroupedBarChart({
  data,
  xAxisKey,
  series,
  height = 240,
  isCurrency = true
}: GroupedBarChartProps) {
  const [hoveredBar, setHoveredBar] = useState<{ itemIdx: number; seriesIdx: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; label: string; value: string; visible: boolean }>({
    x: 0,
    y: 0,
    title: '',
    label: '',
    value: '',
    visible: false
  });

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-zinc-400 py-8" style={{ height }}>
        No chart data available
      </div>
    );
  }

  // Layout parameters
  const paddingLeft = 65;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 40;

  // Find max value in data to scale Y-axis
  let maxVal = 0;
  data.forEach(item => {
    series.forEach(s => {
      const val = Number(item[s.key]) || 0;
      if (val > maxVal) maxVal = val;
    });
  });

  // Round up maxVal to a nice number
  const roundToNiceNumber = (val: number) => {
    if (val === 0) return 100;
    const order = Math.pow(10, Math.floor(Math.log10(val)));
    const normalized = val / order;
    let nice = 10;
    if (normalized <= 1) nice = 1;
    else if (normalized <= 2) nice = 2;
    else if (normalized <= 5) nice = 5;
    else nice = 10;
    return nice * order;
  };

  const yMax = roundToNiceNumber(maxVal);
  const yTicks = 4;

  const handleMouseMove = (e: React.MouseEvent, itemIdx: number, seriesIdx: number, item: any, s: GroupedBarChartSeries) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const val = Number(item[s.key]) || 0;
    const formattedVal = isCurrency ? formatLKR(val) : val.toLocaleString();

    setTooltip({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 20,
      title: item.name || item[xAxisKey],
      label: s.name,
      value: formattedVal,
      visible: true
    });
    setHoveredBar({ itemIdx, seriesIdx });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setHoveredBar(null);
  };

  return (
    <div className="relative w-full p-1 select-none">
      {/* SVG rendering */}
      <div className="w-full" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          <g>
            {/* Draw Y Grid Lines & Labels */}
            {Array.from({ length: yTicks + 1 }).map((_, idx) => {
              const ratio = idx / yTicks;
              // Y coordinates go from top to bottom
              const y = paddingTop + (1 - ratio) * (height - paddingTop - paddingBottom);
              const val = ratio * yMax;
              const formattedVal = isCurrency
                ? val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)
                : val.toFixed(0);

              return (
                <g key={idx} className="text-zinc-300 dark:text-zinc-800/50">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={`calc(100% - ${paddingRight}px)`}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth={1}
                    strokeDasharray={idx === 0 ? undefined : '4 4'}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="currentColor"
                    className="text-xs font-bold text-zinc-400"
                  >
                    {formattedVal}
                  </text>
                </g>
              );
            })}

            {/* Draw Bars & X Labels */}
            {data.map((item, itemIdx) => {
              const widthAvailable = 100; // Percentage basis or relative width
              // We need to calculate x coordinate dynamically in the client, but since we are in SVG,
              // we can use percentages for coordinates, or use a fixed coordinate system.
              // To make it fully responsive, we can set width="100%" and use foreignObject or simple math.
              // Alternatively, we can use clientWidth in a ref. Let's use a simpler approach:
              // We define the SVG with a fixed viewBox, which is 100% responsive and scales perfectly.
              return null; // We will use viewBox instead for robust rendering.
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RESPONSIVE SVG CONTAINER FOR GROUPED BAR CHART (with viewBox)
// ─────────────────────────────────────────────────────────────────────────────

interface ResponsiveBarChartProps extends GroupedBarChartProps {
  viewWidth?: number;
  viewHeight?: number;
}

export function ResponsiveBarChart({
  data,
  xAxisKey,
  series,
  viewWidth = 600,
  viewHeight = 260,
  isCurrency = true
}: ResponsiveBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredBar, setHoveredBar] = useState<{ itemIdx: number; seriesIdx: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; label: string; value: string; visible: boolean }>({
    x: 0,
    y: 0,
    title: '',
    label: '',
    value: '',
    visible: false
  });

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-zinc-400 py-8" style={{ height: viewHeight }}>
        No chart data available
      </div>
    );
  }

  // Find max value in data to scale Y-axis
  let maxVal = 0;
  data.forEach(item => {
    series.forEach(s => {
      const val = Number(item[s.key]) || 0;
      if (val > maxVal) maxVal = val;
    });
  });

  const roundToNiceNumber = (val: number) => {
    if (val === 0) return 100;
    const order = Math.pow(10, Math.floor(Math.log10(val)));
    const normalized = val / order;
    let nice = 10;
    if (normalized <= 1) nice = 1;
    else if (normalized <= 2) nice = 2;
    else if (normalized <= 5) nice = 5;
    else nice = 10;
    return nice * order;
  };

  const yMax = roundToNiceNumber(maxVal);
  const yTicks = 4;

  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartWidth = viewWidth - paddingLeft - paddingRight;
  const chartHeight = viewHeight - paddingTop - paddingBottom;

  const groupWidth = chartWidth / data.length;
  const barGap = 3;
  const innerBarWidth = (groupWidth - 20) / series.length - barGap;

  const handleMouseMove = (e: React.MouseEvent, itemIdx: number, seriesIdx: number, item: any, s: GroupedBarChartSeries) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const val = Number(item[s.key]) || 0;
    const formattedVal = isCurrency ? formatLKR(val) : val.toLocaleString();

    setTooltip({
      // Compute coordinates relative to the parent container
      x: e.clientX - rect.left + 12,
      y: e.clientY - rect.top - 15,
      title: item.name || item[xAxisKey],
      label: s.name,
      value: formattedVal,
      visible: true
    });
    setHoveredBar({ itemIdx, seriesIdx });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setHoveredBar(null);
  };

  return (
    <div ref={containerRef} className="relative w-full p-1 select-none">
      {/* SVG containing the chart elements */}
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        width="100%"
        height="100%"
        className="overflow-visible"
      >
        {/* Draw Y Grid Lines & Labels */}
        {Array.from({ length: yTicks + 1 }).map((_, idx) => {
          const ratio = idx / yTicks;
          const y = paddingTop + (1 - ratio) * chartHeight;
          const val = ratio * yMax;
          const formattedVal = isCurrency
            ? val >= 1000000000 ? `${(val / 1000000000).toFixed(1)}B` : val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)
            : val.toFixed(0);

          return (
            <g key={idx} className="text-zinc-200 dark:text-zinc-800/80">
              <line
                x1={paddingLeft}
                y1={y}
                x2={viewWidth - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeWidth={1}
                strokeDasharray={idx === 0 ? undefined : '4 4'}
              />
              <text
                x={paddingLeft - 10}
                y={y + 3.5}
                textAnchor="end"
                fill="currentColor"
                className="text-xs font-bold text-zinc-400 dark:text-zinc-500"
              >
                {formattedVal}
              </text>
            </g>
          );
        })}

        {/* Draw Groups of Bars */}
        {data.map((item, itemIdx) => {
          const groupX = paddingLeft + itemIdx * groupWidth + 10;
          const itemCode = item[xAxisKey] || '';

          return (
            <g key={itemIdx}>
              {/* Draw X-Axis Labels */}
              <text
                x={groupX + (groupWidth - 20) / 2}
                y={viewHeight - paddingBottom + 18}
                textAnchor="middle"
                className="text-xs font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider"
              >
                {itemCode.length > 10 ? `${itemCode.slice(0, 8)}..` : itemCode}
              </text>

              {/* Draw Each Bar in Group */}
              {series.map((s, seriesIdx) => {
                const val = Number(item[s.key]) || 0;
                const barHeight = yMax > 0 ? (val / yMax) * chartHeight : 0;
                const barX = groupX + seriesIdx * (innerBarWidth + barGap);
                const barY = viewHeight - paddingBottom - barHeight;

                const isHovered = hoveredBar?.itemIdx === itemIdx && hoveredBar?.seriesIdx === seriesIdx;
                const isAnyHovered = hoveredBar !== null;

                return (
                  <rect
                    key={seriesIdx}
                    x={barX}
                    y={barY}
                    width={Math.max(innerBarWidth, 4)}
                    height={Math.max(barHeight, 2)}
                    fill={s.color}
                    rx={3}
                    style={{
                      transition: 'all 0.2s ease-in-out',
                      opacity: isAnyHovered ? (isHovered ? 1 : 0.6) : 0.95,
                      cursor: 'pointer',
                    }}
                    onMouseMove={(e) => handleMouseMove(e, itemIdx, seriesIdx, item, s)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </g>
          );
        })}

        {/* X-Axis base line */}
        <line
          x1={paddingLeft}
          y1={viewHeight - paddingBottom}
          x2={viewWidth - paddingRight}
          y2={viewHeight - paddingBottom}
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-zinc-300 dark:text-zinc-700"
        />
      </svg>

      {/* Floating Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute z-50 pointer-events-none bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl shadow-xl text-xs transition-all duration-700"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          <p className="font-extrabold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-1 mb-1 text-xs uppercase tracking-wider">
            {tooltip.title}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: series[hoveredBar?.seriesIdx || 0]?.color }} />
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">{tooltip.label}:</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-100">{tooltip.value}</span>
          </div>
        </div>
      )}
    </div>
  );
}
