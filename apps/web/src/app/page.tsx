'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HardHat, FileText, Landmark, Users, ClipboardCheck, LayoutGrid,
  CheckCircle, ArrowRight, TrendingUp, MapPin, Calendar, Layers,
  Coins, ShieldCheck, Briefcase, Sparkles, Database, Lock,
  ChevronRight, Map, Activity, Check, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [activeSegment, setActiveSegment] = useState<'contractor' | 'engineer' | 'owner' | 'qs'>('contractor');

  const segmentContent = {
    contractor: {
      title: "Consolidated Site Command Center",
      description: "Manage multiple active projects across Sri Lanka from a single workspace. Stop losing profits to material leakage, unlogged labour hours, and miscommunicated tasks.",
      features: ["Multi-site budget utilization alerts", "Aggregate material requisitions", "Automated payroll calculator"],
      badge: "For Contractors & Builders"
    },
    engineer: {
      title: "Frictionless Mobile Site Updates",
      description: "No more messy paper logbooks. Submit progress logs, attach high-res site photos, record concrete pours, and mark daily labour check-ins in under 2 minutes right from the field.",
      features: ["Offline-friendly daily report logbook", "Geotagged site photo uploads", "Instant supplier request alerts"],
      badge: "For Site Engineers & Supervisors"
    },
    owner: {
      title: "Complete Transparency & Reports",
      description: "Get real-time timeline visibility on your investments. Access geotagged site photo logs, review daily reports, and approve change-order expense vouchers on the go.",
      features: ["Geotagged site timeline checks", "Live log activity notifications", "Mobile-optimized expense sign-offs"],
      badge: "For Property & Asset Owners"
    },
    qs: {
      title: "High-Fidelity Cost Control Ledger",
      description: "Compare raw budget estimations directly against actual logged site expenses. Approve labour payouts, verify supplier rate charts, and analyze category cost weights.",
      features: ["Budget vs actual variance reports", "Expense approval workflow matrix", "Supplier ratings & categories tracking"],
      badge: "For Quantity Surveyors & Accountants"
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground scroll-smooth selection:bg-foreground selection:text-background font-sans">
      {/* Structural grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(var(--border)/0.2)_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--border)/0.2)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />

      {/* Header Panel */}
      <header className="sticky top-4 z-40 w-[95%] max-w-7xl mx-auto border border-border/40 bg-card/65 backdrop-blur-xl rounded-2xl shadow-sm mt-4 text-left">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground text-background shadow-sm">
              <HardHat className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight">BuildTrack</span>
          </div>

          <nav className="hidden md:flex gap-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#about" className="hover:text-foreground transition-colors">How it Works</a>
            <a href="#market" className="hover:text-foreground transition-colors">Target Industry</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs font-semibold">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Register Company</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="space-y-6 lg:col-span-6 text-left stagger-children">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/40 border border-border/30 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
                <Sparkles className="w-3 h-3 text-warning" />
                Next-Gen Construction Operating System
              </div>

              <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.1] text-foreground">
                Operate sites with <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground/60">absolute precision.</span>
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg font-medium">
                Unify daily site logbooks, worker attendance registers, materials catalogs, and financial approvals into a clean, high-fidelity dashboard built for modern constructors.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/register">
                  <Button size="lg" className="h-11 px-6 text-xs font-semibold">
                    Get Started Free
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-11 px-6 text-xs font-semibold">
                    Explore Demo Workspace
                  </Button>
                </Link>
              </div>

              {/* Dynamic metrics */}
              <div className="flex flex-wrap gap-x-12 gap-y-4 pt-8 border-t border-border/20">
                <div className="space-y-1">
                  <div className="text-xl font-bold text-foreground text-financial">LKR 0M</div>
                  <div className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">leakage prevented</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-foreground">100%</div>
                  <div className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">tenant isolation</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-foreground">4000+</div>
                  <div className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">api requests/sec</div>
                </div>
              </div>
            </div>

            {/* Right App Mockup Frame */}
            <div className="lg:col-span-6 w-full flex items-center justify-center relative select-none">
              <div className="w-full max-w-[560px] bg-card border border-border/40 rounded-2xl shadow-panel p-1.5 flex flex-col justify-between hover:border-border/60 transition-colors duration-300">
                {/* macOS style Window Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-accent/20 border-b border-border/20 rounded-t-xl">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-danger/70"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-warning/70"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-success/70"></span>
                  </div>
                  <div className="text-[9px] font-bold text-muted-foreground/60 tracking-widest uppercase">buildtrack.lk/app/dashboard</div>
                  <div className="w-12"></div>
                </div>

                {/* Dashboard Inner Frame */}
                <div className="flex-1 bg-accent/10 p-4 grid grid-cols-12 gap-3 text-muted-foreground rounded-b-xl">
                  {/* Left Mock Sidebar */}
                  <div className="col-span-3 flex flex-col gap-2.5 border-r border-border/20 pr-3 pt-1 text-left">
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                      <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center text-background font-bold text-[10px]">BT</div>
                      <div className="text-[10px] font-bold text-foreground tracking-wider">BuildTrack</div>
                    </div>
                    <div className="h-4.5 bg-border/20 rounded w-full"></div>
                    <div className="h-4.5 bg-foreground/5 text-foreground text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wide">Dashboard</div>
                    <div className="h-4.5 bg-border/20 rounded w-11/12"></div>
                    <div className="h-4.5 bg-border/20 rounded w-4/5"></div>
                  </div>

                  {/* Right Dashboard Mock Content */}
                  <div className="col-span-9 space-y-3 pl-1 pt-1 text-left">
                    {/* Project Header */}
                    <div className="flex justify-between items-center bg-card p-2.5 rounded-xl border border-border/20 shadow-sm">
                      <div>
                        <div className="text-[8px] font-bold text-muted-foreground/40 tracking-wider">ACTIVE PROJECT</div>
                        <h4 className="text-[11px] font-bold mt-0.5 text-foreground">Horizon Apartments</h4>
                      </div>
                      <div className="text-right flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-success"></span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">ACTIVE</span>
                      </div>
                    </div>

                    {/* Cost Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-card border border-border/20 rounded-xl shadow-sm">
                        <div className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-wider">Budget Spent</div>
                        <div className="text-xs font-bold text-foreground mt-1 text-financial">LKR 85,000,000</div>
                        <div className="w-full bg-accent/20 h-1 rounded-full mt-2 overflow-hidden">
                          <div className="bg-success h-full w-[56%] rounded-full"></div>
                        </div>
                      </div>

                      <div className="p-3 bg-card border border-border/20 rounded-xl shadow-sm">
                        <div className="text-[8px] text-muted-foreground/60 font-bold uppercase tracking-wider">Labour Strength</div>
                        <div className="text-xs font-bold text-foreground mt-1">42 Workers</div>
                        <div className="text-[9px] font-bold text-success mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Roster Marked
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="py-24 bg-card border-y border-border/40 relative scroll-mt-12 text-left">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="max-w-3xl space-y-3 mb-16">
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-foreground leading-tight">
              Designed for performance. <br />
              Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground/50">construction scale.</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base font-medium">
              Eliminate paper workflows. Consolidate your project logs and ledgers into unified databases.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[220px]">
            {/* Bento 1: Command Center */}
            <div className="md:col-span-8 md:row-span-2 p-8 bg-accent/10 border border-border/25 rounded-3xl flex flex-col justify-between relative overflow-hidden group hover:shadow-panel hover:border-border/40 transition-all duration-300">
              <div className="max-w-md space-y-2 z-10">
                <div className="w-9 h-9 rounded-lg bg-accent border border-border/30 text-foreground flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Project Command Center</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Organize multiple active job sites under one centralized platform. Define company user roles, monitor project progress bars, and check client schedules in real time.
                </p>
              </div>

              {/* Progress visual */}
              <div className="h-24 bg-card border border-border/20 rounded-2xl p-4 flex flex-col justify-between shadow-sm mt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-foreground">Horizon Tower Phase I</span>
                  <span className="text-success font-bold bg-success-subtle px-2 py-0.5 rounded-full text-[10px]">58% Done</span>
                </div>
                <div className="w-full bg-accent/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-foreground h-full w-[58%] rounded-full"></div>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Start: June 2025</span>
                  <span>Target: June 2027</span>
                </div>
              </div>
            </div>

            {/* Bento 2: Expense Approvals */}
            <div className="md:col-span-4 md:row-span-2 p-8 bg-accent/10 border border-border/25 rounded-3xl flex flex-col justify-between hover:shadow-panel hover:border-border/40 transition-all duration-300 relative overflow-hidden group">
              <div className="space-y-2 z-10">
                <div className="w-9 h-9 rounded-lg bg-accent border border-border/30 text-foreground flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Automated Approvals</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Log purchase logs on-site, upload receipts, and authorize payments with customizable multi-level filters.
                </p>
              </div>

              <div className="p-3.5 bg-card border border-border/20 rounded-xl space-y-2 mt-4 text-xs shadow-sm">
                <div className="flex justify-between font-bold text-foreground border-b border-border/10 pb-1.5">
                  <span>Reinforcement Steel</span>
                  <span className="text-foreground text-financial">LKR 145K</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Logged by Engineer</span>
                  <span className="text-success font-bold bg-success-subtle px-1.5 py-0.5 rounded uppercase">Approved</span>
                </div>
              </div>
            </div>

            {/* Bento 3: Daily Logs */}
            <div className="md:col-span-4 md:row-span-1 p-6 bg-accent/10 border border-border/25 rounded-3xl flex flex-col justify-between hover:shadow-panel hover:border-border/40 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent border border-border/30 text-foreground flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-foreground">Daily Site Logs</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                Log daily summary sheets, document safety observations, track local weather reports, and attach site photos instantly.
              </p>
            </div>

            {/* Bento 4: Attendance */}
            <div className="md:col-span-4 md:row-span-1 p-6 bg-accent/10 border border-border/25 rounded-3xl flex flex-col justify-between hover:shadow-panel hover:border-border/40 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent border border-border/30 text-foreground flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-foreground">Labour Attendance</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                Mark daily worker attendance in grids, save custom daily rates, and calculate payrolls automatically.
              </p>
            </div>

            {/* Bento 5: Materials Requisition */}
            <div className="md:col-span-4 md:row-span-1 p-6 bg-accent/10 border border-border/25 rounded-3xl flex flex-col justify-between hover:shadow-panel hover:border-border/40 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent border border-border/30 text-foreground flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-foreground">Procurement Logs</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                Request aggregates, cement, and steel reinforcement. Manage supplier rate catalogs and monitor deliveries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section (#about) */}
      <section id="about" className="py-24 bg-background border-b border-border/40 scroll-mt-16 relative text-left">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-20">
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-foreground">How BuildTrack Works</h2>
            <p className="text-muted-foreground text-sm sm:text-base font-medium">
              Start coordinating your operations in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-[28px] left-[12%] right-[12%] h-[1px] bg-border/25 -z-10"></div>

            {/* Step 1 */}
            <div className="space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-card border border-border/30 text-foreground font-bold flex items-center justify-center text-lg group-hover:border-foreground/40 transition-colors shadow-sm">
                01
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-foreground">Scaffold Workspace</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Register your construction company and invite site engineers, project managers, and surveyors with custom roles.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-card border border-border/30 text-muted-foreground font-bold flex items-center justify-center text-lg group-hover:border-foreground/40 transition-colors shadow-sm">
                02
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-foreground">Define Job Sites</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Add projects, specify total budget estimates, outline target dates, and allocate management teams.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-card border border-border/30 text-muted-foreground font-bold flex items-center justify-center text-lg group-hover:border-foreground/40 transition-colors shadow-sm">
                03
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-foreground">Capture Daily Data</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Site supervisors submit daily logs, register worker check-ins, record materials used, and log raw field expenses.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-card border border-border/30 text-muted-foreground font-bold flex items-center justify-center text-lg group-hover:border-foreground/40 transition-colors shadow-sm">
                04
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-foreground">Analyze Health</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Track budget variance details, analyze category cost distributions, and download print-ready reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Industry Section (#market) */}
      <section id="market" className="py-24 bg-card scroll-mt-16 relative text-left">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-foreground">Calibrated for your Role</h2>
            <p className="text-muted-foreground text-sm sm:text-base font-medium">
              Tailored workspaces specifically designed for stakeholders in the construction industry.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Nav Tabs */}
            <div className="lg:col-span-4 flex flex-col gap-1.5">
              {[
                { id: 'contractor', label: 'SME Contractors', desc: 'Command multiple locations' },
                { id: 'engineer', label: 'Site Engineers', desc: 'Frictionless log capture' },
                { id: 'owner', label: 'Property Owners', desc: 'Absolute timeline transparency' },
                { id: 'qs', label: 'QS & Accountants', desc: 'High-fidelity cost controls' }
              ].map((tab) => {
                const isActive = activeSegment === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSegment(tab.id as any)}
                    className={`text-left p-4 rounded-xl border transition-all ${isActive
                      ? 'bg-accent/30 border-foreground/30 text-foreground shadow-sm'
                      : 'bg-transparent border-transparent text-muted-foreground/60 hover:text-foreground'
                      }`}
                  >
                    <div className="font-semibold text-xs">{tab.label}</div>
                    <div className="text-[9px] uppercase font-bold tracking-wider mt-0.5 opacity-60">{tab.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Right Segment Panel Detail */}
            <div className="lg:col-span-8 bg-accent/10 border border-border/25 p-8 rounded-3xl relative overflow-hidden min-h-[300px] flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">{segmentContent[activeSegment].badge}</span>
                <h3 className="text-xl font-bold text-foreground">{segmentContent[activeSegment].title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl font-medium">
                  {segmentContent[activeSegment].description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 mt-6 border-t border-border/10">
                {segmentContent[activeSegment].features.map((feat, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card py-16 text-center text-xs text-muted-foreground/60">
        <div className="container max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground text-background">
              <HardHat className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">BuildTrack</span>
          </div>

          <div className="flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#about" className="hover:text-foreground transition-colors">How it Works</a>
            <a href="#market" className="hover:text-foreground transition-colors">Target Industry</a>
          </div>

          <div className="text-[10px] font-semibold tracking-wide">
            &copy; {new Date().getFullYear()} BuildTrack. Designed for SME Contractors.
          </div>
        </div>
      </footer>
    </div>
  );
}
