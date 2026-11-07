import React from 'react';
import {
  LayoutDashboard,
  ScanEye,
  FileSearch,
  ShieldAlert,
  Calculator,
  CalendarCheck2,
  Wrench,
  FileText,
  Settings,
  Sparkles,
  Building2,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  openNewInspection: () => void;
  inspectorName?: string;
  inspectorRole?: string;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  openNewInspection,
  inspectorName = 'Suresh Chandragiri',
  inspectorRole = 'Property Manager',
  onOpenAuthModal,
  onSignOut
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inspect', label: 'Inspect Property', icon: ScanEye, highlight: true },
    { id: 'investigations', label: 'Investigations', icon: FileSearch },
    { id: 'risk', label: 'Risk Intelligence', icon: ShieldAlert },
    { id: 'repair', label: 'Repair Intelligence', icon: Calculator },
    { id: 'planner', label: 'Maintenance Planner', icon: CalendarCheck2 },
    { id: 'workorders', label: 'Work Orders', icon: Wrench },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-300">
      {/* Top Branding */}
      <div>
        <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white">ApexProp</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
              Inspect • Analyze • Maintain
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 space-y-4">
        {/* Enterprise Standards Card */}
        <div className="relative rounded-xl overflow-hidden border border-blue-500/20 bg-gradient-to-b from-[#131f38] to-[#0d1527] p-4 text-center shadow-lg group">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="w-8 h-8 mx-auto rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-100">ApexProp Enterprise</h4>
          <p className="text-xs text-blue-300/80 mb-3">NBC 2016 & IS 456 Standards</p>
          <button
            onClick={() => onSelectTab('settings')}
            className="w-full py-1.5 px-3 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/30 text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Operations Profile</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </button>
        </div>

        {/* User Profile & Sign Out Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex-1 min-w-0 flex items-center justify-between hover:bg-slate-800/40 p-1.5 rounded-xl transition-all cursor-pointer text-left"
            title="Account & Session Clearance"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-blue-500/30 shadow-md shrink-0">
                {inspectorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'PM'}
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate max-w-[95px]">
                  {inspectorName}
                </div>
                <div className="text-[10px] text-blue-400 font-medium truncate max-w-[95px]">
                  {inspectorRole}
                </div>
              </div>
            </div>
          </button>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer shrink-0"
              title="Sign Out to Public Landing Page"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
