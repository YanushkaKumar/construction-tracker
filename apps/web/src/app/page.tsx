'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HardHat, FileText, Landmark, Users, ClipboardCheck,
  CheckCircle, ArrowRight, TrendingUp, Layers,
  ShieldCheck, ChevronRight, Activity,
  Check, BarChart2, Building2, Package, Wallet,
  Zap, Globe, Lock, Bell, Download, Menu, X,
} from 'lucide-react';

// ── Nav ───────────────────────────────────────────────────────

function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-4 z-50 w-[94%] max-w-7xl mx-auto border border-border/25 bg-card/70 backdrop-blur-xl rounded-2xl shadow-surface mt-4"
      role="banner"
    >
      <div className="flex h-14 items-center justify-between px-5 md:px-7">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5" aria-label="BuildTrack — home">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-foreground text-background shadow-surface" aria-hidden>
            <HardHat className="w-4 h-4" />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-foreground/90">BuildTrack</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-[13px] font-semibold text-muted-foreground/75" aria-label="Main">
          <a href="#features"  className="hover:text-foreground transition-colors">Features</a>
          <a href="#how"       className="hover:text-foreground transition-colors">How it works</a>
          <a href="#roles"     className="hover:text-foreground transition-colors">Who it&apos;s for</a>
          <a href="#pricing"   className="hover:text-foreground transition-colors">Pricing</a>
        </nav>

        {/* CTA + mobile */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground/75 hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 h-8 px-4 bg-foreground text-background text-[12.5px] font-bold rounded-xl hover:brightness-110 transition-all shadow-surface"
          >
            Get started free
            <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="w-4 h-4" aria-hidden /> : <Menu className="w-4 h-4" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border/15 px-5 py-4 space-y-3 bg-card/95 rounded-b-2xl">
          {['#features', '#how', '#roles', '#pricing'].map((href) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block text-[14px] font-semibold text-muted-foreground/75 hover:text-foreground transition-colors py-1"
            >
              {href.replace('#', '').replace(/^\w/, c => c.toUpperCase())}
            </a>
          ))}
          <div className="pt-3 border-t border-border/10 flex gap-3">
            <Link href="/login"    className="flex-1 text-center py-2 rounded-xl border border-border/30 text-[13px] font-semibold hover:bg-accent/40 transition-colors">Sign in</Link>
            <Link href="/register" className="flex-1 text-center py-2 rounded-xl bg-foreground text-background text-[13px] font-bold hover:brightness-110 transition-all">Register</Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ── Feature card ──────────────────────────────────────────────

function FeatureCard({ icon: Icon, title, description, accent }: {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <div className="group p-6 bg-card border border-border/25 rounded-2xl shadow-surface hover:shadow-elevated hover:border-border/45 transition-all duration-300 text-left">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${accent}`} aria-hidden>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-[15px] font-bold text-foreground/90 mb-2">{title}</h3>
      <p className="text-[13px] text-muted-foreground/65 leading-relaxed">{description}</p>
    </div>
  );
}

// ── Stat counter ──────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center select-none">
      <p className="text-[2.5rem] md:text-[3rem] font-semibold text-foreground tracking-tight leading-none tabular-nums">
        {value}
      </p>
      <p className="text-[13px] font-medium text-muted-foreground/60 mt-2">
        {label}
      </p>
    </div>
  );
}

// ── Main landing page ─────────────────────────────────────────

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState<'contractor' | 'engineer' | 'owner' | 'qs'>('contractor');

  const roles = {
    contractor: {
      badge: 'General Contractors',
      title: 'Command every site from one workspace',
      description:
        'Manage multiple active projects across Sri Lanka from a single, high-fidelity workspace. Stop losing profits to material leakage, unlogged labour hours, and miscommunicated tasks.',
      points: ['Multi-site budget utilization alerts', 'Aggregate material requisitions', 'Automated payroll calculator', 'Bulk expense voucher approvals'],
    },
    engineer: {
      badge: 'Site Engineers',
      title: 'Frictionless field updates in 2 minutes',
      description:
        'No more messy paper logbooks. Submit progress logs, record concrete pours, mark daily labour check-ins, and log material requests right from the field — online or offline.',
      points: ['Offline-first daily report logbook', 'Geotagged site photo uploads', 'Instant supplier request alerts', 'Attendance tracking with overtime'],
    },
    owner: {
      badge: 'Property Owners',
      title: 'Full transparency on your investment',
      description:
        'Get real-time visibility on your build. Access site photo timelines, review daily progress reports, and approve expense vouchers — without being on-site.',
      points: ['Geotagged site photo timeline', 'Live activity notifications', 'Mobile expense sign-offs', 'Budget vs actual reports'],
    },
    qs: {
      badge: 'Quantity Surveyors',
      title: 'High-fidelity cost control ledger',
      description:
        'Compare budget estimations directly against actual logged expenses. Approve labour payouts, verify supplier invoices, and analyse category cost weights in real time.',
      points: ['Budget vs actual variance analysis', 'Expense approval workflow matrix', 'Supplier rate benchmarking', 'Exportable cost reports (CSV / PDF)'],
    },
  };

  const features = [
    { icon: Building2,     title: 'Project Management',   description: 'Multi-project dashboards with real-time budget utilisation, timeline tracking, and milestone progress.', accent: 'bg-info-subtle text-info' },
    { icon: Users,         title: 'Workforce & Payroll',   description: 'Register workers, track daily attendance, log overtime hours, and generate automated wage sheets.', accent: 'bg-success-subtle text-success' },
    { icon: FileText,      title: 'Daily Site Reports',    description: 'Structured field logs with photo uploads, work progress, labour counts, and material consumption.', accent: 'bg-warning-subtle text-warning' },
    { icon: Package,       title: 'Materials & Inventory', description: 'Issue material requests, track delivery statuses, and manage supplier invoices across all sites.', accent: 'bg-[var(--chart-4)]/10 text-[var(--chart-4)]' },
    { icon: Landmark,      title: 'Expense Management',    description: 'Role-based expense voucher submission, manager approvals, and full audit trail for every payment.', accent: 'bg-danger-subtle text-danger' },
    { icon: Wallet,        title: 'Treasury & Finance',    description: 'Track advance payments, bank loans, fixed assets, and generate consolidated cash-flow statements.', accent: 'bg-[var(--chart-5)]/10 text-[var(--chart-5)]' },
    { icon: ClipboardCheck,title: 'Task Tracking',         description: 'Assign tasks to team members, set deadlines, manage priorities, and visualise progress on a Kanban board.', accent: 'bg-[var(--chart-1)]/10 text-[var(--chart-1)]' },
    { icon: BarChart2,     title: 'Executive Reporting',   description: 'Role-adaptive dashboards with spend analysis, cash-flow trends, and budget risk flags.', accent: 'bg-[var(--chart-3)]/10 text-[var(--chart-3)]' },
  ];

  const activeContent = roles[activeRole];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased selection:bg-foreground selection:text-background">
      {/* Background grid */}
      <div className="fixed inset-0 structural-grid pointer-events-none -z-10" aria-hidden />
      {/* Glow blobs */}
      <div className="fixed top-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-primary/6 blur-[160px] pointer-events-none -z-10" aria-hidden />
      <div className="fixed bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-success/5 blur-[130px] pointer-events-none -z-10" aria-hidden />

      {/* ── Navigation ─── */}
      <Nav />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center px-6 pt-24 pb-20 md:pt-32 md:pb-28 max-w-6xl mx-auto w-full" aria-label="Hero">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-accent/40 backdrop-blur-sm px-4 py-1.5 mb-7 select-none">
          <HardHat className="w-3.5 h-3.5 text-muted-foreground/70" aria-hidden />
          <span className="text-[12px] font-medium text-foreground/75">
            Built for the Sri Lankan construction industry
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-[3rem] md:text-[4.5rem] xl:text-[5.5rem] font-semibold tracking-[-0.04em] leading-[1.04] text-foreground/95 max-w-4xl mx-auto mb-7">
          Run your construction business{' '}
          <span className="text-muted-foreground">without the paperwork.</span>
        </h1>

        <p className="text-[17px] text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed font-medium mb-10">
          BuildTrack brings project management, workforce tracking, material procurement,
          and financial control together in one workspace — from site to head office.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-16">
          <Link
            href="/register"
            className="inline-flex items-center gap-2.5 h-12 px-7 bg-foreground text-background text-[15px] font-bold rounded-2xl hover:brightness-110 transition-all duration-200 active:scale-[0.98] shadow-elevated"
            aria-label="Get started for free"
          >
            Start free trial
            <ArrowRight className="w-4.5 h-4.5" aria-hidden />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 h-12 px-7 border border-border/30 bg-card/60 text-foreground/80 text-[15px] font-semibold rounded-2xl hover:bg-accent/50 hover:border-border/50 transition-all duration-200 backdrop-blur-sm"
          >
            Sign in to workspace
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-[12px] font-semibold text-muted-foreground/55 select-none">
          {[
            { icon: ShieldCheck, text: 'Role-based access control' },
            { icon: Lock,        text: 'Your data stays private' },
            { icon: Globe,       text: 'Works on any device' },
            { icon: Zap,         text: 'Fast, even on site connections' },
          ].map(b => (
            <div key={b.text} className="flex items-center gap-1.5">
              <b.icon className="w-3.5 h-3.5 text-success" aria-hidden />
              {b.text}
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-6 py-16 border-y border-border/15" aria-label="Platform statistics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <Stat value="8"       label="Integrated modules"        />
          <Stat value="6"       label="Role-based workspaces"     />
          <Stat value="2 min"   label="To log a daily report"     />
          <Stat value="LKR 0"   label="Per-seat charges"          />
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────── */}
      <section id="features" className="w-full max-w-7xl mx-auto px-6 py-24" aria-labelledby="features-heading">
        <div className="text-center mb-14 select-none">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-accent/30 px-4 py-1.5 mb-5">
            <Layers className="w-3.5 h-3.5 text-primary" aria-hidden />
            <span className="text-[12px] font-medium text-muted-foreground/75">Platform modules</span>
          </div>
          <h2 id="features-heading" className="text-[2.5rem] md:text-[3.5rem] font-semibold tracking-[-0.03em] text-foreground/90 mb-4 leading-tight">
            Everything your site needs,<br className="hidden md:block" /> nothing it doesn&apos;t.
          </h2>
          <p className="text-[15px] text-muted-foreground/60 max-w-xl mx-auto leading-relaxed font-medium">
            A full-stack ERP built specifically for the Sri Lankan construction industry — not a generic project management tool retrofitted.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(f => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section id="how" className="w-full bg-accent/10 border-y border-border/15 py-24 px-6" aria-labelledby="how-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 select-none">
            <h2 id="how-heading" className="text-[2.5rem] md:text-[3rem] font-semibold tracking-[-0.03em] text-foreground/90 mb-4">
              Up and running in minutes.
            </h2>
            <p className="text-[15px] text-muted-foreground/60 max-w-lg mx-auto">
              No long onboarding. No consultants. Just a clear setup flow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Register your company',  description: 'Create your BuildTrack account, add your company profile, and invite your team in under 5 minutes.' },
              { step: '02', title: 'Create your first project', description: 'Add project details, set your budget, define the team, and start logging work from day one.' },
              { step: '03', title: 'Track everything in real time', description: 'Monitor expenses, daily reports, tasks, worker attendance, and cash flow — live — from the executive dashboard.' },
            ].map(s => (
              <div key={s.step} className="relative bg-card border border-border/25 rounded-2xl p-7 shadow-surface text-left">
                <div className="text-[40px] font-semibold text-foreground/8 absolute top-4 right-5 select-none tabular-nums" aria-hidden>{s.step}</div>
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-foreground text-background text-[14px] font-semibold mb-5 shadow-surface tabular-nums" aria-hidden>
                  {s.step}
                </div>
                <h3 className="text-[16px] font-bold text-foreground/90 mb-2">{s.title}</h3>
                <p className="text-[13px] text-muted-foreground/65 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role-based section ────────────────────────────── */}
      <section id="roles" className="w-full max-w-7xl mx-auto px-6 py-24" aria-labelledby="roles-heading">
        <div className="text-center mb-14 select-none">
          <h2 id="roles-heading" className="text-[2.5rem] md:text-[3rem] font-semibold tracking-[-0.03em] text-foreground/90 mb-4">
            Built for every role on site.
          </h2>
          <p className="text-[15px] text-muted-foreground/60 max-w-lg mx-auto">
            One platform, four role-specific experiences — each tailored to what that person actually does.
          </p>
        </div>

        {/* Role selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 select-none">
          {(Object.keys(roles) as Array<typeof activeRole>).map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 border ${
                activeRole === role
                  ? 'bg-foreground text-background border-transparent shadow-surface'
                  : 'bg-accent/30 text-muted-foreground/70 border-border/20 hover:text-foreground hover:bg-accent/60'
              }`}
              aria-pressed={activeRole === role}
            >
              {roles[role].badge}
            </button>
          ))}
        </div>

        {/* Role content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center max-w-5xl mx-auto" key={activeRole}>
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/20 bg-accent/30 px-3 py-1 mb-5">
              <span className="text-[12px] font-medium text-muted-foreground/70">{activeContent.badge}</span>
            </div>
            <h3 className="text-[2rem] font-semibold tracking-[-0.02em] text-foreground/90 mb-4 leading-tight">
              {activeContent.title}
            </h3>
            <p className="text-[14px] text-muted-foreground/65 leading-relaxed mb-7">
              {activeContent.description}
            </p>
            <ul className="space-y-3">
              {activeContent.points.map(p => (
                <li key={p} className="flex items-center gap-3 text-[13.5px] font-semibold text-foreground/80">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-success/15 border border-success/25 flex-shrink-0" aria-hidden>
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 mt-9 h-10 px-5 bg-foreground text-background text-[13px] font-bold rounded-xl hover:brightness-110 transition-all shadow-surface"
            >
              Get started free <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>

          {/* Mock dashboard preview */}
          <div className="relative bg-card border border-border/25 rounded-2xl p-5 shadow-elevated overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/60" aria-hidden />
            <div className="flex items-center gap-2 mb-4 select-none">
              <div className="w-3 h-3 rounded-full bg-danger/60" aria-hidden />
              <div className="w-3 h-3 rounded-full bg-warning/60" aria-hidden />
              <div className="w-3 h-3 rounded-full bg-success/60" aria-hidden />
              <span className="ml-2 text-[11px] text-muted-foreground/40 font-mono">buildtrack.app — {activeContent.badge}</span>
            </div>
            <div className="space-y-3">
              <div className="h-2.5 bg-accent/60 rounded-full w-3/4 shimmer-bg" />
              <div className="grid grid-cols-3 gap-2">
                {[80, 45, 65].map((w, i) => (
                  <div key={i} className="bg-accent/40 rounded-xl p-3 border border-border/15">
                    <div className={`h-1.5 rounded-full bg-primary/40 mb-2`} style={{ width: `${w}%` }} />
                    <div className="h-4 bg-foreground/[0.06] rounded w-3/4" />
                    <div className="h-2.5 bg-foreground/[0.04] rounded w-1/2 mt-1" />
                  </div>
                ))}
              </div>
              <div className="bg-accent/30 rounded-xl p-3.5 border border-border/15 space-y-2">
                {[90, 60, 75, 40].map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-foreground/[0.06] flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 rounded bg-foreground/[0.08]" style={{ width: `${w}%` }} />
                      <div className="h-1.5 rounded bg-foreground/[0.04]" style={{ width: `${w - 20}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ────────────────────────────────── */}
      <section id="pricing" className="w-full bg-accent/10 border-y border-border/15 py-24 px-6" aria-labelledby="pricing-heading">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-accent/40 px-4 py-1.5 mb-6 select-none">
            <TrendingUp className="w-3.5 h-3.5 text-success" aria-hidden />
            <span className="text-[12px] font-medium text-muted-foreground/75">Simple, transparent pricing</span>
          </div>
          <h2 id="pricing-heading" className="text-[2.5rem] md:text-[3rem] font-semibold tracking-[-0.03em] text-foreground/90 mb-4">
            One plan. Everything included.
          </h2>
          <p className="text-[15px] text-muted-foreground/60 mb-10 max-w-lg mx-auto leading-relaxed">
            No per-seat charges. No hidden fees. One flat subscription for your entire construction company.
          </p>

          <div className="max-w-sm mx-auto bg-card border border-border/25 rounded-2xl p-8 shadow-elevated text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/60" aria-hidden />
            <div className="mb-6">
              <p className="text-[12px] font-medium text-muted-foreground/70 mb-2">BuildTrack Standard</p>
              <div className="flex items-baseline gap-2">
                <span className="text-[3rem] font-semibold text-foreground tracking-tight tabular-nums">LKR 15K</span>
                <span className="text-[14px] text-muted-foreground/60 font-medium">/month</span>
              </div>
              <p className="text-[12px] text-muted-foreground/55 mt-1">Unlimited projects, unlimited users</p>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'All platform modules included',
                'Unlimited projects & users',
                'Role-based access control',
                'Priority support (WhatsApp)',
                'Custom company branding',
                'Exportable reports (CSV/PDF)',
                '14-day free trial',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-[13px] font-semibold text-foreground/80">
                  <Check className="w-4 h-4 text-success flex-shrink-0" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 w-full h-11 bg-foreground text-background text-[14px] font-bold rounded-xl hover:brightness-110 transition-all shadow-surface"
            >
              Start free trial <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="w-full max-w-4xl mx-auto px-6 py-32 text-center" aria-label="Call to action">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-accent/30 px-4 py-1.5 mb-6 select-none">
          <Activity className="w-3.5 h-3.5 text-primary animate-pulse-soft" aria-hidden />
          <span className="text-[12px] font-medium text-muted-foreground/75">Ready to get started?</span>
        </div>
        <h2 className="text-[3rem] md:text-[4rem] font-semibold tracking-[-0.03em] leading-[1.05] text-foreground/90 mb-5">
          Transform how you build.
        </h2>
        <p className="text-[16px] text-muted-foreground/60 max-w-lg mx-auto leading-relaxed mb-10">
          Bring your projects, people, and money into one workspace.
          Start your 14-day free trial — no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2.5 h-12 px-8 bg-foreground text-background text-[15px] font-bold rounded-2xl hover:brightness-110 transition-all duration-200 active:scale-[0.98] shadow-elevated"
          >
            Create your workspace
            <ArrowRight className="w-5 h-5" aria-hidden />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 h-12 px-8 border border-border/30 text-foreground/75 text-[15px] font-semibold rounded-2xl hover:bg-accent/40 hover:border-border/50 transition-all"
          >
            Sign in
            <ChevronRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="w-full border-t border-border/15 bg-accent/5" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center" aria-hidden>
              <HardHat className="w-4 h-4" />
            </div>
            <span className="font-bold text-[14px] text-foreground/80">BuildTrack</span>
          </div>
          <p className="text-[12px] text-muted-foreground/50 font-medium">
            &copy; {new Date().getFullYear()} BuildTrack. Designed for Sri Lankan construction professionals.
          </p>
          <div className="flex items-center gap-6 text-[12px] font-semibold text-muted-foreground/55">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
