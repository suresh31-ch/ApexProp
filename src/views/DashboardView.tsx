import React, { useState } from 'react';
import { Sparkles, Building2, ExternalLink, ArrowRight, Layers, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { KPICards } from '../components/KPICards';
import { InspectionUploader } from '../components/InspectionUploader';
import { RecentActivityList } from '../components/RecentActivityList';
import { Charts } from '../components/Charts';
import { DashboardMetrics, InspectionRecord, ActivityItem } from '../types';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  activities: ActivityItem[];
  userName?: string;
  onInspectionCompleted: (record: InspectionRecord) => void;
  onSelectActivity: (activity: ActivityItem) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  activities,
  userName = 'Suresh',
  onInspectionCompleted,
  onSelectActivity,
  onNavigateToTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner matching design reference */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0d162a] via-[#101c36] to-[#0f1d3d] border border-blue-500/20 p-6 shadow-xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {userName}! 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-blue-200/80 mt-1 font-medium">
            Your AI-powered property intelligence dashboard
          </p>
        </div>

        {/* Right side: Modern Architectural Action matching reference */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-300 text-xs font-semibold backdrop-blur-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Asset Intelligence Active</span>
          </div>
          <button
            onClick={() => onNavigateToTab('inspect')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            <span>Scan Property</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Total Properties, Issues Detected, Resolved, Pending Actions) */}
      <KPICards
        metrics={metrics}
        onCardClick={(type) => {
          if (type === 'issues' || type === 'pending') {
            onNavigateToTab('investigations');
          } else if (type === 'resolved') {
            onNavigateToTab('workorders');
          } else {
            onNavigateToTab('risk');
          }
        }}
      />

      {/* Central Row: Inspect a Property (Left) & Recent Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8">
          <InspectionUploader
            onInspectionComplete={onInspectionCompleted}
            onNavigateToDetail={(id) => onNavigateToTab('investigations')}
          />
        </div>

        <div className="lg:col-span-4">
          <RecentActivityList
            activities={activities}
            onSelectActivity={onSelectActivity}
            onViewAll={() => onNavigateToTab('investigations')}
          />
        </div>
      </div>

      {/* Bottom Row: Charts matching reference */}
      <Charts metrics={metrics} />
    </div>
  );
};
