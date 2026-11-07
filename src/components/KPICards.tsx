import React from 'react';
import { Building2, AlertTriangle, CheckCircle2, Clock, ArrowUp } from 'lucide-react';
import { DashboardMetrics } from '../types';

interface KPICardsProps {
  metrics: DashboardMetrics | null;
  onCardClick?: (type: string) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ metrics, onCardClick }) => {
  const cards = [
    {
      id: 'properties',
      title: 'Total Properties',
      value: metrics ? metrics.totalProperties : 0,
      icon: Building2,
      iconBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      sparklineColor: '#3b82f6',
      sparklinePoints: 'M0,18 Q20,12 40,16 T80,8 T120,4',
    },
    {
      id: 'issues',
      title: 'Issues Detected',
      value: metrics ? metrics.issuesDetected : 0,
      icon: AlertTriangle,
      iconBg: 'bg-red-500/20 text-red-400 border border-red-500/30',
      sparklineColor: '#ef4444',
      sparklinePoints: 'M0,14 Q20,16 40,10 T80,14 T120,6',
    },
    {
      id: 'resolved',
      title: 'Resolved Work Orders',
      value: metrics ? metrics.resolvedWorkOrders : 0,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      sparklineColor: '#10b981',
      sparklinePoints: 'M0,16 Q20,14 40,12 T80,6 T120,2',
    },
    {
      id: 'pending',
      title: 'Pending Actions',
      value: metrics ? metrics.pendingActions : 0,
      icon: Clock,
      iconBg: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      sparklineColor: '#a855f7',
      sparklinePoints: 'M0,10 Q20,14 40,8 T80,12 T120,10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onCardClick && onCardClick(card.id)}
            className="rounded-2xl bg-[#101726]/90 border border-slate-800/90 p-4 relative overflow-hidden transition-all duration-200 hover:border-slate-700 hover:shadow-lg hover:shadow-blue-950/20 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg} shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Active Audit
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                  {card.value}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  {card.title}
                </div>
              </div>

              {/* Mini Sparkline Chart */}
              <div className="w-20 h-8 opacity-60 group-hover:opacity-100 transition-opacity">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 120 24">
                  <path
                    d={card.sparklinePoints}
                    fill="none"
                    stroke={card.sparklineColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
