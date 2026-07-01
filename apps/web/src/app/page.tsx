'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  HardHat, 
  FileText, 
  Landmark, 
  Users, 
  ClipboardCheck, 
  LayoutGrid, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  Coins,
  ShieldCheck,
  Briefcase,
  Sparkles,
  Database,
  Lock,
  ChevronRight,
  Map,
  Activity,
  Check,
  Clock
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
    <div className="flex flex-col min-h-screen bg-stone-50/50 text-zinc-800 scroll-smooth selection:bg-amber-500 selection:text-zinc-950 font-sans">
      
      {/* Soft warm-grey Grid Background Layer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e780_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e780_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-10" />

      {/* Floating Header */}
      <header className="sticky top-4 z-40 w-[95%] max-w-7xl mx-auto border border-zinc-200/80 bg-white/80 backdrop-blur-xl rounded-2xl shadow-md mt-4">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="flex items-center justify-center w-8.5 h-8.5 rounded-lg bg-amber-500 text-zinc-955 shadow-md shadow-amber-500/25 group-hover:scale-105 transition-all duration-300">
              <HardHat className="w-4.5 h-4.5" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-zinc-950">Build<span className="text-amber-500">Track</span></span>
          </div>
          
          <nav className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition-colors">
            <a href="#features" className="hover:text-amber-500 transition-colors">Features</a>
            <a href="#about" className="hover:text-amber-500 transition-colors">How it Works</a>
            <a href="#market" className="hover:text-amber-500 transition-colors">Target Industry</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-amber-500 text-zinc-950 hover:bg-amber-600 font-bold shadow-md shadow-amber-500/10">Register Company</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        {/* Soft glowing auroras */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="space-y-8 lg:col-span-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-zinc-200/80 px-4 py-1.5 text-xs font-bold text-amber-600 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                Next-Gen Construction Management Platform
              </div>
              
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-zinc-950">
                Operate sites <br />
                with <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-700">absolute precision.</span>
              </h1>
              
              <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-lg font-medium">
                Unify site logs, worker attendance registers, material supply pipelines, and financial expense approvals in a single, high-fidelity SaaS dashboard built for Sri Lankan contractors.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/register">
                  <Button size="lg" className="bg-amber-500 text-zinc-950 hover:bg-amber-600 font-extrabold px-8 py-6 rounded-xl shadow-xl shadow-amber-500/10 group">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="border-zinc-200 bg-white text-zinc-700 font-semibold px-8 py-6 rounded-xl hover:bg-zinc-50 hover:text-zinc-950 transition-all shadow-sm">
                    Explore Demo Logins
                  </Button>
                </Link>
              </div>

              {/* Dynamic Telemetry tags */}
              <div className="flex flex-wrap gap-x-8 gap-y-4 pt-6 border-t border-zinc-200">
                <div className="space-y-1">
                  <div className="text-2xl font-black text-zinc-900">LKR 0M</div>
                  <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Financial Leakage Prevented</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-black text-zinc-900">100%</div>
                  <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Multi-Tenant Isolation</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-black text-zinc-900">4000+</div>
                  <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider">API Logs/Sec Handled</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Mockup App (3D Mockup Perspective) */}
            <div className="lg:col-span-6 w-full flex items-center justify-center relative select-none">
              
              {/* Backlight glow behind the app frame */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-orange-500/5 rounded-[2rem] blur-3xl -z-10 translate-y-6"></div>
              
              <div className="w-full max-w-[560px] bg-white border border-zinc-250/80 rounded-2xl shadow-[0_20px_50px_-15px_rgba(24,24,27,0.15)] p-1.5 flex flex-col justify-between group hover:border-zinc-300 transition-colors duration-500">
                
                {/* macOS style Window Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-200/80 rounded-t-xl">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <div className="text-xs font-bold text-zinc-400 tracking-widest uppercase">buildtrack.lk/app/dashboard</div>
                  <div className="w-12"></div>
                </div>

                {/* Dashboard Inner Container */}
                <div className="flex-1 bg-zinc-50/50 p-4 grid grid-cols-12 gap-3.5 text-zinc-700 rounded-b-xl">
                  
                  {/* Left Mock Sidebar */}
                  <div className="col-span-3 flex flex-col gap-2.5 border-r border-zinc-200/60 pr-3 pt-1">
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                      <div className="w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center text-zinc-950 font-black text-xs">BT</div>
                      <div className="text-xs font-black text-zinc-950 tracking-wider">BuildTrack</div>
                    </div>
                    <div className="h-4.5 bg-zinc-200/60 rounded-md w-full"></div>
                    <div className="h-4.5 bg-amber-500/10 text-amber-700 text-xs px-2.5 py-1 rounded-md font-extrabold uppercase tracking-wide">Dashboard</div>
                    <div className="h-4.5 bg-zinc-200/40 rounded-md w-11/12"></div>
                    <div className="h-4.5 bg-zinc-200/40 rounded-md w-4/5"></div>
                    <div className="h-4.5 bg-zinc-200/40 rounded-md w-5/6"></div>
                  </div>

                  {/* Right Dashboard Mock Panel */}
                  <div className="col-span-9 space-y-3 pl-1 pt-1">
                    
                    {/* Project Header Widget */}
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-zinc-200/60 shadow-sm">
                      <div>
                        <div className="text-[8px] font-extrabold text-amber-600 tracking-wider">PROJECT SELECT</div>
                        <h4 className="text-xs font-bold mt-0.5 text-zinc-950">Horizon Tower Apartment</h4>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-extrabold text-zinc-500">ACTIVE</span>
                      </div>
                    </div>

                    {/* Cost Metrics Widget */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border border-zinc-200/60 rounded-xl shadow-sm">
                        <div className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Budget Spent</div>
                        <div className="text-xs font-extrabold text-zinc-950 mt-1">LKR 85,000,000</div>
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-emerald-500 h-full w-[56%] rounded-full"></div>
                        </div>
                        <div className="flex justify-between text-[7px] text-zinc-400 mt-1">
                          <span>Usage: 56.7%</span>
                          <span>Cap: 150M</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-zinc-200/60 rounded-xl shadow-sm">
                        <div className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Labour Strength</div>
                        <div className="text-xs font-extrabold text-zinc-950 mt-1">42 Workers</div>
                        <div className="text-[8.5px] font-bold text-amber-600 mt-1 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-amber-500" /> Attendance Completed
                        </div>
                      </div>
                    </div>

                    {/* Real-time Logger Grid */}
                    <div className="p-3 bg-white border border-zinc-200/60 rounded-xl shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-[8.5px] font-bold uppercase tracking-wider text-zinc-400">
                        <span>LIVE REPORT LOGS</span>
                        <span className="text-amber-600">REAL-TIME</span>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-zinc-600">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Task completed: Concrete Slab Pouring</span>
                          </div>
                          <span className="text-zinc-400 font-semibold">Just Now</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>Material Request: 50T reinforcement steel</span>
                          </div>
                          <span className="text-zinc-400 font-semibold">10m ago</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                            <span>Shift Attendance checked by PM</span>
                          </div>
                          <span className="text-zinc-400 font-semibold">1h ago</span>
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

      {/* Features Section (Bento Grid) */}
      <section id="features" className="py-32 bg-white border-y border-zinc-200/80 relative scroll-mt-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-zinc-200 to-transparent"></div>
        
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-950 leading-tight">
              Designed for performance. <br />
              Built for <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-700">construction scale.</span>
            </h2>
            <p className="text-zinc-500 text-base sm:text-lg">
              Unlock modular site telemetry. Replace chaotic communications and paper receipts with structured databases.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[220px]">
            
            {/* Bento 1: Large (Real-Time Command) */}
            <div className="md:col-span-8 md:row-span-2 p-8 bg-stone-50 border border-zinc-200/80 rounded-3xl flex flex-col justify-between relative overflow-hidden group hover:shadow-lg hover:border-zinc-300 transition-all duration-300">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[70px] pointer-events-none"></div>
              
              <div className="max-w-md space-y-3 z-10">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <LayoutGrid className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-950">Project Portfolios Command</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                  Organize multiple active job sites under one centralized portal. Assign distinct company user roles, monitor project progress bars, and check client schedules in real time.
                </p>
              </div>

              {/* Graphical element inside Bento */}
              <div className="h-28 bg-white border border-zinc-200/80 rounded-2xl p-4 flex flex-col justify-between mt-4 shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-800">Horizon Tower</span>
                  <span className="text-emerald-700 font-extrabold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">58% Done</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full w-[58%] rounded-full"></div>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Start: June 2025</span>
                  <span>End: June 2027</span>
                </div>
              </div>
            </div>

            {/* Bento 2: Medium (Expense tracking) */}
            <div className="md:col-span-4 md:row-span-2 p-8 bg-stone-50 border border-zinc-200/80 rounded-3xl flex flex-col justify-between hover:shadow-lg hover:border-zinc-300 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none"></div>
              
              <div className="space-y-3 z-10">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center">
                  <Landmark className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950">Automated Expense approvals</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  Log field expenses on-site, upload transaction receipts securely, and process multi-level management approvals dynamically.
                </p>
              </div>

              <div className="p-3.5 bg-white border border-zinc-200/60 rounded-xl space-y-2 mt-4 text-xs shadow-sm">
                <div className="flex justify-between font-bold text-zinc-800 border-b border-zinc-100 pb-1.5">
                  <span>Cement purchase voucher</span>
                  <span className="text-amber-700 font-extrabold">LKR 145K</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Submitted by Engineer</span>
                  <span className="text-emerald-700 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">APPROVED</span>
                </div>
              </div>
            </div>

            {/* Bento 3: Medium (Daily reports) */}
            <div className="md:col-span-4 md:row-span-1 p-6 bg-stone-50 border border-zinc-200/80 rounded-3xl flex flex-col justify-between hover:shadow-lg hover:border-zinc-300 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-zinc-950">Daily Site Logs</h4>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Log daily summary sheets, document safety observations, track local weather reports, and attach site photos instantly.
              </p>
            </div>

            {/* Bento 4: Medium (Labour Attendance) */}
            <div className="md:col-span-4 md:row-span-1 p-6 bg-stone-50 border border-zinc-200/80 rounded-3xl flex flex-col justify-between hover:shadow-lg hover:border-zinc-300 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-700 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-zinc-950">Labour Attendance</h4>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Mark daily worker attendance in grids, save custom daily rates, and calculate weekly/monthly payouts automatically.
              </p>
            </div>

            {/* Bento 5: Medium (Material Procurement) */}
            <div className="md:col-span-4 md:row-span-1 p-6 bg-stone-50 border border-zinc-200/80 rounded-3xl flex flex-col justify-between hover:shadow-lg hover:border-zinc-300 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-700 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-zinc-950">Material Requisitions</h4>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Request aggregates, cement, and steel reinforcement. Manage supplier rate catalogs and monitor deliveries.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works Section (#about) */}
      <section id="about" className="py-32 bg-stone-50/50 border-b border-zinc-200 scroll-mt-16 relative">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-24">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-950">How BuildTrack Works</h2>
            <p className="text-zinc-550 text-base sm:text-lg">
              Get your site commands up and running in a few simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            
            {/* Timeline connector line for wide screens */}
            <div className="hidden md:block absolute top-[28px] left-[12%] right-[12%] h-[1px] bg-gradient-to-r from-amber-500/10 via-zinc-250 to-amber-500/10 -z-10"></div>

            {/* Step 1 */}
            <div className="space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 text-amber-600 font-extrabold flex items-center justify-center text-lg group-hover:border-amber-500/50 transition-colors shadow-sm">
                01
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-900">Scaffold Workspace</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  Register your construction company and invite site engineers, project managers, and quantity surveyors with role settings.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 text-zinc-500 font-extrabold flex items-center justify-center text-lg group-hover:border-amber-500/50 transition-colors shadow-sm">
                02
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-900">Define Job Sites</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  Add projects, specify total budget estimates, outline deadlines, and allocate management teams to specific sites.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 text-zinc-500 font-extrabold flex items-center justify-center text-lg group-hover:border-amber-500/50 transition-colors shadow-sm">
                03
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-900">Capture Daily Data</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  Site supervisors submit daily reports, register worker check-ins, record materials used, and log raw field expenses.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 text-zinc-500 font-extrabold flex items-center justify-center text-lg group-hover:border-amber-500/50 transition-colors shadow-sm">
                04
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-900">Analyze Health</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  Track budget variance details, analyze category cost distributions, and download print-ready project reports.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Target Industry Section (#market) */}
      <section id="market" className="py-32 bg-white scroll-mt-16 relative">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-20">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-950">Calibrated for your Role</h2>
            <p className="text-zinc-500 text-base sm:text-lg">
              Tailored workspaces specifically designed for stakeholders in the Sri Lankan construction industry.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Nav Tabs */}
            <div className="lg:col-span-4 flex flex-col gap-2">
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
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isActive 
                        ? 'bg-stone-50 border-amber-500 text-zinc-950 shadow-md shadow-amber-500/5' 
                        : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    <div className="font-extrabold text-sm">{tab.label}</div>
                    <div className="text-xs uppercase font-bold tracking-wider mt-0.5 opacity-60">{tab.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Right Segment Panel Detail */}
            <div className="lg:col-span-8 bg-stone-50 border border-zinc-200/80 p-8 rounded-3xl relative overflow-hidden min-h-[320px] flex flex-col justify-between shadow-sm">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>
              
              <div className="space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600">{segmentContent[activeSegment].badge}</span>
                <h3 className="text-2xl font-black text-zinc-950">{segmentContent[activeSegment].title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-xl font-medium">
                  {segmentContent[activeSegment].description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 mt-6 border-t border-zinc-200">
                {segmentContent[activeSegment].features.map((feat, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-16 text-center text-xs text-zinc-500">
        <div className="container max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-zinc-950">
              <HardHat className="w-4.5 h-4.5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-zinc-950">BuildTrack</span>
          </div>

          <div className="flex flex-wrap gap-6 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <a href="#features" className="hover:text-amber-500 transition-colors">Features</a>
            <a href="#about" className="hover:text-amber-500 transition-colors">How it Works</a>
            <a href="#market" className="hover:text-amber-500 transition-colors">Target Industry</a>
          </div>

          <div>
            &copy; {new Date().getFullYear()} BuildTrack. Designed for Sri Lankan SME Contractors.
          </div>
        </div>
      </footer>

    </div>
  );
}
