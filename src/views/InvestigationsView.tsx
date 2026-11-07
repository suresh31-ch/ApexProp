import React, { useState } from 'react';
import {
  Search,
  Filter,
  FileSearch,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Layers,
  Wrench,
  ShieldAlert,
  HelpCircle,
  Compass,
  Check,
  UserCheck
} from 'lucide-react';
import { InspectionRecord, InvestigationOutcome } from '../types';
import { InvestigationDossierModal } from '../components/InvestigationDossierModal';
import { generateInspectionPDF } from '../utils/pdfGenerator';

interface InvestigationsViewProps {
  inspections: InspectionRecord[];
  onApproveInspection: (id: string, notes: string) => Promise<void>;
  onCreateWorkOrder: (inspection: InspectionRecord) => void;
  onNavigateToInspect: () => void;
  onUpdateInspection?: (updated: InspectionRecord) => void;
}

export const InvestigationsView: React.FC<InvestigationsViewProps> = ({
  inspections,
  onApproveInspection,
  onCreateWorkOrder,
  onNavigateToInspect,
  onUpdateInspection
}) => {
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);

  const filtered = inspections.filter((i) => {
    const matchesSearch =
      i.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      i.location.toLowerCase().includes(search.toLowerCase()) ||
      i.defectCategory.toLowerCase().includes(search.toLowerCase()) ||
      i.summary.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || i.severity === severityFilter;
    const currentOutcome = i.investigationOutcome || (i.isDefectIdentified ? 'INVESTIGATION_REQUIRED' : 'COMPLETED_WITH_LIMITATIONS');
    const matchesOutcome = outcomeFilter === 'ALL' || currentOutcome === outcomeFilter;

    return matchesSearch && matchesSeverity && matchesOutcome;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  const getOutcomeBadge = (outcome?: string) => {
    switch (outcome) {
      case 'CAUSE_SUPPORTED_BY_EVIDENCE':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'MULTIPLE_PLAUSIBLE_CAUSES':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'PROFESSIONAL_ASSESSMENT_REQUIRED':
        return 'bg-red-500/15 text-red-300 border-red-500/30';
      case 'EVIDENCE_INSUFFICIENT':
        return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
      case 'COMPLETED_WITH_LIMITATIONS':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/25';
    }
  };

  const handleUpdate = (updated: InspectionRecord) => {
    setSelectedInspection(updated);
    if (onUpdateInspection) {
      onUpdateInspection(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Root-Cause Property Investigations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Forensic defect pathology, multi-hypothesis correlation, property manager follow-ups & professional sign-offs.
          </p>
        </div>

        <button
          onClick={onNavigateToInspect}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 self-start sm:self-auto transition-all"
        >
          <span>+ New Inspection</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-[#101726] p-3.5 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search property, element, or defect category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0d1424] text-slate-100 placeholder:text-slate-400 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Severity Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  severityFilter === sev
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Outcome Filter Segmented Bar */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 overflow-x-auto text-xs">
          <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap mr-1">
            Outcome Status:
          </span>
          {[
            { id: 'ALL', label: 'All Outcomes' },
            { id: 'CAUSE_SUPPORTED_BY_EVIDENCE', label: 'Evidence Supported' },
            { id: 'MULTIPLE_PLAUSIBLE_CAUSES', label: 'Multiple Causes' },
            { id: 'PROFESSIONAL_ASSESSMENT_REQUIRED', label: 'Structural Audit Required' },
            { id: 'EVIDENCE_INSUFFICIENT', label: 'Evidence Insufficient' },
            { id: 'INVESTIGATION_REQUIRED', label: 'Investigation Required' }
          ].map(out => (
            <button
              key={out.id}
              onClick={() => setOutcomeFilter(out.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                outcomeFilter === out.id
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              {out.label}
            </button>
          ))}
        </div>
      </div>

      {/* Investigation Dossier Modal */}
      {selectedInspection && (
        <InvestigationDossierModal
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
          onUpdateInspection={handleUpdate}
          onCreateWorkOrder={onCreateWorkOrder}
        />
      )}

      {/* Investigations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const outcome = item.investigationOutcome || (item.isDefectIdentified ? 'INVESTIGATION_REQUIRED' : 'COMPLETED_WITH_LIMITATIONS');
          const hypothesesCount = item.investigationHypotheses?.length || item.rootCauseHypothesesList?.length || 0;
          const questionsCount = item.investigationQuestions?.length || 0;
          const answeredQuestions = item.investigationQuestions?.filter(q => q.answered).length || 0;
          const isSafetyEscalated = !!item.safetyEscalation?.isEscalated;
          const isVerified = (item.humanReviews && item.humanReviews.length > 0) || item.approval?.status === 'APPROVED';

          return (
            <div
              key={item.id}
              className={`rounded-2xl bg-[#101726]/90 border p-4 shadow-xl flex flex-col justify-between transition-all group hover:shadow-2xl hover:shadow-blue-950/20 ${
                isSafetyEscalated
                  ? 'border-red-500/40 hover:border-red-500/70'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Image Preview & Status Badges */}
                <div className="relative h-44 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900 mb-3">
                  <img
                    src={item.imageUrl}
                    alt={item.propertyName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                  />
                  
                  {/* Top-Left: Severity & Escalation */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${getSeverityBadge(item.severity)}`}>
                        {item.severity}
                      </span>
                      {isSafetyEscalated && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white border border-red-400 flex items-center gap-1 shadow-md">
                          <ShieldAlert className="w-3 h-3" />
                          HAZARD
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Top-Right: Human Sign-Off Status */}
                  <div className="absolute top-2 right-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md border flex items-center gap-1 ${
                      isVerified
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {isVerified ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>HUMAN VERIFIED</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>PENDING SIGN-OFF</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Bottom Strip: Outcome Status */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className={`text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md border truncate ${getOutcomeBadge(outcome)}`}>
                      {outcome.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                {/* Title & Location */}
                <div className="flex items-center justify-between text-[11px] font-mono text-blue-400">
                  <span>{item.id}</span>
                  <span className="text-slate-400 font-sans">{item.defectCategory}</span>
                </div>

                <h3 className="text-sm font-bold text-white mt-0.5 truncate group-hover:text-blue-300 transition-colors">
                  {item.propertyName}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {item.location} • {item.floorOrRoom}
                </p>

                {/* Summary Snippet */}
                <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                  {item.summary}
                </p>

                {/* Investigation Diagnostics Badges */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                  <div className="p-2 rounded-xl bg-[#0b1220] border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Hypotheses</span>
                    <strong className="text-slate-200 font-semibold">{hypothesesCount} Mechanisms</strong>
                  </div>

                  <div className="p-2 rounded-xl bg-[#0b1220] border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Manager Q&A</span>
                    <strong className={answeredQuestions > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                      {answeredQuestions}/{questionsCount} Answered
                    </strong>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => generateInspectionPDF(item)}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-all"
                  title="Download Forensic PDF"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px]">PDF</span>
                </button>

                <button
                  onClick={() => setSelectedInspection(item)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <span>Open Dossier</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 rounded-2xl bg-[#101726] border border-slate-800">
          <FileSearch className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-300">No investigations match your filters</h4>
          <p className="text-xs text-slate-400 mt-1">Try resetting the outcome or severity criteria, or start a new inspection.</p>
        </div>
      )}
    </div>
  );
};
