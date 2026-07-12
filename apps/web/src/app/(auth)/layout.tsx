import React from 'react';
import Link from 'next/link';
import { HardHat, ShieldCheck, TrendingUp, Activity, Building2, Users } from 'lucide-react';

const STATS = [
  { label: 'Project tracking',   value: 'Live',   icon: Building2 },
  { label: 'Workforce & payroll', value: 'Built-in', icon: Users },
  { label: 'Budget vs actual',   value: 'Real-time', icon: TrendingUp },
  { label: 'Approval workflows', value: 'Role-based', icon: Activity },
];

const HIGHLIGHT = {
  quote:
    'Every expense voucher, daily site log, material request, and wage sheet in one place — reviewed and approved from wherever you are.',
  name: 'Built for construction teams',
  title: 'Owners, PMs, engineers, QS, and accountants each get their own workspace',
  avatar: 'B',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-background text-foreground overflow-hidden select-none"
      aria-label="Authentication"
    >
      {/* ── Left — Form panel ─────────────────────────── */}
      <div className="flex flex-col lg:col-span-5 xl:col-span-4 bg-card/60 backdrop-blur-xl border-r border-border/30 shadow-panel relative z-10">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border/15">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="BuildTrack — go to homepage">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-foreground text-background shadow-surface group-hover:brightness-110 transition-all"
              aria-hidden
            >
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-[15px] tracking-tight text-foreground">BuildTrack</span>
              <span className="block text-[11px] text-muted-foreground/60">Construction management</span>
            </div>
          </Link>
        </div>

        {/* Form content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-10 animate-fade-in">
          <div className="max-w-[360px] w-full mx-auto">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-border/10 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground/50">
            &copy; {new Date().getFullYear()} BuildTrack. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground/50">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* ── Right — Marketing panel ────────────────────── */}
      <div className="hidden lg:flex lg:col-span-7 xl:col-span-8 relative flex-col p-14 xl:p-20 overflow-hidden">
        {/* Background ambient */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--background)_0%,var(--accent)_100%)] opacity-80 -z-10" />
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px] pointer-events-none -z-10" aria-hidden />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-success/6 blur-[100px] pointer-events-none -z-10" aria-hidden />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 structural-grid opacity-60 pointer-events-none -z-10"
          aria-hidden
        />

        {/* Badge */}
        <div className="flex items-center justify-between mb-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/40 border border-border/25 px-4 py-1.5 backdrop-blur-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-success" aria-hidden />
            <span className="text-[12px] font-medium text-foreground/80">
              Built for construction teams
            </span>
          </div>
        </div>

        {/* Main headline */}
        <div className="flex-1 flex flex-col justify-center max-w-2xl mt-12 mb-12 stagger-children">
          <h1 className="text-[3.5rem] xl:text-[4.25rem] font-semibold tracking-[-0.03em] leading-[1.05] text-foreground mb-6">
            Run every site,<br />
            every rupee,<br />
            <span className="text-muted-foreground">from one place.</span>
          </h1>
          <p className="text-[15px] text-muted-foreground/70 leading-relaxed font-medium max-w-lg">
            Manage worker rosters, daily reports, material procurement, and site expenditures
            across all your projects — from a single, high-fidelity workspace.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-card/50 backdrop-blur-sm border border-border/20 rounded-2xl p-4 shadow-surface text-left"
            >
              <s.icon className="w-4 h-4 text-muted-foreground/50 mb-2.5" aria-hidden />
              <p className="text-[20px] font-semibold text-foreground tabular-nums leading-none">
                {s.value}
              </p>
              <p className="text-[12px] text-muted-foreground/70 mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="bg-card/40 backdrop-blur-sm border border-border/20 rounded-2xl p-5 shadow-surface text-left">
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-[14px] flex-shrink-0 shadow-surface"
              aria-hidden
            >
              {HIGHLIGHT.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-medium text-foreground/80 leading-relaxed mb-3 italic">
                &ldquo;{HIGHLIGHT.quote}&rdquo;
              </p>
              <div>
                <p className="text-[13px] font-bold text-foreground/90">{HIGHLIGHT.name}</p>
                <p className="text-[11px] text-muted-foreground/60 font-medium mt-0.5">{HIGHLIGHT.title}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
