/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { useApexPropData } from './hooks/useApexPropData';
import { useAppRouter } from './hooks/useAppRouter';
import { LandingPageView } from './views/LandingPageView';
import { AuthPageView } from './views/AuthPageView';
import {
  DashboardPage,
  InspectPage,
  InvestigationsPage,
  RiskIntelligencePage,
  MaintenancePlannerPage,
  WorkOrdersPage,
  ReportsPage,
  SettingsPage
} from './pages';
import { CreateWorkOrderModal } from './components/CreateWorkOrderModal';
import { PipelineStageViewer } from './components/PipelineStageViewer';
import { AuthModal } from './components/AuthModal';
import { InspectionRecord, WorkOrder, ActivityItem } from './types';
import { AlertCircle, RefreshCw, Building2, Loader2 } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { currentRoute, navigate } = useAppRouter();
  const { user, profile, isLoading: isAuthLoading, signOut } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Active Modals
  const [activeInspectionForViewer, setActiveInspectionForViewer] = useState<InspectionRecord | null>(null);
  const [workOrderModalOpen, setWorkOrderModalOpen] = useState(false);
  const [workOrderInitialInspection, setWorkOrderInitialInspection] = useState<InspectionRecord | null>(null);

  const {
    metrics,
    inspections,
    setInspections,
    workOrders,
    activities,
    settings,
    isLoading: isDataLoading,
    loadError,
    reloadData,
    handleApproveInspection,
    handleCreateWorkOrder,
    handleUpdateWorkOrder,
    handleSaveSettings
  } = useApexPropData();

  // If authenticated user is on landing, login, or signup route, redirect to dashboard
  useEffect(() => {
    if (user && !isAuthLoading) {
      if (currentRoute.page === 'login' || currentRoute.page === 'signup') {
        const target = currentRoute.redirect && currentRoute.redirect.startsWith('/dashboard')
          ? currentRoute.redirect
          : '/dashboard';
        navigate(target, { replace: true });
      } else if (currentRoute.page === 'landing') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isAuthLoading, currentRoute, navigate]);

  // Handle active tab in dashboard
  const currentTab = currentRoute.page === 'dashboard' ? currentRoute.tab : 'dashboard';

  const handleSelectTab = (tab: string) => {
    navigate(`/dashboard/${tab}`);
    setSearchQuery('');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Inspection flow completion
  const handleInspectionCompleted = (newRecord: InspectionRecord) => {
    setInspections((prev) => [newRecord, ...prev]);
    setActiveInspectionForViewer(newRecord);
    reloadData();
  };

  const handleCreateWorkOrderFromInspection = (insp: InspectionRecord) => {
    setWorkOrderInitialInspection(insp);
    setWorkOrderModalOpen(true);
  };

  const handleSelectActivity = (item: ActivityItem) => {
    const matched = inspections.find((i) => i.id === item.refId);
    if (matched) {
      setActiveInspectionForViewer(matched);
    } else {
      const matchedWo = workOrders.find((w) => w.id === item.refId);
      if (matchedWo) {
        handleSelectTab('workorders');
      }
    }
  };

  // 1. Zero Flash Security Clearance Splash Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-screen bg-[#070b14] flex flex-col items-center justify-center p-6 text-slate-100 select-none">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-20 h-20 rounded-full bg-blue-500/20 animate-ping opacity-60" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-2xl shadow-blue-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-[#0b1222] rounded-[14px] flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl font-bold tracking-tight text-white">ApexProp</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/40 text-blue-400 font-mono">AI</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tracking-wider mt-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
          <span>VERIFYING ENTERPRISE SESSION & SECURITY CLEARANCE...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Experience: Public Landing Page & Dedicated Auth Page
  if (!user) {
    if (currentRoute.page === 'login') {
      return (
        <AuthPageView
          initialMode="signin"
          redirectPath={currentRoute.redirect || '/dashboard'}
          onNavigate={navigate}
        />
      );
    }

    if (currentRoute.page === 'signup') {
      return (
        <AuthPageView
          initialMode="signup"
          redirectPath={currentRoute.redirect || '/dashboard'}
          onNavigate={navigate}
        />
      );
    }

    // Protected Route Intercept: User attempted to access /dashboard or subroute while unauthenticated
    if (currentRoute.page === 'dashboard') {
      const redirectTarget = window.location.pathname + window.location.search;
      return (
        <AuthPageView
          initialMode="signin"
          redirectPath={redirectTarget}
          onNavigate={navigate}
        />
      );
    }

    // Default Public Experience: Modern High-Impact Landing Page
    return <LandingPageView onNavigate={navigate} />;
  }

  // 3. Authenticated Experience: Enterprise Inspection & Risk Intelligence Suite
  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onStartInspection={() => handleSelectTab('inspect')}
      inspectorName={profile?.fullName || settings?.inspectorName || 'Suresh Chandragiri'}
      inspectorRole={profile?.role || settings?.inspectorTitle || 'Property Manager'}
      inspections={inspections}
      workOrders={workOrders}
      onSelectInspection={(insp) => setActiveInspectionForViewer(insp)}
      onSelectWorkOrder={(wo) => handleSelectTab('workorders')}
      onOpenAuthModal={() => setAuthModalOpen(true)}
      onSignOut={handleSignOut}
    >
      {loadError && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            onClick={reloadData}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry Sync</span>
          </button>
        </div>
      )}

      {currentTab === 'dashboard' && (
        <DashboardPage
          metrics={metrics}
          activities={activities}
          userName={profile?.fullName?.split(' ')[0] || settings?.inspectorName?.split(' ')[0] || 'Property Manager'}
          onInspectionCompleted={handleInspectionCompleted}
          onSelectActivity={handleSelectActivity}
          onNavigateToTab={handleSelectTab}
        />
      )}

      {currentTab === 'inspect' && (
        <InspectPage
          onInspectionCreated={handleInspectionCompleted}
          onApproveInspection={handleApproveInspection}
          onCreateWorkOrder={handleCreateWorkOrderFromInspection}
          initialInspection={activeInspectionForViewer}
        />
      )}

      {currentTab === 'investigations' && (
        <InvestigationsPage
          inspections={inspections}
          onApproveInspection={handleApproveInspection}
          onCreateWorkOrder={handleCreateWorkOrderFromInspection}
          onNavigateToInspect={() => handleSelectTab('inspect')}
          onUpdateInspection={(updated) => setInspections(prev => prev.map(i => i.id === updated.id ? updated : i))}
        />
      )}

      {currentTab === 'risk' && (
        <RiskIntelligencePage
          inspections={inspections}
          onSelectInspection={(insp) => setActiveInspectionForViewer(insp)}
        />
      )}

      {currentTab === 'repair' && (
        <MaintenancePlannerPage
          inspections={inspections}
          onSelectInspection={(insp) => setActiveInspectionForViewer(insp)}
          onCreateWorkOrder={handleCreateWorkOrderFromInspection}
          initialTab="cost"
          mode="repair"
        />
      )}

      {currentTab === 'planner' && (
        <MaintenancePlannerPage
          inspections={inspections}
          onSelectInspection={(insp) => setActiveInspectionForViewer(insp)}
          onCreateWorkOrder={handleCreateWorkOrderFromInspection}
          initialTab="plan"
          mode="planner"
        />
      )}

      {currentTab === 'workorders' && (
        <WorkOrdersPage
          workOrders={workOrders}
          onUpdateWorkOrder={handleUpdateWorkOrder}
          onCreateNewWorkOrder={() => {
            setWorkOrderInitialInspection(null);
            setWorkOrderModalOpen(true);
          }}
          onRefreshData={reloadData}
        />
      )}

      {currentTab === 'reports' && (
        <ReportsPage
          inspections={inspections}
          workOrders={workOrders}
          onSelectInspection={(insp) => setActiveInspectionForViewer(insp)}
        />
      )}

      {currentTab === 'settings' && (
        <SettingsPage
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onOpenAuthModal={() => setAuthModalOpen(true)}
        />
      )}

      {/* Global Modal for Active Inspection Pipeline Stage Viewer */}
      {activeInspectionForViewer && currentTab !== 'inspect' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-8">
            <PipelineStageViewer
              inspection={activeInspectionForViewer}
              onApprove={async (notes) => {
                await handleApproveInspection(activeInspectionForViewer.id, notes);
                setActiveInspectionForViewer((prev) =>
                  prev ? { ...prev, approval: { status: 'APPROVED', approvalNotes: notes, approvedBy: settings?.inspectorName } } : null
                );
              }}
              onCreateWorkOrder={() => {
                handleCreateWorkOrderFromInspection(activeInspectionForViewer);
                setActiveInspectionForViewer(null);
              }}
              onClose={() => setActiveInspectionForViewer(null)}
            />
          </div>
        </div>
      )}

      {/* Global Modal for Work Order Creation */}
      {workOrderModalOpen && (
        <CreateWorkOrderModal
          inspection={workOrderInitialInspection}
          onClose={() => setWorkOrderModalOpen(false)}
          onSubmit={handleCreateWorkOrder}
        />
      )}

      {/* Global Modal for Supabase Authentication */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onOpenSettings={() => handleSelectTab('settings')}
      />
    </AppLayout>
  );
}
