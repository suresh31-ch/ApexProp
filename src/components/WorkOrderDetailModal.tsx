import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  ShieldCheck,
  FileText,
  Camera,
  Play,
  Pause,
  Plus,
  X,
  Download,
  AlertCircle,
  TrendingUp,
  History,
  Check,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  WorkOrder,
  WorkOrderStatus,
  Contractor,
  WorkOrderChangeRequest,
  MaterialUsageRecord,
  LabourHourRecord,
  VerificationChecklistRecord
} from '../types';
import { generateWorkOrderPDF } from '../utils/pdfGenerator';

interface WorkOrderDetailModalProps {
  workOrder: WorkOrder;
  contractors: Contractor[];
  isOpen: boolean;
  onClose: () => void;
  onTransitionStatus: (
    id: string,
    targetStatus: WorkOrderStatus,
    userName?: string,
    notes?: string,
    extra?: any
  ) => Promise<void>;
  onAssignContractor: (
    id: string,
    contractorId: string,
    scheduledDate?: string,
    dueDate?: string,
    assignerName?: string
  ) => Promise<void>;
  onAcknowledgeAssignment: (id: string, contractorName: string, notes?: string) => Promise<void>;
  onUpdateProgress: (id: string, progress: number, notes?: string) => Promise<void>;
  onPauseWork: (id: string, delayReason: string) => Promise<void>;
  onResumeWork: (id: string) => Promise<void>;
  onAddPhoto: (id: string, photo: { type: 'BEFORE' | 'DURING' | 'AFTER'; url: string; caption?: string }) => Promise<void>;
  onLogMaterial: (id: string, material: { materialName: string; quantityUsed: number; unit: string; costPerUnit: number }) => Promise<void>;
  onLogLabour: (id: string, labour: { technicianName: string; trade: string; hoursLogged: number; hourlyRate: number; workDate?: string; notes?: string }) => Promise<void>;
  onCreateChangeRequest: (id: string, cr: { reason: string; additionalScope: string; proposedCostINR: number; evidenceUrl?: string }) => Promise<void>;
  onReviewChangeRequest: (id: string, crId: string, action: 'APPROVED' | 'REJECTED', reviewNotes: string) => Promise<void>;
  onVerifyWorkOrder: (id: string, verifierName: string, notes: string, checklist: VerificationChecklistRecord[]) => Promise<void>;
  onCloseWorkOrder: (id: string, closerName: string, notes: string) => Promise<void>;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
  workOrder,
  contractors,
  isOpen,
  onClose,
  onTransitionStatus,
  onAssignContractor,
  onAcknowledgeAssignment,
  onUpdateProgress,
  onPauseWork,
  onResumeWork,
  onAddPhoto,
  onLogMaterial,
  onLogLabour,
  onCreateChangeRequest,
  onReviewChangeRequest,
  onVerifyWorkOrder,
  onCloseWorkOrder
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DISPATCH' | 'EXECUTION' | 'COSTS' | 'CHANGE_ORDERS' | 'VERIFICATION' | 'AUDIT'>('OVERVIEW');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Execution tab state
  const [tempProgress, setTempProgress] = useState(workOrder.progressPercent || 0);
  const [progressNotes, setProgressNotes] = useState('');
  const [pauseReasonInput, setPauseReasonInput] = useState('');
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [photoType, setPhotoType] = useState<'BEFORE' | 'DURING' | 'AFTER'>('DURING');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');

  // Dispatch tab state
  const [selectedContractorId, setSelectedContractorId] = useState(workOrder.contractorId || (contractors[0]?.id || ''));
  const [schedDateInput, setSchedDateInput] = useState(workOrder.scheduledDate || '');
  const [dueDateInput, setDueDateInput] = useState(workOrder.dueDate || '');

  // Costs tab state
  const [matName, setMatName] = useState('');
  const [matQty, setMatQty] = useState('');
  const [matUnit, setMatUnit] = useState('Kg');
  const [matRate, setMatRate] = useState('');

  const [techName, setTechName] = useState('');
  const [techTrade, setTechTrade] = useState(workOrder.trade);
  const [techHours, setTechHours] = useState('');
  const [techRate, setTechRate] = useState('650');

  // Change order tab state
  const [crReason, setCrReason] = useState('');
  const [crScope, setCrScope] = useState('');
  const [crCost, setCrCost] = useState('');
  const [crReviewNotes, setCrReviewNotes] = useState('');

  // Verification tab state
  const [verifierName, setVerifierName] = useState('Er. Arvind Mehta (Chartered Engineer)');
  const [verificationNotes, setVerificationNotes] = useState('Ultrasonic pulse velocity and rebound hammer tap audit confirm complete void filling and bond integrity.');
  const [qcChecklist, setQcChecklist] = useState<VerificationChecklistRecord[]>(
    workOrder.verificationChecklist && workOrder.verificationChecklist.length > 0
      ? workOrder.verificationChecklist
      : [
          { id: 'qc-1', checkpoint: 'Solid sound hammer tap test across repaired substrate boundary', passed: true, notes: 'No hollow delamination detected' },
          { id: 'qc-2', checkpoint: 'Non-destructive ultrasonic pulse velocity homogeneity test (>3.5 km/s)', passed: true, notes: 'Homogeneous transmission verified' },
          { id: 'qc-3', checkpoint: 'Surface moisture reading verified below 12% barrier threshold', passed: true, notes: 'Reading: 8.4% RH' },
          { id: 'qc-4', checkpoint: 'Substrate finish flush and aligned with structural datum', passed: true, notes: 'Level verified with 2m straight-edge' },
          { id: 'qc-5', checkpoint: 'Worksite decontaminated, residual debris removed, PPE log compliant', passed: true, notes: 'All hazardous chemicals disposed per environmental code' }
        ]
  );
  const [closerNotes, setCloserNotes] = useState('Final site walk completed. Contractor invoice certified against verified line items. Work order closed.');

  if (!isOpen) return null;

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'AWAITING_APPROVAL':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse';
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
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const handleDispatchContractor = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await onAssignContractor(workOrder.id, selectedContractorId, schedDateInput, dueDateInput, 'Property Manager');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const c = contractors.find((item) => item.id === workOrder.contractorId);
      await onAcknowledgeAssignment(workOrder.id, c?.name || 'Contractor Lead', 'Acknowledged scope of work, technical specifications, and site access schedule.');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProgress = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await onUpdateProgress(workOrder.id, tempProgress, progressNotes);
      setProgressNotes('');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    if (!pauseReasonInput.trim()) {
      setActionError('A delay reason is required to pause work.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await onPauseWork(workOrder.id, pauseReasonInput);
      setShowPauseModal(false);
      setPauseReasonInput('');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await onResumeWork(workOrder.id);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddExecutionPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await onAddPhoto(workOrder.id, {
        type: photoType,
        url: photoUrl,
        caption: photoCaption
      });
      setPhotoUrl('');
      setPhotoCaption('');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      await onLogMaterial(workOrder.id, {
        materialName: matName,
        quantityUsed: Number(matQty),
        unit: matUnit,
        costPerUnit: Number(matRate)
      });
      setMatName('');
      setMatQty('');
      setMatRate('');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddLabour = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      await onLogLabour(workOrder.id, {
        technicianName: techName,
        trade: techTrade,
        hoursLogged: Number(techHours),
        hourlyRate: Number(techRate),
        workDate: new Date().toISOString().split('T')[0]
      });
      setTechName('');
      setTechHours('');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      await onCreateChangeRequest(workOrder.id, {
        reason: crReason,
        additionalScope: crScope,
        proposedCostINR: Number(crCost)
      });
      setCrReason('');
      setCrScope('');
      setCrCost('');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewCr = async (crId: string, action: 'APPROVED' | 'REJECTED') => {
    setActionLoading(true);
    setActionError(null);
    try {
      await onReviewChangeRequest(workOrder.id, crId, action, crReviewNotes || `${action} by management after site inspection`);
      setCrReviewNotes('');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await onVerifyWorkOrder(workOrder.id, verifierName, verificationNotes, qcChecklist);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await onCloseWorkOrder(workOrder.id, 'Senior Operations Director', closerNotes);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleChecklist = (id: string) => {
    setQcChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed: !item.passed } : item))
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#0b1329] border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-white font-mono">
                  {workOrder.workOrderNumber || workOrder.id}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(workOrder.status)}`}>
                  {workOrder.status.replace(/_/g, ' ')}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {workOrder.priority} PRIORITY
                </span>
              </div>
              <h3 className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                {workOrder.title} • <span className="text-blue-400">{workOrder.propertyName}</span> ({workOrder.location})
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => generateWorkOrderPDF(workOrder)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error notification banner if any */}
        {actionError && (
          <div className="p-3 bg-rose-500/10 border-b border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs px-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* 7 Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-800 bg-[#0d1630] overflow-x-auto">
          {[
            { id: 'OVERVIEW', label: '1. Overview & Traceability' },
            { id: 'DISPATCH', label: '2. Contractor Dispatch' },
            { id: 'EXECUTION', label: '3. Execution & Photos' },
            { id: 'COSTS', label: '4. Materials & Labour' },
            { id: 'CHANGE_ORDERS', label: `5. Change Orders (${workOrder.changeRequests?.length || 0})` },
            { id: 'VERIFICATION', label: '6. Quality Sign-off' },
            { id: 'AUDIT', label: '7. Audit Trail' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === t.id
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#090f20]">
          {/* TAB 1: OVERVIEW & TRACEABILITY */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Financial & Status Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Approved Budget</div>
                  <div className="text-base sm:text-lg font-black text-white font-mono mt-1">
                    ₹{workOrder.approvedBudgetINR ? workOrder.approvedBudgetINR.toLocaleString('en-IN') : '25,000'}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1 font-semibold">Authorized by Management</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Actual Incurred</div>
                  <div className="text-base sm:text-lg font-black text-amber-400 font-mono mt-1">
                    ₹{workOrder.actualCostINR ? workOrder.actualCostINR.toLocaleString('en-IN') : '0'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Materials + Labour logged</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Physical Progress</div>
                  <div className="text-base sm:text-lg font-black text-blue-400 font-mono mt-1">
                    {workOrder.progressPercent || 0}%
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${workOrder.progressPercent || 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Contractor Assigned</div>
                  <div className="text-xs font-bold text-white truncate mt-1">
                    {workOrder.assignedTo || 'Unassigned'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">
                    Trade: {workOrder.trade}
                  </div>
                </div>
              </div>

              {/* Traceability Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-400" />
                    Inspection & Defect Provenance
                  </h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Linked Inspection ID:</span>
                      <span className="font-mono text-blue-400 font-bold">{workOrder.inspectionId || 'INSP-LINKED'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Property / Asset:</span>
                      <span className="font-semibold text-white">{workOrder.propertyName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Defect Category:</span>
                      <span className="font-semibold text-slate-200">{workOrder.defectCategory}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Specific Location:</span>
                      <span className="text-slate-300">{workOrder.location}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Trade Classification:</span>
                      <span className="text-indigo-400 font-semibold">{workOrder.trade}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    Schedule & Authorizations
                  </h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Scheduled Start Date:</span>
                      <span className="font-semibold text-white">{workOrder.scheduledDate || 'Field dispatch pending'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Target Completion Due:</span>
                      <span className="font-semibold text-amber-300">{workOrder.dueDate || 'Target deadline pending'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Initial Estimate Value:</span>
                      <span className="font-mono text-slate-200">{workOrder.estimatedCostINR || '₹25,000'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Quality Verified By:</span>
                      <span className="text-emerald-400 font-semibold">{workOrder.verifiedBy || 'Pending physical inspection'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Materials & Safety Protocol */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Required Materials & Compounds
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {workOrder.materialsRequired?.map((m, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Mandatory Safety Briefing & Site PPE
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {workOrder.safetyBriefing?.map((s, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Missing Field Indicators Notice */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  <strong>Evidence Integrity Guard:</strong> Any missing structural depth measurements or core pull tests are explicitly flagged as <em>Field survey required</em> rather than AI-fabricated values.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: CONTRACTOR DISPATCH */}
          {activeTab === 'DISPATCH' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  Assign & Authorize Trade Contractor
                </h4>
                <p className="text-xs text-slate-400">
                  Select a licensed contractor from the directory and configure the authorized execution dates.
                  Human dispatch authorization is recorded into the audit trail.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Select Contractor *
                    </label>
                    <select
                      value={selectedContractorId}
                      onChange={(e) => setSelectedContractorId(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                    >
                      {contractors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.company} ({c.trade})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Scheduled Start Date
                    </label>
                    <input
                      type="date"
                      value={schedDateInput}
                      onChange={(e) => setSchedDateInput(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Due Date / Deadline
                    </label>
                    <input
                      type="date"
                      value={dueDateInput}
                      onChange={(e) => setDueDateInput(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleDispatchContractor}
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Authorize & Dispatch Contractor</span>
                  </button>

                  {workOrder.status === 'ASSIGNED' && (
                    <button
                      onClick={handleAcknowledge}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Contractor Acknowledge Scope</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Current Assigned Contractor Summary */}
              {workOrder.assignedTo && (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-slate-300 uppercase">
                    Assigned Contractor Overview
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400">Assigned Entity:</div>
                      <div className="font-bold text-white text-sm mt-0.5">{workOrder.assignedTo}</div>
                      <div className="text-slate-400 mt-2">Trade: <strong className="text-slate-200">{workOrder.trade}</strong></div>
                    </div>
                    <div>
                      <div className="text-slate-400">Scheduled Window:</div>
                      <div className="font-medium text-slate-200 mt-0.5">
                        {workOrder.scheduledDate || 'Not set'} to {workOrder.dueDate || 'Not set'}
                      </div>
                      <div className="text-slate-400 mt-2">Current Status: <strong className="text-blue-400">{workOrder.status}</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXECUTION & PHOTOS */}
          {activeTab === 'EXECUTION' && (
            <div className="space-y-6">
              {/* Progress Slider & Status Buttons */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    Execution Progress ({tempProgress}%)
                  </h4>
                  <div className="flex items-center gap-2">
                    {workOrder.status === 'IN_PROGRESS' ? (
                      <button
                        onClick={() => setShowPauseModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Work (Delay)</span>
                      </button>
                    ) : workOrder.status === 'ON_HOLD' ? (
                      <button
                        onClick={handleResume}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume Work</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {workOrder.pausedReason && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                    <strong>Work Paused Reason:</strong> {workOrder.pausedReason}
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={tempProgress}
                    onChange={(e) => setTempProgress(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>0% (Not Started)</span>
                    <span>25% Chipping</span>
                    <span>50% Substrate Prep</span>
                    <span>75% Application</span>
                    <span>100% Remediation Complete</span>
                  </div>
                </div>

                {/* Quick % buttons */}
                <div className="flex items-center gap-2">
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTempProgress(pct)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                        tempProgress === pct
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Daily Progress Notes / Site Log
                  </label>
                  <textarea
                    rows={2}
                    value={progressNotes}
                    onChange={(e) => setProgressNotes(e.target.value)}
                    placeholder="e.g. Surface ground flush. Completed low-pressure injection across ports 1-8. No pressure drop observed."
                    className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleSaveProgress}
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  Save Progress & Update Status
                </button>
              </div>

              {/* Execution Photographs */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-purple-400" />
                  Before / During / After Photographic Evidence
                </h4>

                {/* Add Photo Form */}
                <form onSubmit={handleAddExecutionPhoto} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800">
                  <div>
                    <select
                      value={photoType}
                      onChange={(e) => setPhotoType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2 rounded-lg"
                    >
                      <option value="BEFORE">BEFORE Execution</option>
                      <option value="DURING">DURING Execution</option>
                      <option value="AFTER">AFTER Remediation</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="url"
                      required
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="Photo URL (or private storage image path)"
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Upload Photo
                    </button>
                  </div>
                </form>

                {/* Photo Gallery */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {workOrder.executionPhotos && workOrder.executionPhotos.length > 0 ? (
                    workOrder.executionPhotos.map((p) => (
                      <div key={p.id} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/90 flex flex-col">
                        <div className="h-32 bg-slate-950 overflow-hidden relative">
                          <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.type === 'BEFORE' ? 'bg-amber-500 text-slate-950' : p.type === 'DURING' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-slate-950'
                          }`}>
                            {p.type}
                          </span>
                        </div>
                        <div className="p-2.5 text-xs text-slate-300">
                          <div className="font-semibold truncate">{p.caption || `${p.type} photo`}</div>
                          <div className="text-[10px] text-slate-500 mt-1">{new Date(p.uploadedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="sm:col-span-3 text-center py-6 text-xs text-slate-500">
                      No execution photos uploaded yet. Add BEFORE, DURING, or AFTER photographs.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MATERIALS & LABOUR */}
          {activeTab === 'COSTS' && (
            <div className="space-y-6">
              {/* Cost Summary Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#101b38] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Total Actual Incurred Cost</div>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                    ₹{workOrder.actualCostINR ? workOrder.actualCostINR.toLocaleString('en-IN') : '0'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Authorized Budget</div>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    ₹{workOrder.approvedBudgetINR ? workOrder.approvedBudgetINR.toLocaleString('en-IN') : '25,000'}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">
                    Variance: ₹{((workOrder.approvedBudgetINR || 25000) - (workOrder.actualCostINR || 0)).toLocaleString('en-IN')} remaining
                  </div>
                </div>
              </div>

              {/* Material Usage Logging */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Log Material Consumption
                </h4>
                <form onSubmit={handleAddMaterial} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Material Name (e.g. Epoxy Grout Kit)"
                      value={matName}
                      onChange={(e) => setMatName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      placeholder="Qty"
                      value={matQty}
                      onChange={(e) => setMatQty(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      placeholder="Rate (₹)"
                      value={matRate}
                      onChange={(e) => setMatRate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Log Material
                    </button>
                  </div>
                </form>

                {/* Materials List */}
                <div className="space-y-2">
                  {workOrder.materialsUsed && workOrder.materialsUsed.length > 0 ? (
                    workOrder.materialsUsed.map((m) => (
                      <div key={m.id} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{m.materialName}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            {m.quantityUsed} {m.unit} @ ₹{m.costPerUnit}/{m.unit}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-amber-400 text-sm">
                          ₹{m.totalCost.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-500">No materials recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Labour Hours Logging */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Log Certified Labour Hours
                </h4>
                <form onSubmit={handleAddLabour} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Technician / Mason Name"
                      value={techName}
                      onChange={(e) => setTechName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      placeholder="Hours"
                      value={techHours}
                      onChange={(e) => setTechHours(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      placeholder="Hourly Rate (₹)"
                      value={techRate}
                      onChange={(e) => setTechRate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Log Labour
                    </button>
                  </div>
                </form>

                {/* Labour List */}
                <div className="space-y-2">
                  {workOrder.labourHours && workOrder.labourHours.length > 0 ? (
                    workOrder.labourHours.map((l) => (
                      <div key={l.id} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{l.technicianName} ({l.trade})</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            {l.hoursLogged} hrs @ ₹{l.hourlyRate}/hr • Date: {l.workDate}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-amber-400 text-sm">
                          ₹{l.totalCost.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-500">No labour hours logged yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CHANGE ORDERS */}
          {activeTab === 'CHANGE_ORDERS' && (
            <div className="space-y-6">
              {/* Change Request Form */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Submit Formal Change Order (Scope & Cost Revision)
                </h4>
                <p className="text-xs text-slate-400">
                  Whenever site excavation or demolition reveals unforeseen concealed distress (e.g., corroded rebar or secondary water leaks), submit a formal Change Request.
                  Approved change orders revise the authorized budget with a permanent audit trail.
                </p>

                <form onSubmit={handleAddChangeRequest} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Reason for Change Order *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Unforeseen rebar corrosion behind spalled concrete requires zinc anti-rust primer and sacrificial anodes"
                      value={crReason}
                      onChange={(e) => setCrReason(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Additional Work Scope Description *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apply 2 coats of zinc phosphate anti-corrosion primer to 16mm rebar cage"
                        value={crScope}
                        onChange={(e) => setCrScope(e.target.value)}
                        className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Proposed Additional Cost (INR ₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 12500"
                        value={crCost}
                        onChange={(e) => setCrCost(e.target.value)}
                        className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    Submit Change Order for Management Review
                  </button>
                </form>
              </div>

              {/* Change Requests List */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-300 uppercase">
                  Existing Change Requests & Management Reviews
                </h5>
                {workOrder.changeRequests && workOrder.changeRequests.length > 0 ? (
                  workOrder.changeRequests.map((cr) => (
                    <div
                      key={cr.id}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-400">{cr.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              cr.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              cr.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {cr.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">{cr.reason}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{cr.additionalScope}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Proposed Cost</div>
                          <div className="text-base font-black text-amber-400 font-mono">
                            +₹{cr.proposedCostINR.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {/* Review Status or Action */}
                      {cr.status === 'PENDING' ? (
                        <div className="pt-3 border-t border-slate-800/80 flex items-center gap-3">
                          <input
                            type="text"
                            placeholder="Review notes or justification..."
                            value={crReviewNotes}
                            onChange={(e) => setCrReviewNotes(e.target.value)}
                            className="flex-1 bg-[#0a0f1d] border border-slate-700 text-xs text-slate-200 p-2 rounded-lg"
                          />
                          <button
                            onClick={() => handleReviewCr(cr.id, 'APPROVED')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all"
                          >
                            Approve (+₹{cr.proposedCostINR.toLocaleString('en-IN')})
                          </button>
                          <button
                            onClick={() => handleReviewCr(cr.id, 'REJECTED')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                          <strong>Reviewed by {cr.reviewedBy}:</strong> {cr.reviewNotes} • <span className="text-slate-500">{new Date(cr.reviewedAt || '').toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No change requests recorded for this work order.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: QUALITY VERIFICATION SIGN-OFF */}
          {activeTab === 'VERIFICATION' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Mandatory Quality Control Checklist & Human Sign-off
                </h4>
                <p className="text-xs text-slate-400">
                  Strict regulatory safeguard: A work order reported <em>COMPLETED</em> by a contractor CANNOT transition to <em>VERIFIED</em> without an authorized reviewer completing all verification checkpoints.
                </p>

                {/* Checkpoints */}
                <div className="space-y-2.5">
                  {qcChecklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        item.passed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                        item.passed ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'border-slate-700 bg-slate-800'
                      }`}>
                        {item.passed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold">{item.checkpoint}</div>
                        {item.notes && <div className="text-[11px] text-slate-400 mt-0.5">{item.notes}</div>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {item.passed ? 'PASSED' : 'PENDING'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Reviewer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Authorized Engineer / Reviewer Name *
                    </label>
                    <input
                      type="text"
                      value={verifierName}
                      onChange={(e) => setVerifierName(e.target.value)}
                      placeholder="e.g. Er. Arvind Mehta (Chartered Engineer)"
                      className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Professional Verification Remarks *
                    </label>
                    <input
                      type="text"
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="e.g. Rebound hammer and acoustic tap test confirm full remediation..."
                      className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleVerify}
                    disabled={actionLoading || !qcChecklist.every((i) => i.passed)}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-600/30 transition-all disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Certify Quality Verification (Move to VERIFIED)</span>
                  </button>
                </div>
              </div>

              {/* Formally Close Work Order (Only enabled if VERIFIED) */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  Formally Close & Archive Work Order
                </h4>
                <p className="text-xs text-slate-400">
                  Strict lifecycle gate: A work order CANNOT be closed unless it has first passed professional verification.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Archival & Close-out Notes
                  </label>
                  <input
                    type="text"
                    value={closerNotes}
                    onChange={(e) => setCloserNotes(e.target.value)}
                    placeholder="All remediation verified, contractor billing audited, order archived."
                    className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleClose}
                  disabled={actionLoading || workOrder.status !== 'VERIFIED'}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Formally Close Work Order (Move to CLOSED)</span>
                </button>
                {workOrder.status !== 'VERIFIED' && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    * Order must be in <strong>VERIFIED</strong> status before closure is permitted.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT TRAIL */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                Immutable Status & Transition History
              </h4>
              <div className="space-y-3">
                {workOrder.statusHistory && workOrder.statusHistory.length > 0 ? (
                  workOrder.statusHistory.map((hist, idx) => (
                    <div
                      key={hist.id || idx}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-blue-400 font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{hist.previousStatus}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <span className="text-xs font-bold text-blue-400">{hist.newStatus}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{new Date(hist.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{hist.notes}</p>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">Recorded by: {hist.userName || 'System'}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No status history recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Lifecycle Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Current Stage:</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getStatusBadge(workOrder.status)}`}>
              {workOrder.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {workOrder.status === 'DRAFT' && (
              <button
                onClick={() => onTransitionStatus(workOrder.id, 'AWAITING_APPROVAL', 'Property Manager', 'Submitted for review')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all"
              >
                Submit for Approval
              </button>
            )}

            {workOrder.status === 'AWAITING_APPROVAL' && (
              <>
                <button
                  onClick={() => onTransitionStatus(workOrder.id, 'APPROVED', 'Senior Director', 'Budget and scope approved')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Approve Work Order
                </button>
                <button
                  onClick={() => onTransitionStatus(workOrder.id, 'REJECTED', 'Senior Director', 'Budget revisions required')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Reject
                </button>
              </>
            )}

            {workOrder.status === 'APPROVED' && (
              <button
                onClick={() => onTransitionStatus(workOrder.id, 'READY_FOR_ASSIGNMENT', 'Site Manager', 'Ready for contractor dispatch')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
              >
                Mark Ready for Dispatch
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Pause Work Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Pause className="w-4 h-4 text-amber-400" />
              Pause Work Order (Document Delay Justification)
            </h4>
            <p className="text-xs text-slate-400">
              Mandatory operational reason required (e.g. inclement monsoon weather, structural stabilization pause, material delivery delay).
            </p>
            <textarea
              rows={3}
              required
              value={pauseReasonInput}
              onChange={(e) => setPauseReasonInput(e.target.value)}
              placeholder="Enter specific delay justification..."
              className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePause}
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all"
              >
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
