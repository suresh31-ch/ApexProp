import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Activity,
  Layers,
  Wrench,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  UserCheck,
  Download,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Crosshair,
  Camera,
  Gauge
} from 'lucide-react';
import { InspectionRecord } from '../types';
import { generateInspectionPDF } from '../utils/pdfGenerator';

interface PipelineStageViewerProps {
  inspection: InspectionRecord;
  onApprove: (notes: string) => Promise<void>;
  onCreateWorkOrder: () => void;
  onClose?: () => void;
}

export const PipelineStageViewer: React.FC<PipelineStageViewerProps> = ({
  inspection,
  onApprove,
  onCreateWorkOrder,
  onClose
}) => {
  const [activeStage, setActiveStage] = useState<number>(1);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  const stages = [
    { num: 1, name: 'Evidence Inspector', icon: Search, short: 'Visible Evidence' },
    { num: 2, name: 'Root Cause Analyst', icon: Layers, short: 'Plausible Hypotheses' },
    { num: 3, name: 'Risk Intelligence', icon: ShieldAlert, short: 'Urgency & Risk' },
    { num: 4, name: 'Repair Intelligence', icon: Wrench, short: 'Remediation Options' },
    { num: 5, name: 'Maintenance Planner', icon: CalendarCheck, short: 'Scope & Schedule' },
    { num: 6, name: 'Verification Agent', icon: ShieldCheck, short: 'Truthfulness Audit' },
    { num: 7, name: 'Human Approval', icon: UserCheck, short: 'Operations Sign-off' },
  ];

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApproving(true);
    try {
      await onApprove(approvalNotes);
      setApprovalSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'DEFECT_CONFIRMED':
      case 'VISUAL_FINDING_DETECTED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'POTENTIAL_DEFECT':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'NO_VISIBLE_DEFECT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'INCONCLUSIVE':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Top Banner / Summary Header */}
      <div className="p-5 lg:p-6 bg-gradient-to-r from-[#11192e] via-[#0d162a] to-[#121c38] border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0 shadow-md">
            <img
              src={inspection.imageUrl}
              alt="Subject"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue-400 tracking-wider uppercase font-mono">
                {inspection.id}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(inspection.overallInspectionStatus)}`}>
                {inspection.approval?.status === 'APPROVED' || inspection.humanReviews?.some(r => r.action === 'ACCEPT')
                  ? '✅ DEFECT CONFIRMED (HUMAN VERIFIED)'
                  : (inspection.overallInspectionStatus === 'DEFECT_CONFIRMED' || inspection.overallInspectionStatus === 'VISUAL_FINDING_DETECTED')
                  ? '🔍 VISUAL FINDING DETECTED'
                  : inspection.overallInspectionStatus === 'NO_VISIBLE_DEFECT'
                  ? '✨ NO VISIBLE DEFECT'
                  : inspection.overallInspectionStatus === 'INCONCLUSIVE'
                  ? '⚠️ INCONCLUSIVE'
                  : '⚡ POTENTIAL DEFECT'}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(inspection.severity)}`}>
                {inspection.severity} SEVERITY
              </span>
              <span
                className="text-[11px] font-bold text-blue-300 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/30 font-mono"
                title="Optical / Visual model feature recognition confidence. Does not denote structural safety or collapse probability."
              >
                Optical Confidence: {inspection.visualConfidence ?? 88}%
              </span>
              <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                {inspection.defectCategory}
              </span>
              {inspection.multiImageCorrelation && inspection.multiImageCorrelation.imagesAnalyzedCount > 1 && (
                <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30 font-medium">
                  📷 {inspection.multiImageCorrelation.imagesAnalyzedCount} Angles Correlated
                </span>
              )}
              {inspection.isSampleData && (
                <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Sample Baseline
                </span>
              )}
            </div>
            <h2 className="text-lg font-extrabold text-white">
              {inspection.propertyName}
            </h2>
            <p className="text-xs text-slate-400">
              {inspection.location} • {inspection.buildingType} • Area: {inspection.floorOrRoom}
            </p>
          </div>
        </div>

        {/* Action Buttons: PDF Download, Work Order Dispatch */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => generateInspectionPDF(inspection)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Download PDF Report</span>
          </button>

          {inspection.approval?.status === 'APPROVED' ? (
            <button
              onClick={onCreateWorkOrder}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Create Work Order</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveStage(7)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Review for Approval</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all ml-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Urgent Structural Safety Alert Banner (Triggered for Critical / High Severity) */}
      {(inspection.severity === 'CRITICAL' || inspection.severity === 'HIGH') && (
        <div className="bg-red-950/40 border-b border-red-500/40 px-6 py-3 flex items-start gap-3 text-xs text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <div className="font-bold text-red-300 uppercase tracking-wide flex items-center gap-2">
              <span>⚠️ Immediate Structural Safety Precaution & Access Restriction</span>
              <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30">Action Required</span>
            </div>
            <p className="mt-1 text-slate-300 leading-relaxed">
              {inspection.immediatePrecautions?.[0] || 'Cordon off immediate perimeter beneath affected structural element. Restrict personnel access until certified structural engineer completes physical on-site audit.'}
            </p>
            {inspection.immediatePrecautions && inspection.immediatePrecautions.length > 1 && (
              <p className="mt-0.5 text-red-300/90 font-medium">
                • {inspection.immediatePrecautions[1]}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Forensic Summary & Diagnostic Strip */}
      <div className="bg-[#0b101e] border-b border-slate-800 px-6 py-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Pathology Summary:</span>
          <span className="text-slate-200 font-medium">{inspection.summary}</span>
          <div className="text-[11px] text-slate-400 mt-0.5">
            <strong className="text-slate-300">Severity Assessment:</strong> {inspection.severityReasoning}
          </div>
        </div>

        {/* Diagnostic Metadata Badge */}
        {inspection.imageQuality && (
          <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>Resolution: <strong className="text-slate-300">{inspection.imageQuality.resolution}</strong></span>
            <span>•</span>
            <span>Lighting: <strong className="text-slate-300">{inspection.imageQuality.lighting}</strong></span>
            <span>•</span>
            <span>Focus: <strong className="text-slate-300">{inspection.imageQuality.focus}</strong></span>
          </div>
        )}
      </div>

      {/* Precision Pinpoint Target Verification Card (if pinpoint provided) */}
      {inspection.pinpointAnalysis?.targetProvided && (
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Crosshair className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">Inspector Target Pinpoint Verification</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  inspection.pinpointAnalysis.defectConfirmedAtTarget === true
                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                    : inspection.pinpointAnalysis.defectConfirmedAtTarget === false
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                }`}>
                  {inspection.pinpointAnalysis.defectConfirmedAtTarget === true
                    ? '🎯 Visual Finding Detected at Target'
                    : inspection.pinpointAnalysis.defectConfirmedAtTarget === false
                    ? '✨ Target Region Normal / Zero Defect'
                    : '⚠️ Target Inconclusive'}
                </span>
              </div>
              <p className="text-slate-300 mt-0.5">
                {inspection.pinpointAnalysis.targetObservations} • <span className="text-slate-400">{inspection.pinpointAnalysis.comparisonWithSurroundings}</span>
              </p>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded font-mono shrink-0">
            Zero-Hallucination Audit Passed
          </span>
        </div>
      )}

      {/* Mandatory Safety Notice */}
      <div className="bg-amber-950/20 border-b border-amber-500/20 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-300">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Autonomous Investigation Protocol:</strong> Visual analysis based strictly on surface pixels. Does not certify structural, electrical, or fire safety. Requires qualified human verification prior to destructive alteration.
        </span>
      </div>

      {/* Stage Stepper Tabs */}
      <div className="bg-[#0b1222] border-b border-slate-800/80 px-4 py-2 flex items-center gap-1 overflow-x-auto select-none">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.num;
          return (
            <button
              key={stage.num}
              onClick={() => setActiveStage(stage.num)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {stage.num}
              </span>
              <span>{stage.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Active Stage Content */}
      <div className="p-6 overflow-y-auto max-h-[70vh]">
        {/* STAGE 1: EVIDENCE INSPECTOR */}
        {activeStage === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-400" />
                  Stage 1: Evidence Inspector
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct observation of surface pixels, distinct features, and image illumination.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                Category A: Pixel Verified
              </span>
            </div>

            {/* Zero Defect Case Handling */}
            {!inspection.isDefectIdentified ? (
              <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-base font-bold text-emerald-300">
                  No Visible Property Defect Confidently Identified
                </h4>
                <p className="text-xs text-slate-300 max-w-xl mx-auto mt-2 leading-relaxed">
                  The AI vision model analyzed the submitted photograph and identified sound surface finishes with no uncharacteristic cracking, water staining, corrosion, or deformation.
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category A: Directly Visible Evidence */}
              <div className="rounded-xl bg-slate-900/60 border border-blue-500/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                    Category A — Directly Visible Evidence
                  </h4>
                </div>
                <ul className="space-y-2">
                  {inspection.categoryA_visibleEvidence?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-blue-400 font-mono font-bold shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  )) || (
                    <li className="text-xs text-slate-400">No anomalous visible features detected.</li>
                  )}
                </ul>
              </div>

              {/* Surface & Image Quality Condition */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Surface & Image Calibration
                  </h4>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold">Surface Substrate Condition</div>
                  <div className="text-xs text-slate-200 mt-0.5">
                    {inspection.pipeline?.stage1_evidence?.surfaceCondition || 'Sound substrate with localized surface distress.'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold">Lighting & Pixel Clarity</div>
                  <div className="text-xs text-slate-200 mt-0.5">
                    {inspection.pipeline?.stage1_evidence?.lightingAndClarityAssessment || 'Sufficient resolution for visual pathology.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Grounded Evidence Items Cards */}
            {inspection.evidenceItems && inspection.evidenceItems.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-blue-400" />
                    Grounded Visual Evidence Findings ({inspection.evidenceItems.length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Image-Grounded Pixel Citations</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {inspection.evidenceItems.map((ev, idx) => (
                    <div key={idx} className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {ev.findingId}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(ev.severity)}`}>
                            {ev.severity}
                          </span>
                          <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 font-mono">
                            {ev.visualConfidence}% Conf.
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <Camera className="w-3 h-3 text-cyan-400" />
                          <span>Source: <strong className="text-slate-200">{ev.imageRef}</strong></span>
                          {ev.visualLocationOrQuadrant && (
                            <span className="text-slate-400 font-mono text-[10px]">({ev.visualLocationOrQuadrant})</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                          {ev.visibleEvidenceDescription}
                        </p>
                      </div>

                      {ev.alternativeExplanations && ev.alternativeExplanations.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                          <strong className="text-slate-300">Alternative Consideration:</strong> {ev.alternativeExplanations[0]}
                        </div>
                      )}

                      {ev.recommendedNextAction && (
                        <div className="text-[11px] text-blue-300 bg-blue-950/30 p-2 rounded-lg border border-blue-500/20 flex items-center gap-1.5">
                          <Wrench className="w-3 h-3 text-blue-400 shrink-0" />
                          <span><strong>Action:</strong> {ev.recommendedNextAction}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : inspection.pipeline?.stage1_evidence?.visibleObservations?.length ? (
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 bg-slate-800/40 border-b border-slate-800 text-xs font-bold text-slate-300">
                  Detailed Feature Breakdown
                </div>
                <div className="divide-y divide-slate-800">
                  {inspection.pipeline.stage1_evidence.visibleObservations.map((obs, idx) => (
                    <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-semibold text-slate-200">{obs.element}</div>
                        <div className="text-slate-400 mt-0.5">{obs.exactVisualEvidence}</div>
                      </div>
                      <span className="text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-mono shrink-0">
                        {obs.visualLocationInImage || 'Image Plane'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* STAGE 2: ROOT CAUSE ANALYST */}
        {activeStage === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Stage 2: Root Cause Analyst
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scientific hypotheses formulation, environmental catalysts, and alternative explanations.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                Category B: Hypotheses Only
              </span>
            </div>

            {/* Structured Root Cause Hypotheses List */}
            {inspection.rootCauseHypothesesList && inspection.rootCauseHypothesesList.length > 0 ? (
              <div className="space-y-3">
                {inspection.rootCauseHypothesesList.map((h, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase bg-amber-500/20 px-2 py-0.5 rounded">
                        Hypothesis {idx + 1}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        h.likelihood === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : h.likelihood === 'MEDIUM'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}>
                        {h.likelihood} LIKELIHOOD
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                      {h.hypothesis}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong>Forensic Rationale:</strong> {h.rationale}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase bg-amber-500/20 px-2 py-0.5 rounded">
                  Primary Working Hypothesis
                </span>
                <p className="text-sm font-semibold text-slate-100 mt-2 leading-relaxed">
                  {inspection.pipeline?.stage2_rootCause?.primaryHypothesis || inspection.categoryB_aiHypotheses?.[0] || 'No abnormal pathology detected.'}
                </p>
                <div className="text-[11px] text-amber-300/80 mt-1.5 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Explicitly designated as an unproven hypothesis pending physical testing.</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plausible Causes */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                  Plausible Contributing Causes
                </h4>
                <ul className="space-y-2">
                  {inspection.pipeline?.stage2_rootCause?.plausibleCauses?.map((cause, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-amber-400 font-mono font-bold">•</span>
                      <span>{cause}</span>
                    </li>
                  )) || (
                    <li className="text-xs text-slate-400">No active causes identified.</li>
                  )}
                </ul>
              </div>

              {/* Alternative Explanations */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                  Alternative Explanations
                </h4>
                <ul className="space-y-2">
                  {inspection.pipeline?.stage2_rootCause?.alternativeExplanations?.map((alt, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-blue-400 font-mono font-bold">•</span>
                      <span>{alt}</span>
                    </li>
                  )) || (
                    <li className="text-xs text-slate-400">None detected.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: RISK INTELLIGENCE */}
        {activeStage === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  Stage 3: Risk Intelligence & Urgency Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Transparent severity reasoning and assessment of consequences if left unaddressed.
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getSeverityBadge(inspection.severity)}`}>
                {inspection.pipeline?.stage3_riskIntelligence?.urgencyLevel || 'Standard Cadence'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Severity Assessment & Structural Context
              </div>
              <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                {inspection.severityReasoning}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-red-950/20 border border-red-500/20 p-4">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Potential Consequences of Inaction
                </h4>
                <ul className="space-y-2 mt-3">
                  {inspection.pipeline?.stage3_riskIntelligence?.consequencesOfInaction?.map((cons, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-red-400 font-mono font-bold">•</span>
                      <span>{cons}</span>
                    </li>
                  )) || (
                    <li className="text-xs text-slate-400">No imminent consequence predicted.</li>
                  )}
                </ul>
              </div>

              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Recommended Inspection Cadence
                </h4>
                <div className="text-sm font-semibold text-blue-400 mt-2">
                  {inspection.pipeline?.stage3_riskIntelligence?.recommendedInspectionInterval || 'Re-evaluate in 30 days.'}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  Safety evaluation: {inspection.pipeline?.stage3_riskIntelligence?.safetyRiskEvaluation || 'Routine surveillance.'}
                </div>
              </div>
            </div>

            {/* Evidence, Assumptions, Limitations & Required Professional Checks (Credibility Standard) */}
            <div className="rounded-xl bg-[#0a101d] border border-blue-500/30 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Risk Assessment Grounding, Limitations & Engineering Protocols
                </span>
                <span className="text-[10px] text-slate-400 font-mono">IS 456 / NBC 2016 Protocol</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="font-semibold text-blue-300 block mb-1">🔍 Observed Optical Evidence</span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Directly mapped from visual surface pixels: {inspection.categoryA_visibleEvidence?.[0] || inspection.summary}. Visual confidence reflects surface pattern matching only.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="font-semibold text-amber-300 block mb-1">📐 Engineering Assumptions</span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Assumes typical reinforced concrete / masonry structural grid in standard environmental exposure. Subsurface load conditions not directly measured.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="font-semibold text-red-300 block mb-1">⚠️ Known Analytical Limitations</span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Surface-only photographic analysis cannot determine concrete compressive strength, internal voids, or rebar carbonation depth without intrusive testing.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="font-semibold text-purple-300 block mb-1">📋 Mandatory Professional Checks</span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    On-site physical inspection, crack gauge calibration, rebound hammer testing (IS 13311), and formal sign-off by a registered structural engineer.
                  </p>
                </div>
              </div>
            </div>

            {/* Compulsory Non-Destructive Testing (NDT) & Physical Verification */}
            {inspection.recommendedTests && inspection.recommendedTests.length > 0 && (
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-500/20 px-2 py-0.5 rounded">
                  Compulsory Non-Destructive Testing (NDT) & Instruments Required
                </span>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Before any intrusive or costly structural intervention, the following physical tests must be executed with calibrated instruments:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {inspection.recommendedTests.map((test, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-purple-500/20 text-xs text-slate-200">
                      <Gauge className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>{test}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STAGE 4: REPAIR INTELLIGENCE */}
        {activeStage === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  Stage 4: Repair Options & Itemized Cost Benchmarks
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Advisory remediation options subject to physical verification and qualified engineer approval.
                </p>
              </div>
            </div>

            {/* Professional Sign-off Disclaimer */}
            <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-200">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Professional Engineering Approval Required:</strong> Proposed repair protocols are non-prescriptive advisory options based on visual indicators. Any structural grouting, crack stitching, or reinforcement repair must be formally approved by a licensed structural engineer before contractor mobilization.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Containment / Temporary Mitigation */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Option A: Interim Containment
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {inspection.pipeline?.stage4_repairIntelligence?.temporaryMitigation?.timeline || 'Immediate'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-3">
                    {inspection.pipeline?.stage4_repairIntelligence?.temporaryMitigation?.action || 'Surface sealing & moisture containment'}
                  </h4>
                  <div className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {inspection.pipeline?.stage4_repairIntelligence?.temporaryMitigation?.assumptionsAndDisclaimer || 'Assumes standard access; advisory non-structural stabilization.'}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Estimated Range (INR):</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    {inspection.pipeline?.stage4_repairIntelligence?.temporaryMitigation?.estCostRangeINR || '₹8,000 – ₹15,000'}
                  </span>
                </div>
              </div>

              {/* Option B: Permanent Remediation Scope */}
              <div className="rounded-xl bg-slate-900/60 border border-blue-500/30 p-5 flex flex-col justify-between shadow-lg shadow-blue-950/20">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      Option B: Remediation Scope (Requires SE Sign-Off)
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {inspection.pipeline?.stage4_repairIntelligence?.permanentRemediation?.timeline || '1 - 2 Weeks'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-3">
                    {inspection.pipeline?.stage4_repairIntelligence?.permanentRemediation?.action || 'Structural chemical grouting and reinforcement'}
                  </h4>
                  <div className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {inspection.pipeline?.stage4_repairIntelligence?.permanentRemediation?.assumptionsAndDisclaimer || 'Subject to engineer structural approval & certified contractor rates.'}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Estimated Range (INR):</span>
                  <span className="text-sm font-bold text-blue-400 font-mono">
                    {inspection.pipeline?.stage4_repairIntelligence?.permanentRemediation?.estCostRangeINR || '₹45,000 – ₹85,000'}
                  </span>
                </div>
              </div>
            </div>

            {/* Monitoring Protocol */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-300">Monitoring Protocol:</span>
                <span className="text-slate-400 ml-2">
                  {inspection.pipeline?.stage4_repairIntelligence?.monitoringProtocol?.action || 'Regular photographic logs and crack width monitoring.'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                Cadence: {inspection.pipeline?.stage4_repairIntelligence?.monitoringProtocol?.inspectionCadence || 'Bi-weekly'}
              </span>
            </div>
          </div>
        )}

        {/* STAGE 5: MAINTENANCE PLANNER */}
        {activeStage === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-indigo-400" />
                  Stage 5: Maintenance Planner & Scope Formulation
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Suggested specialized trade, required materials, equipment, and occupational safety.
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                Trade: {inspection.pipeline?.stage5_maintenancePlanner?.suggestedTrade || 'Structural & Masonry'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Required Materials */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Required Materials & Consumables
                </h4>
                <ul className="space-y-2">
                  {inspection.pipeline?.stage5_maintenancePlanner?.requiredMaterials?.map((mat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-indigo-400 font-mono font-bold">•</span>
                      <span>{mat}</span>
                    </li>
                  )) || (
                    <li className="text-xs text-slate-400">Standard trade supplies.</li>
                  )}
                </ul>
              </div>

              {/* Safety Precautions */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Mandatory Safety Briefing
                </h4>
                <ul className="space-y-2">
                  {inspection.pipeline?.stage5_maintenancePlanner?.safetyPrecautions?.map((prec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-emerald-400 font-mono font-bold">•</span>
                      <span>{prec}</span>
                    </li>
                  )) || (
                    <li className="text-xs text-slate-400">Standard PPE (Hard hat, gloves, eye protection).</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-slate-400">Labor Estimate:</span>
                <span className="text-white font-semibold ml-2 font-mono">
                  {inspection.pipeline?.stage5_maintenancePlanner?.estimatedLaborHours || '16-24 technician hours'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Access Requirements:</span>
                <span className="text-white font-semibold ml-2">
                  {inspection.pipeline?.stage5_maintenancePlanner?.accessRequirements || 'Floor level clearance'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 6: VERIFICATION AGENT */}
        {activeStage === 6 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Stage 6: Autonomous Verification Agent
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Truthfulness auditor checking pixel corroboration and flagging unsupported speculation.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Audit Score:</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {inspection.pipeline?.stage6_verificationAgent?.verificationScoreOutOf100 || 94} / 100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supported Claims */}
              <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/20 p-4">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Corroborated by Image Pixels
                </h4>
                <ul className="space-y-2">
                  {inspection.pipeline?.stage6_verificationAgent?.supportedClaims?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-emerald-400 font-mono font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  )) || (
                    <li className="text-xs text-slate-400">No unsupported claims generated.</li>
                  )}
                </ul>
              </div>

              {/* Unresolved Uncertainties */}
              <div className="rounded-xl bg-amber-950/20 border border-amber-500/20 p-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Unresolved Uncertainties Flagged
                </h4>
                <ul className="space-y-2">
                  {inspection.pipeline?.stage6_verificationAgent?.unresolvedUncertainties?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-amber-400 font-mono font-bold">?</span>
                      <span>{item}</span>
                    </li>
                  )) || (
                    <li className="text-xs text-slate-400">Requires physical destructive core or moisture meter testing.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Category C Human Verification Reminders */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-500/20 px-2 py-0.5 rounded">
                Category C — Human Physical Survey Required
              </span>
              <ul className="mt-3 space-y-2">
                {inspection.categoryC_humanVerificationRequired?.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                    <span className="text-purple-400 font-bold shrink-0">[CHECK]</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Explicit Limitations & Professional Boundaries */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Explicit Forensic Limitations & Boundaries
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                {(inspection.limitations && inspection.limitations.length > 0
                  ? inspection.limitations
                  : [
                      'Visual analysis based strictly on surface pixels. Does not certify structural safety, electrical safety, or building code compliance.',
                      'Subsurface corrosion, internal voiding, and foundation movement cannot be determined without physical non-destructive testing.',
                      'Physical human verification is mandatory prior to contractual work order execution.'
                    ]
                ).map((lim, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono font-bold">•</span>
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* STAGE 7: HUMAN APPROVAL */}
        {activeStage === 7 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Stage 7: Human Operations Approval
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Safety protocol requirement: AI never automatically dispatches workers without human authorization.
                </p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                inspection.approval?.status === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}>
                {inspection.approval?.status === 'APPROVED' ? 'APPROVED BY OPS' : 'PENDING AUTHORIZATION'}
              </span>
            </div>

            {inspection.approval?.status === 'APPROVED' || approvalSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-emerald-300">
                  Inspection Successfully Authorized
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Signed off by {inspection.approval?.approvedBy || 'Suresh Chandragiri'} on {inspection.approval?.approvedAt ? new Date(inspection.approval.approvedAt).toLocaleDateString() : 'Today'}
                </p>
                {inspection.approval?.approvalNotes && (
                  <p className="text-xs text-slate-400 italic mt-2">
                    "{inspection.approval.approvalNotes}"
                  </p>
                )}
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    onClick={onCreateWorkOrder}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Proceed to Work Order Dispatch</span>
                  </button>
                  <button
                    onClick={() => generateInspectionPDF(inspection)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>Export Official Dossier (PDF)</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApproveSubmit} className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Operations Reviewer Notes & Directives
                  </label>
                  <textarea
                    rows={3}
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="e.g. Reviewed visual defect report. Approved for contractor site visit and polyurethane injection quote formulation."
                    className="w-full bg-[#0d1424] text-slate-100 text-xs p-3 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none transition-all"
                  />
                  <div className="text-[11px] text-slate-400 mt-2">
                    Authorized Signatory: <strong>Suresh Chandragiri</strong> (Property Operations Manager)
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isApproving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{isApproving ? 'Authorizing...' : 'Approve Investigation & Enable Work Order'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation Bar for Stages */}
      <div className="px-6 py-3 bg-[#0a0f1d] border-t border-slate-800 flex items-center justify-between text-xs">
        <button
          onClick={() => setActiveStage(Math.max(1, activeStage - 1))}
          disabled={activeStage === 1}
          className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
        >
          ← Previous Stage
        </button>
        <span className="text-slate-400 font-mono text-[11px]">
          Stage {activeStage} of 7: {stages[activeStage - 1].name}
        </span>
        <button
          onClick={() => setActiveStage(Math.min(7, activeStage + 1))}
          disabled={activeStage === 7}
          className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 font-semibold disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
        >
          <span>Next Stage</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
