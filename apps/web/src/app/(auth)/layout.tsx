import React from 'react';
import Link from 'next/link';
import { HardHat, Activity, BarChart3, ShieldCheck } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-background text-foreground relative overflow-hidden select-none">
      {/* Structural grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(var(--border)/0.25)_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--border)/0.25)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />

      {/* Left side - Premium login panel (Glassmorphic card style) */}
      <div className="flex flex-col justify-between p-6 col-span-1 md:p-10 lg:col-span-5 xl:col-span-4 bg-card/60 backdrop-blur-xl border-r border-border/40 shadow-panel relative z-10">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-foreground text-background shadow-sm">
              <HardHat className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm tracking-tight">BuildTrack</span>
          </Link>
        </div>
        
        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto py-12 animate-fade-in">
          {children}
        </div>
        
        <div className="text-[10px] font-semibold tracking-wide text-muted-foreground/60 text-center">
          &copy; {new Date().getFullYear()} BuildTrack. Designed for SME Contractors.
        </div>
      </div>

      {/* Right side - Informational Panel */}
      <div className="hidden lg:flex lg:col-span-7 xl:col-span-8 relative overflow-hidden flex-col justify-between p-16">
        {/* Glow ball */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-foreground/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/40 border border-border/30 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            SaaS Platform v4.0
          </div>
        </div>

        <div className="relative z-10 max-w-xl mt-auto stagger-children">
          <h1 className="text-4xl font-semibold tracking-tight leading-[1.1] text-foreground mb-6">
            Simplify construction tracking <br />
            from <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground/50">foundation to finish.</span>
          </h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">
            Manage worker rosters, log daily reports, request raw materials, and track site expenditures in one clean, high-fidelity workspace designed for local developers.
          </p>
          
          <div className="flex flex-wrap gap-x-12 gap-y-4 pt-8 border-t border-border/20">
            <div className="space-y-1">
              <div className="text-lg font-bold text-foreground text-financial flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-muted-foreground/60" />
                LKR 125M+
              </div>
              <div className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">Expenses Logged</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-foreground flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-muted-foreground/60" />
                350+
              </div>
              <div className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">Active Site Supervisors</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
