import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Wrench,
  Building2,
  ArrowRight,
  ShieldCheck,
  LogIn,
  UserCheck,
  LogOut
} from 'lucide-react';
import { InspectionRecord, WorkOrder } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onStartInspection: () => void;
  inspections?: InspectionRecord[];
  workOrders?: WorkOrder[];
  onSelectInspection?: (inspection: InspectionRecord) => void;
  onSelectWorkOrder?: (wo: WorkOrder) => void;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  onStartInspection,
  inspections = [],
  workOrders = [],
  onSelectInspection,
  onSelectWorkOrder,
  onOpenAuthModal,
  onSignOut
}) => {
  const { user, profile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format as "Mon, 3 Nov 2026 | 10:24 AM"
      const datePart = now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const timePart = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setCurrentTime(`${datePart}  |  ${timePart}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter matching records
  const query = searchQuery.trim().toLowerCase();
  const matchingInspections = query.length >= 2
    ? inspections.filter(
        (i) =>
          i.propertyName.toLowerCase().includes(query) ||
          i.location.toLowerCase().includes(query) ||
          i.defectCategory.toLowerCase().includes(query) ||
          i.summary.toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const matchingWorkOrders = query.length >= 2
    ? workOrders.filter(
        (w) =>
          w.title.toLowerCase().includes(query) ||
          w.propertyName.toLowerCase().includes(query) ||
          w.id.toLowerCase().includes(query) ||
          w.trade.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const hasSearchResults = matchingInspections.length > 0 || matchingWorkOrders.length > 0;

  // Real derived notifications from genuine portfolio data
  const realNotifications = [
    ...inspections
      .filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH')
      .slice(0, 3)
      .map((i) => ({
        id: `insp-${i.id}`,
        type: 'alert' as const,
        title: `High Risk Defect: ${i.propertyName}`,
        desc: `${i.defectCategory} — ${i.summary}`,
        time: new Date(i.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        item: i
      })),
    ...workOrders
      .filter((w) => w.status === 'PENDING_APPROVAL' || w.status === 'IN_PROGRESS')
      .slice(0, 2)
      .map((w) => ({
        id: `wo-${w.id}`,
        type: 'info' as const,
        title: `Work Order: ${w.title}`,
        desc: `${w.propertyName} • Assigned to ${w.assignedTo || 'Pending contractor'}`,
        time: w.dueDate ? `Due ${w.dueDate}` : 'Pending',
        item: null
      }))
  ];

  return (
    <header className="h-16 px-6 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Live Global Search Bar */}
      <div ref={searchContainerRef} className="flex-1 max-w-md relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search properties, reports, or work orders..."
            value={searchQuery}
            onFocus={() => setShowSearchDropdown(true)}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowSearchDropdown(true);
            }}
            className="w-full bg-[#111827]/80 text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm pl-10 pr-8 py-2 rounded-xl border border-slate-700/60 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange('');
                setShowSearchDropdown(false);
              }}
              className="absolute right-3 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {showSearchDropdown && query.length >= 2 && (
          <div className="absolute left-0 right-0 mt-2 bg-[#101728] border border-slate-700/90 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in duration-150 max-h-96 overflow-y-auto">
            {hasSearchResults ? (
              <div className="space-y-3">
                {/* Inspections Category */}
                {matchingInspections.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2">
                      Properties & Inspections
                    </span>
                    <div className="mt-1 space-y-1">
                      {matchingInspections.map((insp) => (
                        <div
                          key={insp.id}
                          onClick={() => {
                            onSelectInspection && onSelectInspection(insp);
                            setShowSearchDropdown(false);
                          }}
                          className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                              <img src={insp.imageUrl} alt={insp.propertyName} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-blue-300">
                                {insp.propertyName}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {insp.defectCategory} • {insp.floorOrRoom}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            insp.severity === 'CRITICAL' || insp.severity === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}>
                            {insp.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Orders Category */}
                {matchingWorkOrders.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 px-2">
                      Work Orders
                    </span>
                    <div className="mt-1 space-y-1">
                      {matchingWorkOrders.map((wo) => (
                        <div
                          key={wo.id}
                          onClick={() => {
                            onSelectWorkOrder && onSelectWorkOrder(wo);
                            setShowSearchDropdown(false);
                          }}
                          className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                              <Wrench className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-purple-300">
                                {wo.title}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {wo.id} • {wo.propertyName}
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                            {wo.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">
                No matching properties or work orders found for "{query}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions: Quick Inspect, Notifications, Auth Session, Date/Time */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick New Inspection button */}
        <button
          onClick={onStartInspection}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Inspection</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 relative transition-all cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {realNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#0a0f1d]">
                {realNotifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#101728] border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-1">
                <span className="text-xs font-bold text-white">Active Alerts & Tasks</span>
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 font-medium">
                  {realNotifications.length} {realNotifications.length === 1 ? 'alert' : 'alerts'}
                </span>
              </div>
              <div className="space-y-2 mt-2 max-h-72 overflow-y-auto">
                {realNotifications.length > 0 ? (
                  realNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.item && onSelectInspection) {
                          onSelectInspection(n.item);
                          setShowNotifications(false);
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-all text-left flex gap-2.5 items-start cursor-pointer"
                    >
                      <div className="mt-0.5">
                        {n.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                        {n.type === 'info' && <FileText className="w-4 h-4 text-blue-400 shrink-0" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="text-xs font-semibold text-slate-200 truncate">{n.title}</div>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug mt-0.5 truncate">{n.desc}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 px-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-300">All Systems Nominal</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">No critical defect alerts or overdue work orders.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Authenticated Role / Sign In Pill */}
        {user ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium transition-all cursor-pointer"
              title={`Signed in as ${user.email} (Click to view account)`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-semibold hidden sm:inline">Property Manager</span>
            </button>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 text-slate-300 hover:text-red-300 text-xs font-semibold transition-all cursor-pointer"
                title="Sign Out to Public Landing Page"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden md:inline">Sign Out</span>
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Sign In</span>
          </button>
        )}

        {/* Date and Dynamic Clock */}
        <div className="hidden lg:flex items-center text-xs font-medium text-slate-300/90 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-800">
          <span>{currentTime || 'Mon, 3 Nov 2026 | 10:24 AM'}</span>
        </div>
      </div>
    </header>
  );
};
