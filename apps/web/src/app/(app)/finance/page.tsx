'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, Wallet, Banknote, FileText, 
  BarChart2, HardHat, RefreshCw, Loader2
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { SkeletonChart } from '@/components/ui/skeleton';

// Dynamic imports for the tabs
import { DashboardTab } from './components/DashboardTab';
import { ProjectsTab } from './components/ProjectsTab';
import { FundingDashboardTab } from './components/FundingTab';
import { ProcurementTab } from './components/ProcurementTab';
import { DrillDownModal } from './components/DrillDownModal';
import { AssetsTab } from './components/AssetsTab';
import { ProjectFinanceWorkspace } from './components/ProjectFinanceWorkspace';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'funding' | 'procurement' | 'assets' | 'reports'>('dashboard');
  
  const [drillDownState, setDrillDownState] = useState<{ open: boolean; type: string | null; payload: any }>({
    open: false,
    type: null,
    payload: null,
  });

  const { data: overview, isLoading, refetch, isRefetching } = useQuery<any>({
    queryKey: ['finance-overview'],
    queryFn: async () => (await apiClient.get('/finance/overview')).data,
    retry: 1,
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const handleDrillDown = (type: string, payload?: any) => {
    if (type === 'PROJECT') {
      setActiveProjectId(payload.id);
    } else {
      setDrillDownState({ open: true, type, payload });
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'projects', label: 'Projects', icon: Building2 },
    { id: 'funding', label: 'Funding', icon: Wallet },
    { id: 'procurement', label: 'Procurement', icon: FileText },
    { id: 'assets', label: 'Assets', icon: HardHat },
    { id: 'reports', label: 'Reports', icon: Banknote },
  ] as const;

  if (activeProjectId) {
    return (
      <div className="pt-2">
        <ProjectFinanceWorkspace 
          projectId={activeProjectId} 
          onBack={() => setActiveProjectId(null)} 
          onNavigate={(tab) => {
            setActiveProjectId(null);
            setActiveTab(tab as any);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20" aria-label="Finance Module">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border/20 pb-5">
        <div className="text-left select-none">
          <h1 className="text-[2.25rem] font-semibold tracking-tight text-foreground/90">
            Financial Control Center
          </h1>
          <p className="text-[13px] text-muted-foreground/65 mt-1 font-medium max-w-2xl">
            Enterprise treasury analytics, project tracking, and cash flow visualization.
          </p>
        </div>
        
        <button 
          onClick={() => refetch()} 
          disabled={isRefetching}
          className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/20 hover:bg-accent/40 bg-card shadow-sm"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isRefetching && 'animate-spin')} />
          Sync Data
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide border-b border-border/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveProjectId(null); setActiveTab(tab.id as any); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-[13px] font-bold transition-all relative select-none',
              activeTab === tab.id
                ? 'text-foreground bg-accent/40 border border-border/20 border-b-0'
                : 'text-muted-foreground/60 hover:text-foreground/80 hover:bg-accent/20'
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-primary" : "")} />
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="pt-2">
        {isLoading ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-4 gap-4"><SkeletonChart height={120} /><SkeletonChart height={120} /><SkeletonChart height={120} /><SkeletonChart height={120} /></div>
            <SkeletonChart height={400} />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardTab data={overview} onDrillDown={handleDrillDown} />}
            {activeTab === 'projects' && <ProjectsTab data={overview} onDrillDown={handleDrillDown} />}
            {activeTab === 'funding' && <FundingDashboardTab />}
            {activeTab === 'procurement' && <ProcurementTab />}
            {activeTab === 'assets' && <AssetsTab />}
            {activeTab === 'reports' && (
              <div className="p-6 text-center border border-border/10 rounded-xl bg-card text-muted-foreground text-sm font-semibold">
                Advanced Analytics and Reports coming soon.
              </div>
            )}
          </>
        )}
      </div>

      <DrillDownModal 
        open={drillDownState.open} 
        onOpenChange={(o) => setDrillDownState(prev => ({ ...prev, open: o }))}
        type={drillDownState.type}
        payload={drillDownState.payload}
      />
    </div>
  );
}
