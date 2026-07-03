'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, Info } from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatLKR = (n: number) => {
  if (n >= 1000000000) return `LKR ${(n / 1000000000).toFixed(2)}B`;
  if (n >= 1000000) return `LKR ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `LKR ${(n / 1000).toFixed(0)}K`;
  return `LKR ${n.toLocaleString()}`;
};

// Reusable CSV exporter
const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      const val = row[header];
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(',')
  );
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

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
// 1. DONUT CHART — Premium layout with details tooltip, filters, and export
// ─────────────────────────────────────────────────────────────────────────────

export function DonutChart({
  data,
  title,
  subtitle = 'Total spent',
  valuePrefix = '',
  isCurrency = true
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [filteredKeys, setFilteredKeys] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeData = data.filter(item => !filteredKeys[item.label]);
  const total = activeData.reduce((sum, item) => sum + item.value, 0);

  const size = 180;
  const radius = 68;
  const strokeWidth = 14;
  const activeStrokeWidth = 18;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const toggleFilter = (label: string) => {
    setFilteredKeys(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const handleExport = () => {
    const csvData = data.map(d => ({ Category: d.label, Value: d.value }));
    exportToCSV(csvData, title || 'expenses_breakdown');
  };

  return (
    <div className="relative flex flex-col items-start gap-4 w-full text-left font-semibold">
      <div className="flex items-center justify-between w-full select-none pb-1.5 border-b border-border/15">
        <h4 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider">{title || 'Distribution Overview'}</h4>
        <button 
          onClick={handleExport}
          className="text-muted-foreground/60 hover:text-foreground p-1 transition-colors rounded hover:bg-accent/40"
          title="Export CSV"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full py-2">
        {/* SVG Donut */}
        <div className="relative flex-shrink-0 select-none" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-border/20"
            />
            {total > 0 && activeData.map((item, idx) => {
              const percentage = item.value / total;
              const gap = activeData.length > 1 ? 2 : 0;
              const strokeLength = Math.max(0, (percentage * circumference) - gap);
              const strokeOffset = circumference - (accumulatedPercent * circumference);
              accumulatedPercent += percentage;

              const originalIdx = data.findIndex(d => d.label === item.label);
              const isHovered = hoveredIndex === originalIdx;
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
                  strokeLinecap="butt"
                  style={{
                    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    opacity: isAnyHovered ? (isHovered ? 1 : 0.4) : 0.9,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHoveredIndex(originalIdx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {hoveredIndex !== null ? (
              <>
                <p className="text-[13px] font-semibold text-muted-foreground/80 truncate max-w-[110px]">
                  {data[hoveredIndex].label}
                </p>
                <p className="text-[16px] font-black text-foreground mt-0.5 font-mono text-financial">
                  {isCurrency ? formatLKR(data[hoveredIndex].value) : `${valuePrefix}${data[hoveredIndex].value.toLocaleString()}`}
                </p>
                <p className="text-[13px] font-bold text-success mt-0.5">
                  {((data[hoveredIndex].value / (total || 1)) * 100).toFixed(0)}%
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-muted-foreground/60">
                  {subtitle}
                </p>
                <p className="text-[18px] font-black text-foreground mt-0.5 font-mono text-financial">
                  {isCurrency ? formatLKR(total) : `${valuePrefix}${total.toLocaleString()}`}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Legend Panel */}
        <div className="flex-1 space-y-1 w-full select-none">
          <div className="grid grid-cols-1 gap-1 max-h-[160px] overflow-y-auto scrollbar-thin pr-1 text-[13px] font-semibold">
            {data.map((item, idx) => {
              const isFiltered = filteredKeys[item.label];
              const isHovered = hoveredIndex === idx;
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between py-1.5 px-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isFiltered 
                      ? 'opacity-40 hover:opacity-60' 
                      : isHovered 
                        ? 'bg-accent' 
                        : 'hover:bg-accent/40'
                  }`}
                  onClick={() => toggleFilter(item.label)}
                  onMouseEnter={() => !isFiltered && setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className={`text-foreground/80 truncate ${isFiltered ? 'line-through' : ''}`}>{item.label}</span>
                  </div>
                  {!isFiltered && (
                    <span className="font-bold text-foreground ml-2 flex-shrink-0 font-mono">
                      {percentage}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. RESPONSIVE BAR CHART — Interactive bar graphs with legends and CSV tool
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

export function GroupedBarChart({ data, xAxisKey, series, height = 240, isCurrency = true }: GroupedBarChartProps) {
  return (
    <ResponsiveBarChart data={data} xAxisKey={xAxisKey} series={series} viewHeight={height} isCurrency={isCurrency} />
  );
}

interface ResponsiveBarChartProps extends GroupedBarChartProps {
  viewWidth?: number;
  viewHeight?: number;
}

export function ResponsiveBarChart({
  data,
  xAxisKey,
  series,
  viewWidth = 600,
  viewHeight = 280,
  isCurrency = true
}: ResponsiveBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredBar, setHoveredBar] = useState<{ itemIdx: number; seriesIdx: number } | null>(null);
  const [filteredKeys, setFilteredKeys] = useState<Record<string, boolean>>({});
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; label: string; value: string; visible: boolean }>({
    x: 0, y: 0, title: '', label: '', value: '', visible: false
  });

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-[13px] text-muted-foreground/60 py-8" style={{ height: viewHeight }}>
        No chart data available
      </div>
    );
  }

  const activeSeries = series.filter(s => !filteredKeys[s.key]);

  let maxVal = 0;
  data.forEach(item => {
    activeSeries.forEach(s => {
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
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = viewWidth - paddingLeft - paddingRight;
  const chartHeight = viewHeight - paddingTop - paddingBottom;

  const groupWidth = chartWidth / data.length;
  const barGap = 3;
  const innerBarWidth = activeSeries.length > 0 
    ? (groupWidth - 16) / activeSeries.length - barGap 
    : 0;

  const handleMouseMove = (e: React.MouseEvent, itemIdx: number, seriesIdx: number, item: any, s: GroupedBarChartSeries) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const val = Number(item[s.key]) || 0;
    const formattedVal = isCurrency ? formatLKR(val) : val.toLocaleString();
    setTooltip({
      x: e.clientX - rect.left + 12,
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

  const toggleFilter = (key: string) => {
    setFilteredKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCSVExport = () => {
    const csvRows = data.map(item => {
      const row: Record<string, any> = { Label: item[xAxisKey] };
      series.forEach(s => {
        row[s.name] = item[s.key];
      });
      return row;
    });
    exportToCSV(csvRows, 'comparison_reports');
  };

  return (
    <div ref={containerRef} className="relative w-full text-left font-semibold">
      {/* Chart controls panel */}
      <div className="flex items-center justify-between w-full select-none pb-2 border-b border-border/15 mb-3">
        <div className="flex flex-wrap items-center gap-3.5">
          {series.map(s => {
            const isFiltered = filteredKeys[s.key];
            return (
              <button
                key={s.key}
                onClick={() => toggleFilter(s.key)}
                className={`flex items-center gap-2 text-[13px] font-bold transition-all ${
                  isFiltered ? 'opacity-35 hover:opacity-50' : 'hover:opacity-85'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-foreground/80">{s.name}</span>
              </button>
            );
          })}
        </div>
        <button 
          onClick={handleCSVExport}
          className="text-muted-foreground/60 hover:text-foreground p-1 transition-colors rounded hover:bg-accent/40"
          title="Export CSV Data"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-full relative" style={{ height: viewHeight }}>
        <svg
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          width="100%"
          height="100%"
          className="overflow-visible"
        >
          {/* Y Grid Ticks */}
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
                  className="text-[10px] font-bold text-muted-foreground/75 font-mono" fill="currentColor"
                >
                  {formattedVal}
                </text>
              </g>
            );
          })}

          {/* Bar Columns */}
          {data.map((item, itemIdx) => {
            const groupX = paddingLeft + itemIdx * groupWidth + 8;
            const rawLabel = item[xAxisKey] || '';
            const displayLabel = rawLabel.length > 9 ? `${rawLabel.slice(0, 7)}…` : rawLabel;
            return (
              <g key={itemIdx}>
                <text
                  x={groupX + (groupWidth - 16) / 2}
                  y={viewHeight - paddingBottom + 16}
                  textAnchor="middle"
                  className="text-[10px] font-bold text-muted-foreground/80 select-none"
                  fill="currentColor"
                >
                  {displayLabel}
                </text>
                {activeSeries.map((s, seriesIdx) => {
                  const val = Number(item[s.key]) || 0;
                  const barHeight = yMax > 0 ? (val / yMax) * chartHeight : 0;
                  const barX = groupX + seriesIdx * (innerBarWidth + barGap);
                  const barY = viewHeight - paddingBottom - barHeight;
                  
                  const isHovered = hoveredBar?.itemIdx === itemIdx && hoveredBar?.seriesIdx === seriesIdx;
                  const isAnyHovered = hoveredBar !== null;

                  return (
                    <rect
                      key={s.key}
                      x={barX} y={barY}
                      width={Math.max(innerBarWidth, 4)}
                      height={Math.max(barHeight, 2)}
                      fill={s.color}
                      rx={3} ry={3}
                      style={{
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        opacity: isAnyHovered ? (isHovered ? 1 : 0.45) : 0.85,
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

          {/* X Axis Line */}
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

        {/* Custom Tooltip */}
        {tooltip.visible && (
          <div
            className="absolute z-50 pointer-events-none bg-card border border-border/30 p-2.5 rounded-xl shadow-elevated text-xs select-none"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
            }}
          >
            <p className="font-bold text-foreground border-b border-border/15 pb-1 mb-1 text-[13px]">{tooltip.title}</p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: activeSeries[hoveredBar?.seriesIdx || 0]?.color }} />
              <span className="font-bold text-muted-foreground">{tooltip.label}:</span>
              <span className="font-black text-foreground font-mono text-financial">{tooltip.value}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LINE & AREA CHART — Premium responsive line chart with markers
// ─────────────────────────────────────────────────────────────────────────────

interface LineAreaChartSeries {
  key: string;
  name: string;
  color: string;
}

interface LineAreaChartProps {
  data: any[];
  xAxisKey: string;
  series: LineAreaChartSeries[];
  viewWidth?: number;
  viewHeight?: number;
  isCurrency?: boolean;
}

export function LineAreaChart({
  data,
  xAxisKey,
  series,
  viewWidth = 600,
  viewHeight = 280,
  isCurrency = true
}: LineAreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ itemIdx: number; seriesIdx: number } | null>(null);
  const [filteredKeys, setFilteredKeys] = useState<Record<string, boolean>>({});
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; label: string; value: string; visible: boolean }>({
    x: 0, y: 0, title: '', label: '', value: '', visible: false
  });

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-[13px] text-muted-foreground/60 py-8" style={{ height: viewHeight }}>
        No chart data available
      </div>
    );
  }

  const activeSeries = series.filter(s => !filteredKeys[s.key]);

  let maxVal = 0;
  data.forEach(item => {
    activeSeries.forEach(s => {
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
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = viewWidth - paddingLeft - paddingRight;
  const chartHeight = viewHeight - paddingTop - paddingBottom;

  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

  const handleMouseMove = (e: React.MouseEvent, itemIdx: number, seriesIdx: number, item: any, s: LineAreaChartSeries) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const val = Number(item[s.key]) || 0;
    const formattedVal = isCurrency ? formatLKR(val) : val.toLocaleString();
    setTooltip({
      x: e.clientX - rect.left + 12,
      y: e.clientY - rect.top - 20,
      title: item.name || item[xAxisKey],
      label: s.name,
      value: formattedVal,
      visible: true
    });
    setHoveredPoint({ itemIdx, seriesIdx });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setHoveredPoint(null);
  };

  const toggleFilter = (key: string) => {
    setFilteredKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleExport = () => {
    const csvRows = data.map(item => {
      const row: Record<string, any> = { Label: item[xAxisKey] };
      series.forEach(s => {
        row[s.name] = item[s.key];
      });
      return row;
    });
    exportToCSV(csvRows, 'trend_metrics');
  };

  return (
    <div ref={containerRef} className="relative w-full text-left font-semibold">
      {/* Chart controls panel */}
      <div className="flex items-center justify-between w-full select-none pb-2 border-b border-border/15 mb-3">
        <div className="flex flex-wrap items-center gap-3.5">
          {series.map(s => {
            const isFiltered = filteredKeys[s.key];
            return (
              <button
                key={s.key}
                onClick={() => toggleFilter(s.key)}
                className={`flex items-center gap-2 text-[13px] font-bold transition-all ${
                  isFiltered ? 'opacity-35 hover:opacity-50' : 'hover:opacity-85'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-foreground/80">{s.name}</span>
              </button>
            );
          })}
        </div>
        <button 
          onClick={handleExport}
          className="text-muted-foreground/60 hover:text-foreground p-1 transition-colors rounded hover:bg-accent/40"
          title="Export CSV Data"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-full relative" style={{ height: viewHeight }}>
        <svg
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          width="100%"
          height="100%"
          className="overflow-visible"
        >
          <defs>
            {activeSeries.map(s => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>

          {/* Y Grid Ticks */}
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
                  className="text-[10px] font-bold text-muted-foreground/75 font-mono" fill="currentColor"
                >
                  {formattedVal}
                </text>
              </g>
            );
          })}

          {/* Paths & Areas */}
          {activeSeries.map((s, sIdx) => {
            const points = data.map((item, idx) => {
              const val = Number(item[s.key]) || 0;
              const yVal = yMax > 0 ? (val / yMax) * chartHeight : 0;
              const x = paddingLeft + idx * stepX;
              const y = viewHeight - paddingBottom - yVal;
              return { x, y };
            });

            if (points.length < 2) return null;

            const pathData = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
            const areaData = `${pathData} L ${points[points.length - 1].x} ${viewHeight - paddingBottom} L ${points[0].x} ${viewHeight - paddingBottom} Z`;

            return (
              <g key={s.key}>
                {/* Area Gradient */}
                <path d={areaData} fill={`url(#grad-${s.key})`} />
                {/* Stroke Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Interactive Points */}
                {points.map((p, idx) => {
                  const isHovered = hoveredPoint?.itemIdx === idx && hoveredPoint?.seriesIdx === sIdx;
                  return (
                    <circle
                      key={idx}
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 6 : 4}
                      fill={s.color}
                      stroke="var(--card)"
                      strokeWidth={1.5}
                      style={{
                        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                        cursor: 'pointer',
                      }}
                      onMouseMove={(e) => handleMouseMove(e, idx, sIdx, data[idx], s)}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* X Axis Labels */}
          {data.map((item, idx) => {
            const x = paddingLeft + idx * stepX;
            const labelText = item[xAxisKey] || '';
            const displayLabel = labelText.length > 9 ? `${labelText.slice(0, 7)}…` : labelText;
            
            // Limit labels on small layouts
            if (data.length > 8 && idx % 2 !== 0) return null;

            return (
              <text
                key={idx}
                x={x}
                y={viewHeight - paddingBottom + 16}
                textAnchor="middle"
                className="text-[10px] font-bold text-muted-foreground/80 select-none"
                fill="currentColor"
              >
                {displayLabel}
              </text>
            );
          })}

          {/* X Axis Line */}
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

        {/* Custom Tooltip */}
        {tooltip.visible && (
          <div
            className="absolute z-50 pointer-events-none bg-card border border-border/30 p-2.5 rounded-xl shadow-elevated text-xs select-none"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
            }}
          >
            <p className="font-bold text-foreground border-b border-border/15 pb-1 mb-1 text-[13px]">{tooltip.title}</p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: activeSeries[hoveredPoint?.seriesIdx || 0]?.color }} />
              <span className="font-bold text-muted-foreground">{tooltip.label}:</span>
              <span className="font-black text-foreground font-mono text-financial">{tooltip.value}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. RADIAL GAUGE CHART — Perfect half-circle meter for KPI Health
// ─────────────────────────────────────────────────────────────────────────────

interface RadialGaugeProps {
  value: number;
  title?: string;
  label?: string;
}

export function RadialGauge({ value, title, label = 'Score' }: RadialGaugeProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const size = 180;
  const radius = 64;
  const strokeWidth = 10;
  const center = size / 2;
  const circumference = Math.PI * radius; // Half circle

  const pct = Math.min(Math.max(value, 0), 100);
  const strokeLength = (pct / 100) * circumference;
  const strokeOffset = circumference - strokeLength;

  // Curated color based on value thresholds
  const gaugeColor = pct >= 80 
    ? 'oklch(0.65 0.15 145)' // Emerald
    : pct >= 50 
      ? 'oklch(0.72 0.14 55)'  // Amber
      : 'oklch(0.65 0.18 25)';  // Rose

  return (
    <div className="flex flex-col items-center justify-center text-center font-semibold w-full">
      {title && <h4 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-2">{title}</h4>}
      <div className="relative select-none" style={{ width: size, height: size / 2 + 16 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Arc */}
          <path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-border/30"
          />
          {/* Foreground Active Arc */}
          <path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="transparent"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? strokeOffset : circumference}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>
        <div className="absolute bottom-2 inset-x-0 flex flex-col items-center">
          <p className="text-[32px] font-black text-foreground tracking-tight leading-none font-mono">
            {pct}%
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ATTENDANCE HEATMAP GRID — Tightly spaces day presence indicators
// ─────────────────────────────────────────────────────────────────────────────

interface AttendanceHeatmapProps {
  data: Array<{ date: string; count: number }>;
}

export function AttendanceHeatmap({ data }: AttendanceHeatmapProps) {
  const weekdays = ['Mon', 'Wed', 'Fri'];
  const columns = 14; // Render last 14 weeks

  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-accent/40 border-border/15';
    if (count <= 2) return 'bg-success-subtle/25 border-success/15';
    if (count <= 5) return 'bg-success-subtle/50 border-success/25';
    return 'bg-success text-white border-success/40';
  };

  return (
    <div className="flex flex-col items-start gap-3 w-full text-left font-semibold">
      <div className="flex items-center justify-between w-full select-none pb-2 border-b border-border/15">
        <h4 className="text-[13px] font-bold text-muted-foreground/60 uppercase tracking-wider">Attendance Activity Grid</h4>
        <span className="text-[10px] text-muted-foreground/50 uppercase font-bold tracking-wider">14-Week Timeline</span>
      </div>

      <div className="flex items-center gap-3.5 w-full overflow-x-auto py-2 pr-1 select-none">
        {/* Day indicators */}
        <div className="flex flex-col gap-2.5 text-[9.5px] font-bold text-muted-foreground/50 justify-between h-20 pt-1 flex-shrink-0">
          {weekdays.map(d => <span key={d}>{d}</span>)}
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {Array.from({ length: columns * 7 }).map((_, idx) => {
            const count = data[idx]?.count || 0;
            const dateStr = data[idx]?.date || '';
            const displayDate = dateStr ? new Date(dateStr).toLocaleDateString() : 'Inactive Date';

            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded border transition-all hover:scale-110 hover:shadow-sm cursor-pointer ${getHeatColor(count)}`}
                title={`${displayDate}: ${count} present`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SPARKLINE — Inline trend indicator
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
// 7. PROGRESS BAR — Horizontal animated fill
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
        <div className="flex items-center justify-between mb-1.5 font-semibold text-[13px]">
          {label && <span className="text-muted-foreground/80">{label}</span>}
          <span className="text-foreground font-mono text-financial">{pct.toFixed(0)}%</span>
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
