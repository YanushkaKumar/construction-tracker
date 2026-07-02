'use client';

import React, { useState, useRef, useEffect } from 'react';

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatLKR = (n: number) => {
  if (n >= 1000000000) return `LKR ${(n / 1000000000).toFixed(2)}B`;
  if (n >= 1000000) return `LKR ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `LKR ${(n / 1000).toFixed(0)}K`;
  return `LKR ${n.toLocaleString()}`;
};

// Curated chart color palette — designed to work together
const CHART_PALETTE = [
  'oklch(0.65 0.15 145)',   // Emerald
  'oklch(0.62 0.12 250)',   // Blue
  'oklch(0.72 0.14 55)',    // Amber
  'oklch(0.60 0.16 310)',   // Purple
  'oklch(0.68 0.10 200)',   // Teal
  'oklch(0.65 0.18 25)',    // Rose
  'oklch(0.70 0.08 100)',   // Lime
  'oklch(0.55 0.12 280)',   // Indigo
  'oklch(0.50 0.05 60)',    // Stone
];

// ── Types ───────────────────────────────────────────────────────────────────

interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  title?: string;
  subtitle?: string;
  valuePrefix?: string;
  isCurrency?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DONUT CHART — Refined, thinner strokes, animated mount
// ─────────────────────────────────────────────────────────────────────────────

export function DonutChart({
  data,
  title,
  subtitle = 'Total spent',
  valuePrefix = '',
  isCurrency = true
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const size = 180;
  const radius = 68;
  const strokeWidth = 12;
  const activeStrokeWidth = 16;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const getDisplayValue = (val: number) => {
    return isCurrency ? formatLKR(val) : `${valuePrefix}${val.toLocaleString()}`;
  };

  return (
    <div className="relative flex flex-col sm:flex-row items-center justify-center gap-8 w-full">
      {/* SVG Donut */}
      <div className="relative flex-shrink-0 select-none" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Track ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border/40"
          />
          {/* Data segments */}
          {total > 0 && data.map((item, idx) => {
            const percentage = item.value / total;
            const strokeLength = percentage * circumference;
            const strokeOffset = circumference - (accumulatedPercent * circumference);
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
                strokeDasharray={mounted ? `${strokeLength} ${circumference}` : `0 ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                style={{
                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: isAnyHovered ? (isHovered ? 1 : 0.35) : 0.9,
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          {hoveredIndex !== null ? (
            <>
              <p className="text-label text-muted-foreground/70 truncate max-w-[100px]">
                {data[hoveredIndex].label}
              </p>
              <p className="text-lg font-semibold text-foreground mt-0.5 text-financial">
                {getDisplayValue(data[hoveredIndex].value)}
              </p>
              <p className="text-xs font-semibold text-chart-1 mt-0.5">
                {((data[hoveredIndex].value / (total || 1)) * 100).toFixed(0)}%
              </p>
            </>
          ) : (
            <>
              <p className="text-label text-muted-foreground/60">
                {subtitle}
              </p>
              <p className="text-base font-semibold text-foreground mt-0.5 text-financial">
                {getDisplayValue(total)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-1 min-w-[140px] w-full">
        {title && <h4 className="text-label text-muted-foreground/60 mb-3">{title}</h4>}
        <div className="grid grid-cols-1 gap-0.5 max-h-[160px] overflow-y-auto scrollbar-thin">
          {data.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
            return (
              <div
                key={idx}
                className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-all duration-200 cursor-pointer ${
                  isHovered
                    ? 'bg-accent'
                    : 'hover:bg-accent/50'
                }`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="status-dot flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-foreground/70 truncate">{item.label}</span>
                </div>
                <span className="text-xs font-semibold text-foreground ml-2 flex-shrink-0 text-financial">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GROUPED BAR CHART (non-responsive fallback)
// ─────────────────────────────────────────────────────────────────────────────

interface GroupedBarChartSeries {
  key: string;
  name: string;
  color: string;
}

interface GroupedBarChartProps {
  data: any[];
  xAxisKey: string;
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
    x: 0, y: 0, title: '', label: '', value: '', visible: false
  });

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-caption py-8" style={{ height }}>
        No chart data available
      </div>
    );
  }

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

  const paddingLeft = 65;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 40;

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
      <div className="w-full" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          <g>
            {Array.from({ length: yTicks + 1 }).map((_, idx) => {
              const ratio = idx / yTicks;
              const y = paddingTop + (1 - ratio) * (height - paddingTop - paddingBottom);
              const val = ratio * yMax;
              const formattedVal = isCurrency
                ? val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)
                : val.toFixed(0);
              return (
                <g key={idx} className="text-border/60">
                  <line
                    x1={paddingLeft} y1={y}
                    x2={`calc(100% - ${paddingRight}px)`} y2={y}
                    stroke="currentColor" strokeWidth={1}
                    strokeDasharray={idx === 0 ? undefined : '3 3'}
                  />
                  <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill="currentColor"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {formattedVal}
                  </text>
                </g>
              );
            })}
            {data.map((item, itemIdx) => {
              return null;
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RESPONSIVE BAR CHART (with viewBox)
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
    x: 0, y: 0, title: '', label: '', value: '', visible: false
  });

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-caption py-8" style={{ height: viewHeight }}>
        No chart data available
      </div>
    );
  }

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
  const barGap = 4;
  const innerBarWidth = (groupWidth - 20) / series.length - barGap;

  const handleMouseMove = (e: React.MouseEvent, itemIdx: number, seriesIdx: number, item: any, s: GroupedBarChartSeries) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const val = Number(item[s.key]) || 0;
    const formattedVal = isCurrency ? formatLKR(val) : val.toLocaleString();
    setTooltip({
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
    <div ref={containerRef} className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        width="100%"
        height="100%"
        className="overflow-visible"
      >
        {/* Y Grid */}
        {Array.from({ length: yTicks + 1 }).map((_, idx) => {
          const ratio = idx / yTicks;
          const y = paddingTop + (1 - ratio) * chartHeight;
          const val = ratio * yMax;
          const formattedVal = isCurrency
            ? val >= 1000000000 ? `${(val / 1000000000).toFixed(1)}B` : val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)
            : val.toFixed(0);
          return (
            <g key={idx}>
              <line
                x1={paddingLeft} y1={y}
                x2={viewWidth - paddingRight} y2={y}
                stroke="currentColor" strokeWidth={0.5}
                strokeDasharray={idx === 0 ? undefined : '3 3'}
                className="text-border/50"
              />
              <text x={paddingLeft - 10} y={y + 3.5} textAnchor="end"
                className="text-[10px] font-medium" fill="currentColor"
                style={{ fill: 'oklch(0.55 0 0)' }}
              >
                {formattedVal}
              </text>
            </g>
          );
        })}

        {/* Bar Groups */}
        {data.map((item, itemIdx) => {
          const groupX = paddingLeft + itemIdx * groupWidth + 10;
          const itemCode = item[xAxisKey] || '';
          return (
            <g key={itemIdx}>
              <text
                x={groupX + (groupWidth - 20) / 2}
                y={viewHeight - paddingBottom + 16}
                textAnchor="middle"
                className="text-[10px] font-semibold"
                style={{ fill: 'oklch(0.50 0 0)' }}
              >
                {itemCode.length > 10 ? `${itemCode.slice(0, 8)}…` : itemCode}
              </text>
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
                    x={barX} y={barY}
                    width={Math.max(innerBarWidth, 4)}
                    height={Math.max(barHeight, 2)}
                    fill={s.color}
                    rx={4} ry={4}
                    style={{
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      opacity: isAnyHovered ? (isHovered ? 1 : 0.5) : 0.85,
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

        {/* X-Axis line */}
        <line
          x1={paddingLeft}
          y1={viewHeight - paddingBottom}
          x2={viewWidth - paddingRight}
          y2={viewHeight - paddingBottom}
          strokeWidth={1}
          className="text-border/60"
          stroke="currentColor"
        />
      </svg>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute z-50 pointer-events-none glass-panel p-2.5 rounded-lg shadow-elevated text-xs"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          <p className="font-semibold text-foreground border-b border-border/50 pb-1 mb-1 text-xs">
            {tooltip.title}
          </p>
          <div className="flex items-center gap-2">
            <span className="status-dot" style={{ backgroundColor: series[hoveredBar?.seriesIdx || 0]?.color }} />
            <span className="font-medium text-muted-foreground">{tooltip.label}:</span>
            <span className="font-semibold text-foreground text-financial">{tooltip.value}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SPARKLINE — Inline trend indicator
// ─────────────────────────────────────────────────────────────────────────────

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = 'oklch(0.65 0.15 145)',
  showArea = true,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * w;
    const y = padding + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const linePath = `M${points.join(' L')}`;
  const areaPath = `${linePath} L${padding + w},${padding + h} L${padding},${padding + h} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {showArea && (
        <path d={areaPath} fill={color} opacity={0.1} />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PROGRESS BAR — Horizontal animated fill
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color,
  height = 6,
  showLabel = false,
  label,
}: ProgressBarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const barColor = color || (pct >= 80 ? 'oklch(0.65 0.18 145)' : pct >= 50 ? 'oklch(0.72 0.14 55)' : 'oklch(0.62 0.12 250)');

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-caption">{label}</span>}
          <span className="text-xs font-semibold text-foreground text-financial">{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'var(--border)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: mounted ? `${pct}%` : '0%',
            background: barColor,
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
    </div>
  );
}
