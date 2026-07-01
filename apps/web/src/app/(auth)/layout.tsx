import React from 'react';
import Link from 'next/link';
import { HardHat } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-zinc-50 dark:bg-zinc-950">
      {/* Left side - Sleek login form */}
      <div className="flex flex-col justify-between p-6 col-span-1 md:p-10 lg:col-span-5 xl:col-span-4 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900 dark:text-white">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20">
              <HardHat className="w-5.5 h-5.5" />
            </div>
            <span>Build<span className="text-amber-500">Track</span></span>
          </Link>
        </div>
        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto py-12">
          {children}
        </div>
        <div className="text-xs text-zinc-500 text-center dark:text-zinc-400">
          &copy; {new Date().getFullYear()} BuildTrack. All rights reserved.
        </div>
      </div>

      <div className="hidden lg:flex lg:col-span-7 xl:col-span-8 bg-stone-50/40 relative overflow-hidden flex-col justify-between p-12 text-zinc-800 border-l border-zinc-200/80">
        {/* Background warm-light grid and glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e760_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e760_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="text-xs font-extrabold tracking-wider uppercase text-amber-600">
            Smart Site Management
          </div>
        </div>

        <div className="relative z-10 max-w-2xl mt-auto">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight lg:text-5xl text-zinc-950 mb-6">
            Simplify construction tracking from <span className="text-amber-600">foundation</span> to finish.
          </h1>
          <p className="text-base text-zinc-600 mb-8 leading-relaxed font-medium">
            Manage worker attendance, log daily reports, request materials, track project budgets, and communicate changes instantly. The all-in-one platform built for Sri Lanka's contractor ecosystem.
          </p>
          <div className="flex gap-8 border-t border-zinc-200/80 pt-8 mt-8">
            <div>
              <div className="text-2xl font-black text-zinc-900">LKR 125M+</div>
              <div className="text-xs font-bold text-zinc-550 uppercase tracking-wider">Expenses Tracked</div>
            </div>
            <div>
              <div className="text-2xl font-black text-zinc-900">350+</div>
              <div className="text-xs font-bold text-zinc-550 uppercase tracking-wider">Site Engineers Active</div>
            </div>
            <div>
              <div className="text-2xl font-black text-zinc-900">1.8k+</div>
              <div className="text-xs font-bold text-zinc-550 uppercase tracking-wider">Tasks Completed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
