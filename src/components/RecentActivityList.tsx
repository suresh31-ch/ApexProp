import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Wrench,
  ArrowRight,
  Clock,
  Inbox
} from 'lucide-react';
import { ActivityItem } from '../types';

interface RecentActivityListProps {
  activities: ActivityItem[];
  onSelectActivity: (item: ActivityItem) => void;
  onViewAll?: () => void;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities,
  onSelectActivity,
  onViewAll
}) => {
  const getIcon = (type: string, severity?: string) => {
    switch (type) {
      case 'defect_detected':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'inspection_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'report_generated':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'work_order_updated':
      case 'work_order_approved':
        return <Wrench className="w-4 h-4 text-purple-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBadgeStyle = (type: string, severity?: string) => {
    if (type === 'defect_detected' || severity === 'HIGH' || severity === 'CRITICAL') {
      return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
    }
    if (type === 'inspection_completed') {
      return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
    }
    if (type === 'report_generated') {
      return 'bg-blue-500/15 border-blue-500/30 text-blue-400';
    }
    return 'bg-purple-500/15 border-purple-500/30 text-purple-400';
  };

  return (
    <div className="rounded-2xl bg-[#101726]/90 border border-slate-800 p-5 shadow-xl flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">⚡</span>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Recent Activity
            </h3>
          </div>
          {onViewAll && activities.length > 0 && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activities.length > 0 ? (
          <div className="space-y-2.5">
            {activities.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectActivity(item)}
                className="p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-800/70 border border-slate-800/80 hover:border-slate-700/80 flex items-center justify-between gap-3 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${getBadgeStyle(item.type, item.severity)}`}>
                    {getIcon(item.type, item.severity)}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {item.propertyName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {item.timestamp}
                  </span>
                  {item.imageUrl ? (
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.propertyName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : item.type === 'report_generated' ? (
                    <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-[10px] font-bold">
                      PDF
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Wrench className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 px-4 text-center">
            <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-2.5" />
            <h4 className="text-xs font-bold text-slate-300">No recent activity logged</h4>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
              New property inspections, defect detections, and contractor work orders will record activity here in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
