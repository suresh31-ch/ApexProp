import React, { useState, useEffect } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  Plus,
  ShieldCheck,
  Edit3,
  Check,
  Users,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Download,
  AlertCircle
} from 'lucide-react';
import { WorkOrder, WorkOrderStatus, Contractor, VerificationChecklistRecord } from '../types';
import {
  fetchContractors,
  createContractor,
  updateContractor,
  transitionWorkOrderStatus,
  assignContractorToWorkOrder,
  acknowledgeWorkOrderAssignment,
  updateWorkOrderProgress,
  pauseWorkOrder,
  resumeWorkOrder,
  addWorkOrderPhoto,
  logWorkOrderMaterial,
  logWorkOrderLabour,
  createWorkOrderChangeRequest,
  reviewWorkOrderChangeRequest,
  verifyWorkOrderQuality,
  closeWorkOrderSafely
} from '../services/api';
import { ContractorDirectoryModal } from '../components/ContractorDirectoryModal';
import { WorkOrderDetailModal } from '../components/WorkOrderDetailModal';
import { generateWorkOrderPDF } from '../utils/pdfGenerator';

interface WorkOrdersViewProps {
  workOrders: WorkOrder[];
  onUpdateWorkOrder: (id: string, updates: Partial<WorkOrder>) => Promise<void>;
  onCreateNewWorkOrder: () => void;
  onRefreshData?: () => Promise<void>;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  workOrders,
  onUpdateWorkOrder,
  onCreateNewWorkOrder,
  onRefreshData
}) => {
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [showContractorsModal, setShowContractorsModal] = useState<boolean>(false);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loadingContractors, setLoadingContractors] = useState<boolean>(false);

  // Load contractors
  const loadContractors = async () => {
    setLoadingContractors(true);
    try {
      const data = await fetchContractors();
      setContractors(data);
    } catch (err) {
      console.error('[WorkOrdersView] Failed to load contractors:', err);
    } finally {
      setLoadingContractors(false);
    }
  };

  useEffect(() => {
    loadContractors();
  }, []);

  // Filter groups
  const filteredOrders = workOrders.filter((wo) => {
    // Search query
    const matchesSearch =
      wo.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wo.assignedTo && wo.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterGroup === 'ALL') return true;
    if (filterGroup === 'APPROVAL') return ['DRAFT', 'AWAITING_APPROVAL', 'APPROVED', 'PENDING_APPROVAL'].includes(wo.status);
    if (filterGroup === 'DISPATCH') return ['READY_FOR_ASSIGNMENT', 'ASSIGNED', 'ACKNOWLEDGED', 'SCHEDULED'].includes(wo.status);
    if (filterGroup === 'EXECUTION') return ['IN_PROGRESS', 'ON_HOLD', 'PENDING_INSPECTION'].includes(wo.status);
    if (filterGroup === 'VERIFICATION') return ['COMPLETED', 'VERIFIED', 'CLOSED'].includes(wo.status);
    if (filterGroup === 'REJECTED') return ['REJECTED', 'CANCELLED'].includes(wo.status);
    return true;
  });

  // Calculate high-level KPIs
  const totalApprovedBudget = workOrders.reduce((sum, wo) => sum + (wo.approvedBudgetINR || (wo.estimatedCostINR ? Number(wo.estimatedCostINR.replace(/[^0-9.]/g, '')) || 25000 : 25000)), 0);
  const totalActualCost = workOrders.reduce((sum, wo) => sum + (wo.actualCostINR || 0), 0);
  const activeExecutionCount = workOrders.filter((wo) => ['IN_PROGRESS', 'SCHEDULED', 'ASSIGNED', 'ON_HOLD'].includes(wo.status)).length;
  const awaitingVerificationCount = workOrders.filter((wo) => wo.status === 'COMPLETED').length;
  const verifiedClosedCount = workOrders.filter((wo) => ['VERIFIED', 'CLOSED'].includes(wo.status)).length;

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'AWAITING_APPROVAL':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'APPROVED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'READY_FOR_ASSIGNMENT':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'ASSIGNED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'ACKNOWLEDGED':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'SCHEDULED':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'IN_PROGRESS':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'ON_HOLD':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'COMPLETED':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'VERIFIED':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'CLOSED':
        return 'bg-slate-400/20 text-slate-300 border-slate-400/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Handlers for modal interactions
  const handleTransitionStatus = async (
    id: string,
    targetStatus: WorkOrderStatus,
    userName?: string,
    notes?: string,
    extra?: any
  ) => {
    const updated = await transitionWorkOrderStatus(id, targetStatus, userName, notes, extra);
    setSelectedOrder(updated);
    if (onRefreshData) await onRefreshData();
  };

  const handleAssignContractor = async (
    id: string,
    contractorId: string,
    scheduledDate?: string,
    dueDate?: string,
    assignerName?: string
  ) => {
    const res = await assignContractorToWorkOrder(id, contractorId, scheduledDate, dueDate, assignerName);
    setSelectedOrder(res.workOrder);
    if (onRefreshData) await onRefreshData();
  };

  const handleAcknowledge = async (id: string, contractorName: string, notes?: string) => {
    const res = await acknowledgeWorkOrderAssignment(id, contractorName, notes);
    setSelectedOrder(res.workOrder);
    if (onRefreshData) await onRefreshData();
  };

  const handleUpdateProgress = async (id: string, progress: number, notes?: string) => {
    const updated = await updateWorkOrderProgress(id, progress, notes);
    setSelectedOrder(updated);
    if (onRefreshData) await onRefreshData();
  };

  const handlePauseWork = async (id: string, delayReason: string) => {
    const updated = await pauseWorkOrder(id, delayReason);
    setSelectedOrder(updated);
    if (onRefreshData) await onRefreshData();
  };

  const handleResumeWork = async (id: string) => {
    const updated = await resumeWorkOrder(id);
    setSelectedOrder(updated);
    if (onRefreshData) await onRefreshData();
  };

  const handleAddPhoto = async (id: string, photo: any) => {
    await addWorkOrderPhoto(id, photo);
    if (onRefreshData) await onRefreshData();
  };

  const handleLogMaterial = async (id: string, mat: any) => {
    await logWorkOrderMaterial(id, mat);
    if (onRefreshData) await onRefreshData();
  };

  const handleLogLabour = async (id: string, lab: any) => {
    await logWorkOrderLabour(id, lab);
    if (onRefreshData) await onRefreshData();
  };

  const handleCreateChangeRequest = async (id: string, cr: any) => {
    await createWorkOrderChangeRequest(id, cr);
    if (onRefreshData) await onRefreshData();
  };

  const handleReviewChangeRequest = async (id: string, crId: string, action: 'APPROVED' | 'REJECTED', reviewNotes: string) => {
    const res = await reviewWorkOrderChangeRequest(id, crId, action, reviewNotes);
    setSelectedOrder(res.workOrder);
    if (onRefreshData) await onRefreshData();
  };

  const handleVerify = async (id: string, verifierName: string, notes: string, checklist: VerificationChecklistRecord[]) => {
    const updated = await verifyWorkOrderQuality(id, verifierName, notes, checklist);
    setSelectedOrder(updated);
    if (onRefreshData) await onRefreshData();
  };

  const handleClose = async (id: string, closerName: string, notes: string) => {
    const updated = await closeWorkOrderSafely(id, closerName, notes);
    setSelectedOrder(updated);
    if (onRefreshData) await onRefreshData();
  };

  const handleAddContractor = async (data: Partial<Contractor>) => {
    const newContractor = await createContractor(data);
    setContractors((prev) => [...prev, newContractor]);
  };

  const handleUpdateContractorItem = async (id: string, updates: Partial<Contractor>) => {
    const updated = await updateContractor(id, updates);
    setContractors((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
              <Wrench className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Work Order Management & Lifecycle
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            End-to-end operational execution: 15-state lifecycle, contractor directory, material logs, change orders & certified quality verification.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setShowContractorsModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Contractors ({contractors.length})</span>
          </button>

          <button
            onClick={onCreateNewWorkOrder}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Work Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Total Orders</div>
          <div className="text-xl font-black text-white font-mono mt-1">{workOrders.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across all properties</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Active Execution</div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">{activeExecutionCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">In Progress / Dispatched</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Awaiting Verification</div>
          <div className="text-xl font-black text-amber-400 font-mono mt-1">{awaitingVerificationCount}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5 font-semibold">Contractor 100% complete</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Verified & Closed</div>
          <div className="text-xl font-black text-teal-400 font-mono mt-1">{verifiedClosedCount}</div>
          <div className="text-[10px] text-teal-500/80 mt-0.5 font-semibold">QC sign-off completed</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-slate-800 col-span-2 sm:col-span-1">
          <div className="text-[11px] text-slate-400 font-medium">Authorized Budget</div>
          <div className="text-xl font-black text-white font-mono mt-1">₹{totalApprovedBudget.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-amber-400 mt-0.5">Actual: ₹{totalActualCost.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Search and Lifecycle Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d162d] p-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: `All (${workOrders.length})` },
            { id: 'APPROVAL', label: '1. Approval Pipeline' },
            { id: 'DISPATCH', label: '2. Dispatch & Schedule' },
            { id: 'EXECUTION', label: `3. Active Execution (${activeExecutionCount})` },
            { id: 'VERIFICATION', label: `4. Verification & Closed (${verifiedClosedCount + awaitingVerificationCount})` },
            { id: 'REJECTED', label: 'Rejected / Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterGroup(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterGroup === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search work orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#080d1c] text-slate-200 placeholder:text-slate-500 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-700/80 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Work Orders List */}
      <div className="space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((wo) => (
            <div
              key={wo.id}
              onClick={() => setSelectedOrder(wo)}
              className="p-4 sm:p-5 rounded-2xl bg-[#0d162d]/90 border border-slate-800 hover:border-slate-700 hover:bg-[#101b38] transition-all cursor-pointer shadow-lg group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black text-blue-400">
                    {wo.workOrderNumber || wo.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(wo.status)}`}>
                    {wo.status.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {wo.priority}
                  </span>
                  <span className="text-[11px] text-indigo-400 font-medium">
                    {wo.trade}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                  {wo.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  <span>Asset: <strong className="text-slate-300">{wo.propertyName}</strong> ({wo.location})</span>
                  <span>Contractor: <strong className="text-slate-300">{wo.assignedTo || 'Unassigned'}</strong></span>
                  {wo.scheduledDate && <span>Scheduled: <strong className="text-slate-300">{wo.scheduledDate}</strong></span>}
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-md bg-slate-900 h-1.5 rounded-full overflow-hidden flex items-center">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${wo.progressPercent || 0}%` }}
                  />
                </div>
              </div>

              {/* Financials & Quick Action */}
              <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Approved Budget</div>
                  <div className="text-sm font-bold text-white font-mono">
                    ₹{wo.approvedBudgetINR ? wo.approvedBudgetINR.toLocaleString('en-IN') : (wo.estimatedCostINR || '₹25,000')}
                  </div>
                  <div className="text-[10px] text-amber-400 font-medium">
                    Actual: ₹{wo.actualCostINR ? wo.actualCostINR.toLocaleString('en-IN') : '0'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateWorkOrderPDF(wo);
                    }}
                    title="Export Work Order PDF"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(wo);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-bold border border-blue-500/30 flex items-center gap-1 transition-all"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center rounded-2xl bg-[#0d162d]/50 border border-slate-800/80 space-y-3">
            <Wrench className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">No work orders match the selected filter</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Change your status filter or search term, or generate a new work order from an approved inspection finding.
            </p>
          </div>
        )}
      </div>

      {/* Contractor Directory Modal */}
      <ContractorDirectoryModal
        contractors={contractors}
        isOpen={showContractorsModal}
        onClose={() => setShowContractorsModal(false)}
        onAddContractor={handleAddContractor}
        onUpdateContractor={handleUpdateContractorItem}
      />

      {/* Work Order Detail Modal */}
      {selectedOrder && (
        <WorkOrderDetailModal
          workOrder={selectedOrder}
          contractors={contractors}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onTransitionStatus={handleTransitionStatus}
          onAssignContractor={handleAssignContractor}
          onAcknowledgeAssignment={handleAcknowledge}
          onUpdateProgress={handleUpdateProgress}
          onPauseWork={handlePauseWork}
          onResumeWork={handleResumeWork}
          onAddPhoto={handleAddPhoto}
          onLogMaterial={handleLogMaterial}
          onLogLabour={handleLogLabour}
          onCreateChangeRequest={handleCreateChangeRequest}
          onReviewChangeRequest={handleReviewChangeRequest}
          onVerifyWorkOrder={handleVerify}
          onCloseWorkOrder={handleClose}
        />
      )}
    </div>
  );
};
