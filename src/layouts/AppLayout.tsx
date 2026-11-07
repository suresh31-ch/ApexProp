import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';

import { InspectionRecord, WorkOrder } from '../types';

interface AppLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onStartInspection: () => void;
  inspectorName?: string;
  inspectorRole?: string;
  inspections?: InspectionRecord[];
  workOrders?: WorkOrder[];
  onSelectInspection?: (inspection: InspectionRecord) => void;
  onSelectWorkOrder?: (wo: WorkOrder) => void;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  onStartInspection,
  inspectorName,
  inspectorRole,
  inspections = [],
  workOrders = [],
  onSelectInspection,
  onSelectWorkOrder,
  onOpenAuthModal,
  onSignOut,
  children
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b101b] text-slate-100 antialiased font-sans select-none">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        openNewInspection={onStartInspection}
        inspectorName={inspectorName}
        inspectorRole={inspectorRole}
        onOpenAuthModal={onOpenAuthModal}
        onSignOut={onSignOut}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onStartInspection={onStartInspection}
          inspections={inspections}
          workOrders={workOrders}
          onSelectInspection={onSelectInspection}
          onSelectWorkOrder={onSelectWorkOrder}
          onOpenAuthModal={onOpenAuthModal}
          onSignOut={onSignOut}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 select-text">
          {children}
        </main>
      </div>
    </div>
  );
};
