'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ── Animated counter ─────────────────────────────────────────

function useAnimatedValue(target: number, duration = 900, enabled = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || target === 0) { setValue(0); return; }
    const startTime = performance.now();
    const startValue = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startValue + (target - startValue) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return value;
}

// ── Mini sparkline ────────────────────────────────────────────

function MiniSparkline({
  data,
  color,
  width = 80,
  height = 32,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.85;
    return `${x},${y}`;
  });

  const lastY = height - ((data[data.length - 1] - min) / range) * height * 0.85;
  const areaPoints = `0,${height} ${points.join(' ')} ${width},${height}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sg-${color.replace(/[^a-z0-9]/gi, '')})`}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={lastY}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// ── Trend badge ───────────────────────────────────────────────

function TrendBadge({
  delta,
  suffix = '%',
  inverse = false,
}: {
  delta: number;
  suffix?: string;
  inverse?: boolean;
}) {
  const isPositive = inverse ? delta < 0 : delta > 0;
  const isNeutral = delta === 0;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-muted-foreground/60">
        <Minus className="w-3 h-3" aria-hidden />
        <span>0{suffix}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[11px] font-bold',
        isPositive ? 'text-success' : 'text-danger'
      )}
      aria-label={`${isPositive ? 'Increased' : 'Decreased'} by ${Math.abs(delta)}${suffix}`}
    >
      {isPositive
        ? <TrendingUp className="w-3 h-3" aria-hidden />
        : <TrendingDown className="w-3 h-3" aria-hidden />}
      <span>{delta > 0 ? '+' : ''}{delta}{suffix}</span>
    </span>
  );
}

// ── Stat Card ────────────────────────────────────────────────

export interface StatCardProps {
  label: string;
  value: number | string;
  valuePrefix?: string;
  valueSuffix?: string;
  insight?: string;           // e.g. "Up 6% this month"
  caption?: string;           // secondary info line
  delta?: number;             // trend % change
  deltaInverse?: boolean;     // invert positive/negative coloring
  icon: React.ElementType;
  iconColor?: string;
  sparkline?: number[];       // mini chart data
  sparklineColor?: string;
  href?: string;              // optional link
  attention?: boolean;        // danger state
  animated?: boolean;         // animate number on mount
  loading?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function StatCard({
  label,
  value,
  valuePrefix = '',
  valueSuffix = '',
  insight,
  caption,
  delta,
  deltaInverse,
  icon: Icon,
  iconColor,
  sparkline,
  sparklineColor = 'oklch(0.60 0.17 248)',
  href,
  attention,
  animated = true,
  loading = false,
  className,
  'aria-label': ariaLabel,
}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
  const displayValueRaw = useAnimatedValue(numericValue, 900, animated && typeof value === 'number');
  const displayValue = animated && typeof value === 'number'
    ? `${valuePrefix}${displayValueRaw.toLocaleString()}${valueSuffix}`
    : `${valuePrefix}${typeof value === 'string' ? value : value.toLocaleString()}${valueSuffix}`;

  const card = (
    <div
      className={cn(
        'group relative flex flex-col bg-card border rounded-2xl shadow-surface overflow-hidden transition-all duration-300',
        'hover:shadow-elevated hover:border-border/60',
        attention
          ? 'border-danger/35 bg-danger-subtle/5'
          : 'border-border/25',
        href && 'cursor-pointer',
        className
      )}
      role={href ? undefined : 'region'}
      aria-label={ariaLabel ?? label}
    >
      {/* Attention pulse stripe */}
      {attention && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-danger animate-pulse-soft" aria-hidden />
      )}

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[12.5px] font-medium text-muted-foreground select-none">
              {label}
            </span>
          </div>
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-xl border shadow-surface flex-shrink-0 transition-colors duration-200',
              attention
                ? 'bg-danger-subtle border-danger/25 text-danger'
                : 'bg-accent/40 border-border/20 text-muted-foreground/65 group-hover:text-foreground/70 group-hover:bg-accent/70'
            )}
            aria-hidden="true"
          >
            <Icon className="w-4 h-4" style={iconColor ? { color: iconColor } : undefined} />
          </div>
        </div>

        {/* Value */}
        {loading ? (
          <div className="h-10 w-32 rounded-lg shimmer-bg bg-accent" />
        ) : (
          <div className="flex items-end gap-2">
            <p
              className={cn(
                'text-[1.75rem] font-semibold tracking-tight leading-none tabular-nums transition-colors',
                attention ? 'text-danger' : 'text-foreground'
              )}
            >
              {displayValue}
            </p>
            {delta !== undefined && (
              <div className="mb-0.5">
                <TrendBadge delta={delta} inverse={deltaInverse} />
              </div>
            )}
          </div>
        )}

        {/* Insight text */}
        {insight && !loading && (
          <p className="text-[13px] text-foreground/70 font-medium leading-snug -mt-1">
            {insight}
          </p>
        )}

        {/* Caption */}
        {caption && !loading && (
          <p className="text-[11.5px] font-medium text-muted-foreground/60 select-none">
            {caption}
          </p>
        )}

        {/* Sparkline */}
        {sparkline && sparkline.length > 1 && !loading && (
          <div className="flex justify-end -mt-1">
            <MiniSparkline data={sparkline} color={sparklineColor} />
          </div>
        )}
      </div>

      {/* Arrow indicator for linked cards */}
      {href && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ArrowUpRight className="w-4 h-4 text-muted-foreground/40" aria-hidden />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded-2xl">
        {card}
      </Link>
    );
  }

  return card;
}

// ── Insight stat (text-rich format) ──────────────────────────

export function InsightStatCard({
  icon: Icon,
  iconBg,
  title,
  description,
  badge,
  badgeVariant = 'neutral',
  href,
  className,
}: {
  icon: React.ElementType;
  iconBg?: string;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  href?: string;
  className?: string;
}) {
  const badgeColors = {
    success: 'bg-success-subtle text-success border-success/30',
    warning: 'bg-warning-subtle text-warning border-warning/30',
    danger:  'bg-danger-subtle text-danger border-danger/30',
    info:    'bg-info-subtle text-info border-info/30',
    neutral: 'bg-accent/50 text-muted-foreground border-border/30',
  };

  const content = (
    <div
      className={cn(
        'group relative flex items-start gap-4 p-4 bg-card border border-border/25 rounded-2xl shadow-surface',
        'hover:shadow-elevated hover:border-border/50 transition-all duration-200',
        href && 'cursor-pointer',
        className
      )}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 shadow-surface"
        style={{ background: iconBg }}
        aria-hidden="true"
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[13px] font-bold text-foreground/90 leading-tight">{title}</p>
        <p className="text-[12px] text-muted-foreground/75 mt-0.5 leading-relaxed">{description}</p>
      </div>
      {badge && (
        <span className={cn('chip flex-shrink-0', badgeColors[badgeVariant])}>
          {badge}
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
