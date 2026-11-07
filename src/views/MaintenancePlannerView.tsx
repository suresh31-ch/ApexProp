/**
 * ApexProp AI — Repair Intelligence & Cost Estimation Engine
 * Enterprise Maintenance Planner with evidence-grounded repair recommendations,
 * 3-way option comparison, deterministic itemized cost calculation workspace,
 * and auditable estimate versioning/approval workflow.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarCheck2,
  Wrench,
  Layers,
  Shield,
  HardHat,
  Clock,
  ArrowRight,
  PackageCheck,
  Calculator,
  AlertTriangle,
  AlertCircle,
  FileSearch,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  Eye,
  FileText,
  ChevronRight,
  Info,
  AlertOctagon,
  Scale,
  ShieldAlert,
  Sparkles,
  DollarSign,
  Send,
  FileCheck,
  History,
  Building,
  RefreshCw
} from 'lucide-react';
import {
  InspectionRecord,
  RepairPlan,
  RepairOption,
  RepairCostEstimate,
  RepairEstimateLineItem,
  RepairMeasurements,
  RepairRateCatalogItem,
  EstimateStatus,
  LineItemCategory,
  MeasurementUnit,
  MaintenancePlannerOverview
} from '../types';
import {
  fetchRateCatalog,
  fetchMaintenancePlannerOverview,
  fetchRepairPlan,
  saveRepairPlan,
  fetchRepairEstimates,
  calculateEstimatePreview,
  saveRepairEstimate,
  updateEstimateStatus,
  reviseRepairEstimate
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface MaintenancePlannerViewProps {
  inspections: InspectionRecord[];
  onSelectInspection: (inspection: InspectionRecord) => void;
  onCreateWorkOrder: (inspection: InspectionRecord) => void;
  initialTab?: 'plan' | 'options' | 'cost' | 'approval';
  mode?: 'planner' | 'repair';
}

export const MaintenancePlannerView: React.FC<MaintenancePlannerViewProps> = ({
  inspections,
  onSelectInspection,
  onCreateWorkOrder,
  initialTab,
  mode = 'planner'
}) => {
  const { user, profile } = useAuth();

  // Eligible defect inspections
  const eligibleInspections = useMemo(() => {
    return inspections.filter(
      (i) => i.isDefectIdentified && i.defectCategory && i.defectCategory !== 'None / Normal Condition'
    );
  }, [inspections]);

  // Selected inspection for active workspace
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>(
    eligibleInspections[0]?.id || ''
  );

  // Active view tab in workspace
  const [activeTab, setActiveTab] = useState<'plan' | 'options' | 'cost' | 'approval'>(
    initialTab || (mode === 'repair' ? 'cost' : 'plan')
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Overview KPIs
  const [overview, setOverview] = useState<MaintenancePlannerOverview>({
    totalRepairRecommendations: 0,
    openRepairProposals: 0,
    estimatesAwaitingReview: 0,
    approvedRepairBudgetsTotalINR: 0,
    upcomingPlannedRepairsCount: 0
  });

  // State for active plan and estimates
  const [currentPlan, setCurrentPlan] = useState<RepairPlan | null>(null);
  const [estimates, setEstimates] = useState<RepairCostEstimate[]>([]);
  const [selectedEstimateIndex, setSelectedEstimateIndex] = useState<number>(0);
  const [rateCatalog, setRateCatalog] = useState<RepairRateCatalogItem[]>([]);

  // Working editable copy of current estimate
  const activeEstimate = estimates[selectedEstimateIndex] || null;
  const [editableMeasurements, setEditableMeasurements] = useState<RepairMeasurements>({
    lengthM: undefined,
    widthM: undefined,
    depthM: undefined,
    areaM2: undefined,
    volumeM3: undefined,
    unitCount: 1,
    missingMeasurements: []
  });
  const [editableLineItems, setEditableLineItems] = useState<RepairEstimateLineItem[]>([]);
  const [contingencyPercent, setContingencyPercent] = useState<number | null>(null);
  const [taxPercent, setTaxPercent] = useState<number | null>(null);
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>('INR');

  // Preview totals computed deterministically
  const [computedSubtotal, setComputedSubtotal] = useState<number>(0);
  const [computedContingency, setComputedContingency] = useState<number>(0);
  const [computedTax, setComputedTax] = useState<number>(0);
  const [computedTotal, setComputedTotal] = useState<number>(0);
  const [activeWarnings, setActiveWarnings] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [approvalNotesInput, setApprovalNotesInput] = useState<string>('');

  // Selected inspection object
  const activeInspection = useMemo(() => {
    return inspections.find((i) => i.id === selectedInspectionId) || null;
  }, [inspections, selectedInspectionId]);

  // Load overview and rate catalog
  const loadOverviewAndCatalog = useCallback(async () => {
    try {
      const [ov, cat] = await Promise.all([
        fetchMaintenancePlannerOverview().catch(() => null),
        fetchRateCatalog().catch(() => [])
      ]);
      if (ov) setOverview(ov);
      if (cat) setRateCatalog(cat);
    } catch (err) {
      console.warn('Failed to load planner overview/catalog:', err);
    }
  }, []);

  useEffect(() => {
    loadOverviewAndCatalog();
  }, [loadOverviewAndCatalog]);

  // If initial selection is empty and eligible inspections load, select first
  useEffect(() => {
    if (!selectedInspectionId && eligibleInspections.length > 0) {
      setSelectedInspectionId(eligibleInspections[0].id);
    }
  }, [eligibleInspections, selectedInspectionId]);

  // Load repair plan and estimates whenever selected inspection changes
  const loadInspectionRepairData = useCallback(async (inspectionId: string) => {
    if (!inspectionId) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const [plan, ests] = await Promise.all([
        fetchRepairPlan(inspectionId),
        fetchRepairEstimates(inspectionId)
      ]);
      setCurrentPlan(plan);
      setEstimates(ests);
      setSelectedEstimateIndex(0);

      if (ests.length > 0) {
        const est = ests[0];
        setEditableMeasurements(est.measurements || { missingMeasurements: [] });
        setEditableLineItems(est.lineItems || []);
        setContingencyPercent(est.contingencyPercent ?? null);
        setTaxPercent(est.taxPercent ?? null);
        setCurrency(est.currency || 'INR');
        setComputedSubtotal(est.subtotal);
        setComputedContingency(est.contingencyAmount);
        setComputedTax(est.taxAmount);
        setComputedTotal(est.totalAmount);
        setActiveWarnings(est.missingInformationWarnings || []);
      }
    } catch (err: any) {
      console.error('Error loading repair plan/estimates:', err);
      setActionMessage({ type: 'error', text: err?.message || 'Failed to load repair intelligence records.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedInspectionId) {
      loadInspectionRepairData(selectedInspectionId);
    }
  }, [selectedInspectionId, loadInspectionRepairData]);

  // Deterministically recalculate preview whenever measurements, line items, or tax/contingency change
  const triggerRecalculatePreview = useCallback(async (
    items: RepairEstimateLineItem[],
    meas: RepairMeasurements,
    ctg: number | null,
    tx: number | null,
    cur: 'INR' | 'USD' | 'EUR' | 'GBP'
  ) => {
    try {
      const preview = await calculateEstimatePreview({
        measurements: meas,
        lineItems: items,
        contingencyPercent: ctg,
        taxPercent: tx,
        currency: cur
      });

      setEditableMeasurements(preview.measurements);
      setComputedSubtotal(preview.subtotal);
      setComputedContingency(preview.contingencyAmount);
      setComputedTax(preview.taxAmount);
      setComputedTotal(preview.totalAmount);
      setActiveWarnings(preview.missingInformationWarnings || []);
    } catch (err) {
      // Local fallback calculation if network fails
      let sub = 0;
      const reItems = items.map((i) => {
        const tot = Math.round((Number(i.quantity || 0) * Number(i.unitRate || 0)) * 100) / 100;
        sub = Math.round((sub + tot) * 100) / 100;
        return { ...i, lineTotal: tot };
      });
      const cAmt = ctg ? Math.round(((sub * ctg) / 100) * 100) / 100 : 0;
      const tAmt = tx ? Math.round((((sub + cAmt) * tx) / 100) * 100) / 100 : 0;
      setComputedSubtotal(sub);
      setComputedContingency(cAmt);
      setComputedTax(tAmt);
      setComputedTotal(Math.round((sub + cAmt + tAmt) * 100) / 100);
    }
  }, []);

  // Measurement change handlers with automatic area / volume calculation
  const handleMeasurementChange = (field: keyof RepairMeasurements, value: string) => {
    const num = value === '' ? undefined : Math.max(0, parseFloat(value));
    const next: RepairMeasurements = {
      ...editableMeasurements,
      [field]: num
    };

    // Calculate Area = Length × Width if available
    if (next.lengthM != null && next.widthM != null) {
      next.areaM2 = Math.round(next.lengthM * next.widthM * 1000) / 1000;
    }
    // Calculate Volume = Area × Depth if available
    if (next.areaM2 != null && next.depthM != null) {
      next.volumeM3 = Math.round(next.areaM2 * next.depthM * 10000) / 10000;
    }

    setEditableMeasurements(next);
    triggerRecalculatePreview(editableLineItems, next, contingencyPercent, taxPercent, currency);
  };

  // Line item change handlers
  const handleLineItemChange = (index: number, field: keyof RepairEstimateLineItem, value: any) => {
    const updated = [...editableLineItems];
    const current = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitRate') {
      const q = Math.max(0, Number(field === 'quantity' ? value : current.quantity) || 0);
      const r = Math.max(0, Number(field === 'unitRate' ? value : current.unitRate) || 0);
      current.lineTotal = Math.round(q * r * 100) / 100;
    }
    updated[index] = current;
    setEditableLineItems(updated);
    triggerRecalculatePreview(updated, editableMeasurements, contingencyPercent, taxPercent, currency);
  };

  const handleAddLineItem = () => {
    const newItem: RepairEstimateLineItem = {
      id: `item-custom-${Date.now()}`,
      category: 'MATERIAL',
      description: 'New Material or Labor Line Item',
      quantity: 1,
      unit: 'No.',
      unitRate: 500,
      lineTotal: 500,
      rateSource: 'User Entered',
      isManual: true
    };
    const next = [...editableLineItems, newItem];
    setEditableLineItems(next);
    triggerRecalculatePreview(next, editableMeasurements, contingencyPercent, taxPercent, currency);
  };

  const handleDeleteLineItem = (index: number) => {
    const next = editableLineItems.filter((_, i) => i !== index);
    setEditableLineItems(next);
    triggerRecalculatePreview(next, editableMeasurements, contingencyPercent, taxPercent, currency);
  };

  const handleAutofillFromCatalog = (catItem: RepairRateCatalogItem) => {
    const newItem: RepairEstimateLineItem = {
      id: `item-cat-${Date.now()}`,
      category: catItem.category,
      description: catItem.itemName,
      quantity: 1,
      unit: catItem.unit,
      unitRate: catItem.defaultRateINR,
      lineTotal: catItem.defaultRateINR,
      rateSource: `Standard Catalog (${catItem.region || 'DSR / CPWD'})`,
      isManual: false,
      notes: catItem.description
    };
    const next = [...editableLineItems, newItem];
    setEditableLineItems(next);
    triggerRecalculatePreview(next, editableMeasurements, contingencyPercent, taxPercent, currency);
  };

  // Switch option handler (e.g. Option A -> Option B -> Option C)
  const handleSelectOption = (option: RepairOption) => {
    if (!currentPlan) return;
    const suggestedItems: RepairEstimateLineItem[] = (option.suggestedLineItems || []).map((s, idx) => ({
      id: `item-opt-${idx + 1}-${Date.now()}`,
      category: s.category || 'MATERIAL',
      description: s.description || 'Suggested Item',
      quantity: s.quantity || 1,
      unit: s.unit || 'No.',
      unitRate: s.unitRate || 100,
      lineTotal: Math.round((s.quantity || 1) * (s.unitRate || 100) * 100) / 100,
      rateSource: 'Suggested from Option Scope',
      isManual: false
    }));

    setEditableLineItems(suggestedItems);
    triggerRecalculatePreview(suggestedItems, editableMeasurements, contingencyPercent, taxPercent, currency);
    setActiveTab('cost');
    setActionMessage({
      type: 'success',
      text: `Loaded suggested scope and cost structure for ${option.title} (${option.optionKey}).`
    });
  };

  // Save current estimate as draft
  const handleSaveDraft = async () => {
    if (!activeEstimate || !selectedInspectionId) return;
    setSaving(true);
    setActionMessage(null);
    try {
      const payload: Partial<RepairCostEstimate> = {
        ...activeEstimate,
        measurements: editableMeasurements,
        lineItems: editableLineItems,
        contingencyPercent,
        taxPercent,
        currency
      };
      const saved = await saveRepairEstimate(selectedInspectionId, payload);
      setEstimates((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
      setActionMessage({ type: 'success', text: `Cost estimate saved successfully (Status: ${saved.status}).` });
      await loadOverviewAndCatalog();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to save draft estimate.' });
    } finally {
      setSaving(false);
    }
  };

  // Submit / Approve / Reject / Request Revision lifecycle handler
  const handleUpdateStatusAction = async (action: 'SUBMIT_FOR_REVIEW' | 'APPROVE' | 'REJECT' | 'REQUEST_REVISION') => {
    if (!activeEstimate) return;
    setSaving(true);
    setActionMessage(null);
    try {
      // First ensure latest line items & measurements are saved
      await saveRepairEstimate(selectedInspectionId, {
        ...activeEstimate,
        measurements: editableMeasurements,
        lineItems: editableLineItems,
        contingencyPercent,
        taxPercent,
        currency
      });

      const updated = await updateEstimateStatus(
        activeEstimate.id,
        action,
        approvalNotesInput,
        profile?.fullName || 'Property Manager'
      );

      setEstimates((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setApprovalNotesInput('');
      const actionName =
        action === 'APPROVE'
          ? 'Approved'
          : action === 'SUBMIT_FOR_REVIEW'
          ? 'Submitted for Review'
          : action === 'REJECT'
          ? 'Rejected'
          : 'Revision Requested';
      setActionMessage({ type: 'success', text: `Estimate ${activeEstimate.id} has been ${actionName}.` });
      await loadOverviewAndCatalog();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to update estimate status.' });
    } finally {
      setSaving(false);
    }
  };

  // Estimate Versioning Revision: Creates v2 draft, supersedes v1
  const handleCreateNewRevision = async () => {
    if (!activeEstimate) return;
    setSaving(true);
    setActionMessage(null);
    try {
      const result = await reviseRepairEstimate(activeEstimate.id, {
        inspectionId: selectedInspectionId,
        newMeasurements: editableMeasurements,
        newLineItems: editableLineItems,
        contingencyPercent,
        taxPercent,
        modifierName: profile?.fullName || 'Property Manager'
      });

      // Reload all estimates to see both superseded and newly created revision
      await loadInspectionRepairData(selectedInspectionId);
      setActionMessage({
        type: 'success',
        text: `Created new draft revision v${result.newRevisionEstimate.version}. Prior version v${result.supersededEstimate.version} is preserved as SUPERSEDED.`
      });
      await loadOverviewAndCatalog();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to create revised version.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/20">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Repair Intelligence & Cost Estimation Engine
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                  NBC 2016 / IS 456
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Converts forensic inspection findings and risk intelligence into evidence-grounded repair plans, itemized cost estimates, and maintenance schedules.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Feedback Badge */}
        {actionMessage && (
          <div
            className={`p-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 border animate-fadeIn ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/60 border-red-500/40 text-red-200'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}
      </div>

      {/* 2. Overview KPI Cards (Calculated directly from actual database records) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-xl bg-[#101726]/90 border border-slate-800 p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Repair Plans</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {overview.totalRepairRecommendations}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Formulated from defects</span>
        </div>

        <div className="rounded-xl bg-[#101726]/90 border border-slate-800 p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Open Proposals</span>
            <Edit3 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300 font-mono">
            {overview.openRepairProposals}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Drafts & Revisions</span>
        </div>

        <div className="rounded-xl bg-[#101726]/90 border border-slate-800 p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Awaiting Review</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-300 font-mono">
            {overview.estimatesAwaitingReview}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Pending PM sign-off</span>
        </div>

        <div className="rounded-xl bg-[#101726]/90 border border-slate-800 p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Approved Budgets</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono truncate">
            ₹{overview.approvedRepairBudgetsTotalINR.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Validated maintenance total</span>
        </div>

        <div className="rounded-xl bg-[#101726]/90 border border-slate-800 p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Planned Repairs</span>
            <CalendarCheck2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono">
            {overview.upcomingPlannedRepairsCount}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Ready for dispatch</span>
        </div>
      </div>

      {/* 3. Main Workspace Layout */}
      {eligibleInspections.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column: Eligible Findings Selector */}
          <div className="xl:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileSearch className="w-3.5 h-3.5 text-blue-400" />
                <span>Eligible Defect Records ({eligibleInspections.length})</span>
              </span>
              <button
                onClick={() => loadOverviewAndCatalog()}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                title="Refresh Records"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {eligibleInspections.map((insp) => {
                const isSelected = insp.id === selectedInspectionId;
                const isCritical = insp.severity === 'CRITICAL' || insp.safetyEscalation?.isEscalated;
                const isHigh = insp.severity === 'HIGH';

                return (
                  <div
                    key={insp.id}
                    onClick={() => setSelectedInspectionId(insp.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                        : 'bg-[#101726]/80 hover:bg-[#131f38] border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-blue-400 font-semibold uppercase">
                          {insp.id.slice(0, 8)}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate mt-0.5">
                          {insp.propertyName}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">
                          {insp.floorOrRoom} • {insp.location}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                          isCritical
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : isHigh
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {insp.severity}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-slate-300 font-medium truncate max-w-[180px]">
                        {insp.defectCategory}
                      </span>
                      {insp.safetyEscalation?.isEscalated && (
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span>Escalated</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Inspection Workspace */}
          <div className="xl:col-span-8 space-y-4">
            {activeInspection && (
              <div className="rounded-2xl bg-[#101726]/95 border border-slate-800 p-5 shadow-2xl space-y-5">
                {/* Active Finding Banner */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-blue-400 font-bold uppercase">
                        {activeInspection.id}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                        {activeInspection.defectCategory}
                      </span>
                      {activeEstimate && (
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            activeEstimate.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : activeEstimate.status === 'AWAITING_REVIEW'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : activeEstimate.status === 'SUPERSEDED'
                              ? 'bg-slate-700/60 text-slate-400 border border-slate-600'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          Estimate {activeEstimate.status} (v{activeEstimate.version})
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-extrabold text-white mt-1">
                      {activeInspection.propertyName} — {currentPlan?.defectTitle || 'Remediation Workspace'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Location: {activeInspection.location} • {activeInspection.floorOrRoom}
                    </p>
                  </div>

                  {/* Version Selector (if multiple versions exist) */}
                  {estimates.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                        <History className="w-3.5 h-3.5 text-blue-400" />
                        <span>Version:</span>
                      </span>
                      <select
                        value={selectedEstimateIndex}
                        onChange={(e) => {
                          const idx = Number(e.target.value);
                          setSelectedEstimateIndex(idx);
                          const est = estimates[idx];
                          if (est) {
                            setEditableMeasurements(est.measurements || { missingMeasurements: [] });
                            setEditableLineItems(est.lineItems || []);
                            setContingencyPercent(est.contingencyPercent ?? null);
                            setTaxPercent(est.taxPercent ?? null);
                            setCurrency(est.currency || 'INR');
                            setComputedSubtotal(est.subtotal);
                            setComputedContingency(est.contingencyAmount);
                            setComputedTax(est.taxAmount);
                            setComputedTotal(est.totalAmount);
                            setActiveWarnings(est.missingInformationWarnings || []);
                          }
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-semibold"
                      >
                        {estimates.map((est, idx) => (
                          <option key={est.id} value={idx}>
                            v{est.version} ({est.status}) — ₹{est.totalAmount.toLocaleString('en-IN')}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Workspace Navigation Subtabs */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('cost')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'cost'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Cost Estimation Workspace</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('options')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'options'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Compare Repair Options (3)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('plan')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'plan'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Repair Intelligence & Sequence</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('approval')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'approval'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Approval & Audit Panel</span>
                  </button>
                </div>

                {/* Subtab 1: Cost Estimation Workspace */}
                {activeTab === 'cost' && (
                  <div className="space-y-5">
                    {/* Measurement & Quantity Input Grid */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-blue-400" />
                          <span>On-Site Measurements & Quantity Calculator</span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {editableMeasurements.isMeasuredOnSite ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Measured on Site
                            </span>
                          ) : (
                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Measurements Required
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            Length (m)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editableMeasurements.lengthM ?? ''}
                            onChange={(e) => handleMeasurementChange('lengthM', e.target.value)}
                            placeholder="e.g. 5.0"
                            className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            Width / Aperture (m)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editableMeasurements.widthM ?? ''}
                            onChange={(e) => handleMeasurementChange('widthM', e.target.value)}
                            placeholder="e.g. 2.0"
                            className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            Depth (m)
                          </label>
                          <input
                            type="number"
                            step="0.005"
                            min="0"
                            value={editableMeasurements.depthM ?? ''}
                            onChange={(e) => handleMeasurementChange('depthM', e.target.value)}
                            placeholder="e.g. 0.05"
                            className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            Calculated Area (m²)
                          </label>
                          <div className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-blue-300 font-mono font-bold">
                            {editableMeasurements.areaM2 ? `${editableMeasurements.areaM2} m²` : '—'}
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            Volume (m³)
                          </label>
                          <div className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-purple-300 font-mono font-bold">
                            {editableMeasurements.volumeM3 ? `${editableMeasurements.volumeM3} m³` : '—'}
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">
                            Item Count (No.)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editableMeasurements.unitCount ?? 1}
                            onChange={(e) => handleMeasurementChange('unitCount', e.target.value)}
                            className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Missing Measurements Warning */}
                      {editableMeasurements.missingMeasurements && editableMeasurements.missingMeasurements.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            <strong>Notice:</strong> Physical measurements ({editableMeasurements.missingMeasurements.join(', ')}) required before a reliable contractor estimate can be finalized.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Itemized Line Items Table */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span>Itemized Cost Schedule (Line item total = Quantity × Unit rate)</span>
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Autofill Catalog Dropdown */}
                          <select
                            onChange={(e) => {
                              const found = rateCatalog.find((c) => c.id === e.target.value);
                              if (found) {
                                handleAutofillFromCatalog(found);
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-semibold"
                          >
                            <option value="" disabled>
                              + Add from Rate Catalog...
                            </option>
                            {rateCatalog.map((c) => (
                              <option key={c.id} value={c.id}>
                                [{c.category}] {c.itemName} (₹{c.defaultRateINR}/{c.unit})
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={handleAddLineItem}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Custom Line</span>
                          </button>
                        </div>
                      </div>

                      {/* Line Items Table */}
                      <div className="rounded-xl border border-slate-800 overflow-x-auto bg-[#0a0f1d]/90">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-900/90 text-[11px] text-slate-400 uppercase font-semibold border-b border-slate-800">
                            <tr>
                              <th className="p-2.5 pl-3">Category</th>
                              <th className="p-2.5">Description</th>
                              <th className="p-2.5 w-24">Quantity</th>
                              <th className="p-2.5 w-24">Unit</th>
                              <th className="p-2.5 w-28">Unit Rate ({currency === 'INR' ? '₹' : currency})</th>
                              <th className="p-2.5 w-28 text-right">Line Total</th>
                              <th className="p-2.5 w-32">Rate Source</th>
                              <th className="p-2.5 w-12 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                            {editableLineItems.length > 0 ? (
                              editableLineItems.map((item, index) => (
                                <tr key={item.id || index} className="hover:bg-slate-800/30">
                                  <td className="p-2 pl-3">
                                    <select
                                      value={item.category}
                                      onChange={(e) => handleLineItemChange(index, 'category', e.target.value)}
                                      className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-200"
                                    >
                                      <option value="MATERIAL">MATERIAL</option>
                                      <option value="LABOUR">LABOUR</option>
                                      <option value="EQUIPMENT">EQUIPMENT</option>
                                      <option value="ACCESS_SCAFFOLDING">ACCESS</option>
                                      <option value="TRANSPORT_DISPOSAL">DISPOSAL</option>
                                      <option value="OTHER">OTHER</option>
                                    </select>
                                  </td>
                                  <td className="p-2 font-sans">
                                    <input
                                      type="text"
                                      value={item.description}
                                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                      className="w-full bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 text-xs text-white focus:outline-none"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={item.quantity}
                                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-white text-right font-mono"
                                    />
                                  </td>
                                  <td className="p-2 font-sans">
                                    <select
                                      value={item.unit}
                                      onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                                      className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-200"
                                    >
                                      <option value="No.">No.</option>
                                      <option value="m²">m²</option>
                                      <option value="m³">m³</option>
                                      <option value="m">m</option>
                                      <option value="kg">kg</option>
                                      <option value="Hour">Hour</option>
                                      <option value="Day">Day</option>
                                      <option value="Lump sum">Lump sum</option>
                                    </select>
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      step="1"
                                      min="0"
                                      value={item.unitRate}
                                      onChange={(e) => handleLineItemChange(index, 'unitRate', e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-white text-right font-mono"
                                    />
                                  </td>
                                  <td className="p-2 text-right font-bold text-white">
                                    ₹{item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-2 font-sans text-[11px] text-slate-400 truncate max-w-[130px]">
                                    {item.rateSource || 'User Entered'}
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleDeleteLineItem(index)}
                                      className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                                      title="Remove Line Item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={8} className="p-6 text-center text-slate-500 font-sans">
                                  No cost line items added. Use "+ Add from Rate Catalog" or "+ Add Custom Line" above.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Financial Summary & Configuration Box */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                      {/* Configuration: Taxes, Contingency, Currency */}
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                          Contingency & Tax Configuration
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Contingency and statutory taxes are strictly calculated only when explicitly configured by the property administrator.
                        </p>

                        <div className="grid grid-cols-3 gap-3 pt-1">
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              Contingency (%)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={contingencyPercent ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                setContingencyPercent(val);
                                triggerRecalculatePreview(editableLineItems, editableMeasurements, val, taxPercent, currency);
                              }}
                              placeholder="e.g. 10%"
                              className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              GST / Tax (%)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={taxPercent ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                setTaxPercent(val);
                                triggerRecalculatePreview(editableLineItems, editableMeasurements, contingencyPercent, val, currency);
                              }}
                              placeholder="e.g. 18%"
                              className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              Currency
                            </label>
                            <select
                              value={currency}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setCurrency(val);
                                triggerRecalculatePreview(editableLineItems, editableMeasurements, contingencyPercent, taxPercent, val);
                              }}
                              className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="INR">INR (₹)</option>
                              <option value="USD">USD ($)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="GBP">GBP (£)</option>
                            </select>
                          </div>
                        </div>

                        {/* Missing Information / Warning Notices */}
                        {activeWarnings.length > 0 && (
                          <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                            <span className="font-bold flex items-center gap-1">
                              <Info className="w-3.5 h-3.5 text-amber-400" />
                              <span>Estimate Incompleteness Warnings:</span>
                            </span>
                            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-200/90 font-mono">
                              {activeWarnings.map((w, idx) => (
                                <li key={idx}>{w}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Financial Totals Breakdown Box */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-[#131f38] to-[#0f172a] border border-blue-500/30 space-y-2.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                              Deterministic Cost Summary
                            </span>
                            <span className="text-[10px] text-blue-400 font-mono">
                              Server-Recalculated
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-2 text-xs font-mono">
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="font-sans">Subtotal (Line Items):</span>
                              <span>₹{computedSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="flex items-center justify-between text-slate-400">
                              <span className="font-sans">
                                Contingency ({contingencyPercent != null ? `${contingencyPercent}%` : 'Not configured'}):
                              </span>
                              <span>
                                {contingencyPercent != null
                                  ? `₹${computedContingency.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                  : '₹0.00'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-slate-400">
                              <span className="font-sans">
                                Applicable Tax ({taxPercent != null ? `${taxPercent}%` : 'Not configured'}):
                              </span>
                              <span>
                                {taxPercent != null
                                  ? `₹${computedTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                  : '₹0.00'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-300 block">
                              Estimated Total Amount:
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Subject to contractor confirmation
                            </span>
                          </div>
                          <div className="text-2xl font-black text-white font-mono">
                            ₹{computedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveDraft}
                          disabled={saving}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span>Save Draft</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatusAction('SUBMIT_FOR_REVIEW')}
                          disabled={saving || computedTotal <= 0}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          <span>Submit for Review</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab('approval')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span>Go to Approval Panel</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtab 2: Compare 3 Repair Options */}
                {activeTab === 'options' && currentPlan && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Plausible Remediation Approaches Comparison
                        </h3>
                        <p className="text-xs text-slate-400">
                          Compare technical scopes, duration, advantages, and limitations side-by-side before committing funds.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentPlan.options.map((option) => (
                        <div
                          key={option.id}
                          className="rounded-xl bg-slate-900/70 border border-slate-800 p-4 flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition-all"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
                              <div>
                                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">
                                  {option.optionKey}
                                </span>
                                <h4 className="text-sm font-bold text-white mt-0.5">
                                  {option.title}
                                </h4>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold shrink-0">
                                {option.approachType}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300">
                              {option.scopeOfWork}
                            </p>

                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-center justify-between text-slate-400">
                                <span>Duration:</span>
                                <strong className="text-white font-mono">{option.estimatedDuration}</strong>
                              </div>
                              <div className="flex items-center justify-between text-slate-400">
                                <span>Specialist:</span>
                                <strong className="text-slate-200">{option.requiredSpecialist}</strong>
                              </div>
                              <div className="flex items-center justify-between text-slate-400">
                                <span>Structural PE Validation:</span>
                                <span className={option.requiresPEValidation ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                                  {option.requiresPEValidation ? 'Required (IS 456)' : 'Optional'}
                                </span>
                              </div>
                            </div>

                            {/* Advantages & Limitations */}
                            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px]">
                              <div>
                                <span className="text-emerald-400 font-bold flex items-center gap-1 mb-1">
                                  <CheckCircle2 className="w-3 h-3" /> Advantages:
                                </span>
                                <ul className="text-slate-400 space-y-0.5 pl-3 list-disc">
                                  {option.advantages.map((adv, idx) => (
                                    <li key={idx}>{adv}</li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <span className="text-amber-400 font-bold flex items-center gap-1 mb-1">
                                  <AlertTriangle className="w-3 h-3" /> Limitations:
                                </span>
                                <ul className="text-slate-400 space-y-0.5 pl-3 list-disc">
                                  {option.limitations.map((lim, idx) => (
                                    <li key={idx}>{lim}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSelectOption(option)}
                            className="w-full py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                          >
                            <span>Adopt Scope into Estimator</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subtab 3: Repair Intelligence & Sequence */}
                {activeTab === 'plan' && currentPlan && (
                  <div className="space-y-5">
                    {/* Tripartite Breakdown: Observed vs Possible Causes vs Diagnostics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>A. Observed Condition</span>
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {currentPlan.observedCondition}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>B. Plausible Causes</span>
                        </span>
                        <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                          {currentPlan.possibleCauses.map((cause, idx) => (
                            <li key={idx}>{cause}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>C. Mandatory Diagnostics</span>
                        </span>
                        <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                          {currentPlan.diagnosticTests.map((t, idx) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Cosmetic Repair Prohibition Alert */}
                    {currentPlan.isCosmeticProhibited && (
                      <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
                        <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white block font-semibold">
                            Engineering Safeguard: Cosmetic-Only Repair Prohibited
                          </strong>
                          <span>
                            Moisture ingress or active structural shear strains must be diagnosed and arrested before applying finish coats. Surface plastering or repainting without root-cause resolution is forbidden under NBC 2016 maintenance standards.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Step-by-Step Sequence */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-blue-400" />
                        <span>Step-by-Step Remediation Sequence</span>
                      </span>

                      <div className="space-y-2">
                        {currentPlan.stepSequence.map((step, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-[#0a0f1d] border border-slate-800/80 text-xs text-slate-200 flex items-start gap-3"
                          >
                            <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed mt-0.5">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Safety & Stop-Work Conditions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertOctagon className="w-4 h-4 text-red-400" />
                          <span>Stop-Work Trigger Conditions</span>
                        </span>
                        <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                          {currentPlan.stopWorkConditions.map((cond, idx) => (
                            <li key={idx} className="leading-relaxed">{cond}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <HardHat className="w-4 h-4 text-amber-400" />
                          <span>Safety Precautions & PPE Mandate</span>
                        </span>
                        <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                          {currentPlan.safetyPrecautions.map((safe, idx) => (
                            <li key={idx} className="leading-relaxed">{safe}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtab 4: Approval & Lifecycle History */}
                {activeTab === 'approval' && activeEstimate && (
                  <div className="space-y-5">
                    {/* Status Banner */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs text-slate-400 font-medium">Estimate Lifecycle State:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-sm px-3 py-1 rounded-full font-bold uppercase font-mono ${
                              activeEstimate.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : activeEstimate.status === 'AWAITING_REVIEW'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : activeEstimate.status === 'SUPERSEDED'
                                ? 'bg-slate-700/60 text-slate-400 border border-slate-600'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {activeEstimate.status}
                          </span>
                          <span className="text-xs text-slate-300 font-mono">
                            Revision v{activeEstimate.version}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 font-medium">Grand Total Amount:</span>
                        <div className="text-2xl font-black text-white font-mono">
                          ₹{activeEstimate.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Approval Action Form */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                        Property Manager Review & Authorization Actions
                      </span>
                      <p className="text-xs text-slate-400">
                        Approving an estimate locks this revision in the auditable database. Any subsequent edits will spawn a new revision (e.g. v2) while keeping this approved version intact.
                      </p>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Reviewer Comments / Audit Notes
                        </label>
                        <textarea
                          rows={3}
                          value={approvalNotesInput}
                          onChange={(e) => setApprovalNotesInput(e.target.value)}
                          placeholder="Enter professional justification, contractor selection notes, or conditions of approval..."
                          className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {activeEstimate.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatusAction('APPROVE')}
                            disabled={saving || computedTotal <= 0}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <FileCheck className="w-4 h-4" />
                            <span>Approve Estimate (Authorize Budget)</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleUpdateStatusAction('REQUEST_REVISION')}
                          disabled={saving}
                          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Request Changes / Revision</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatusAction('REJECT')}
                          disabled={saving}
                          className="px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Estimate</span>
                        </button>

                        {/* If already approved, allow creating revised v2 */}
                        {activeEstimate.status === 'APPROVED' && (
                          <button
                            onClick={handleCreateNewRevision}
                            disabled={saving}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Create New Revised Version (v{activeEstimate.version + 1})</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dispatch Work Order Notice */}
                    {activeEstimate.status === 'APPROVED' && (
                      <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 text-xs text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <strong className="text-white block font-bold text-sm">
                            Ready for Maintenance Dispatch
                          </strong>
                          <span>
                            This estimate has been approved. You can now dispatch a formal contractor work order with locked scope and budget.
                          </span>
                        </div>
                        <button
                          onClick={() => onCreateWorkOrder(activeInspection)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <span>Dispatch Work Order</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State: No eligible inspection findings */
        <div className="py-20 px-4 text-center rounded-2xl bg-[#101726]/90 border border-slate-800">
          <CalendarCheck2 className="w-14 h-14 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-200">No Eligible Defect Inspections Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            When you inspect a property using the multimodal camera or file uploader and a defect is confirmed, evidence-grounded repair recommendations, quantity estimators, and itemized cost calculations will automatically populate here.
          </p>
        </div>
      )}
    </div>
  );
};
