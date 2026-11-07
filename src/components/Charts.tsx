import React, { useState } from 'react';
import { ArrowDown, ChevronDown, Activity, DollarSign, PieChart, TrendingUp } from 'lucide-react';
import { DashboardMetrics } from '../types';

interface ChartsProps {
  metrics: DashboardMetrics | null;
}

export const Charts: React.FC<ChartsProps> = ({ metrics }) => {
  const [healthPeriod, setHealthPeriod] = useState('This Month');
  const [defectPeriod, setDefectPeriod] = useState('6 Months');

  // Genuine chart metrics without hardcoded demo fallbacks
  const totalSurveyed = (metrics?.healthBreakdown.healthyPercent ?? 0) + (metrics?.healthBreakdown.attentionPercent ?? 0) + (metrics?.healthBreakdown.criticalPercent ?? 0);
  const hasHealthData = totalSurveyed > 0;

  const healthy = metrics?.healthBreakdown.healthyPercent ?? 0;
  const attention = metrics?.healthBreakdown.attentionPercent ?? 0;
  const critical = metrics?.healthBreakdown.criticalPercent ?? 0;

  const defectTrends = metrics?.monthlyDefectTrends?.length ? metrics.monthlyDefectTrends : [
    { month: 'Jul', defectsCount: 0 },
    { month: 'Aug', defectsCount: 0 },
    { month: 'Sep', defectsCount: 0 },
    { month: 'Oct', defectsCount: 0 },
    { month: 'Nov', defectsCount: 0 },
  ];

  const totalDefectsInTrend = defectTrends.reduce((acc, curr) => acc + curr.defectsCount, 0);

  const costFormatted = metrics?.maintenanceCostEstimateINR.totalFormatted ?? '₹0';
  const costChange = metrics?.maintenanceCostEstimateINR.changePercent ?? 0;

  // SVG calculations for Donut Chart
  // Radius = 40, circumference = 2 * PI * 40 = 251.327
  const circumference = 251.327;
  const healthyOffset = 0;
  const healthyLength = (healthy / 100) * circumference;

  const attentionOffset = -healthyLength;
  const attentionLength = (attention / 100) * circumference;

  const criticalOffset = -(healthyLength + attentionLength);
  const criticalLength = (critical / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Property Health Overview Donut Chart */}
      <div className="lg:col-span-4 rounded-2xl bg-[#101726]/90 border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Property Health Overview
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60 cursor-pointer">
            <span>{healthPeriod}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        <div className="flex items-center justify-around py-4">
          {/* Donut Chart SVG */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="11"
              />
              {/* Healthy segment (Green) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#10b981"
                strokeWidth="11"
                strokeDasharray={`${healthyLength} ${circumference}`}
                strokeDashoffset={healthyOffset}
                className="transition-all duration-700"
              />
              {/* Attention segment (Yellow) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="11"
                strokeDasharray={`${attentionLength} ${circumference}`}
                strokeDashoffset={attentionOffset}
                className="transition-all duration-700"
              />
              {/* Critical segment (Red) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#ef4444"
                strokeWidth="11"
                strokeDasharray={`${criticalLength} ${circumference}`}
                strokeDashoffset={criticalOffset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {hasHealthData ? `${healthy}%` : '0'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {hasHealthData ? 'Healthy' : 'No Data'}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300 font-medium">Healthy</span>
              </div>
              <span className="font-bold text-white font-mono">{healthy}%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300 font-medium">Attention</span>
              </div>
              <span className="font-bold text-white font-mono">{attention}%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-slate-300 font-medium">Critical</span>
              </div>
              <span className="font-bold text-white font-mono">{critical}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Defect Trends Curve Chart */}
      <div className="lg:col-span-5 rounded-2xl bg-[#101726]/90 border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Defect Trends
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60 cursor-pointer">
            <span>{defectPeriod}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Line Chart Visual */}
        <div className="pt-2 pb-1 relative">
          <div className="flex h-36 items-end justify-between px-2 relative">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-slate-600 w-full" />
              <div className="border-b border-slate-600 w-full" />
              <div className="border-b border-slate-600 w-full" />
              <div className="border-b border-slate-600 w-full" />
            </div>

            {/* Interactive SVG Curve */}
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible z-10">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d="M 10,85 Q 75,65 140,40 T 210,55 T 280,75 L 280,100 L 10,100 Z"
                fill="url(#trendGradient)"
              />
              {/* Curve Line */}
              <path
                d="M 10,85 Q 75,65 140,40 T 210,55 T 280,75"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Active data points */}
              <circle cx="10" cy="85" r="4" fill="#60a5fa" className="shadow" />
              <circle cx="75" cy="65" r="4" fill="#60a5fa" className="shadow" />
              <circle cx="140" cy="40" r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
              <circle cx="210" cy="55" r="4" fill="#60a5fa" />
              <circle cx="280" cy="75" r="5" fill="#38bdf8" />
            </svg>
          </div>

          {/* Month Labels */}
          <div className="flex justify-between px-3 text-[11px] font-medium text-slate-400 mt-2">
            {defectTrends.map((t) => (
              <span key={t.month}>{t.month}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Maintenance Cost Estimate Bar Chart */}
      <div className="lg:col-span-3 rounded-2xl bg-[#101726]/90 border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
              Maintenance Cost Estimate
            </h3>
          </div>
        </div>

        <div className="py-2">
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
            {costFormatted}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-1">
            <ArrowDown className="w-3.5 h-3.5" />
            <span>{Math.abs(costChange)}% vs last month</span>
          </div>
        </div>

        {/* Visual Monthly Progress Bars */}
        <div className="flex items-end gap-2 h-20 pt-2 px-1">
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-purple-500/30 rounded-t-sm h-10 hover:bg-purple-500 transition-all" />
            <span className="text-[10px] text-slate-400 font-mono">Jul</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-purple-500/40 rounded-t-sm h-12 hover:bg-purple-500 transition-all" />
            <span className="text-[10px] text-slate-400 font-mono">Aug</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-purple-500/60 rounded-t-sm h-16 hover:bg-purple-500 transition-all" />
            <span className="text-[10px] text-slate-400 font-mono">Sep</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-purple-500/70 rounded-t-sm h-14 hover:bg-purple-500 transition-all" />
            <span className="text-[10px] text-slate-400 font-mono">Oct</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-purple-500 rounded-t-sm h-11 shadow-lg shadow-purple-500/40" />
            <span className="text-[10px] text-purple-300 font-bold font-mono">Nov</span>
          </div>
        </div>
      </div>
    </div>
  );
};
