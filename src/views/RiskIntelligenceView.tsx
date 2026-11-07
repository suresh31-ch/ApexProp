import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  TrendingDown,
  Building,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
  ArrowUpDown,
  Filter,
  Search,
  Eye,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertOctagon,
  Activity,
  History,
  Info
} from 'lucide-react';
import { InspectionRecord, OverallRiskCategory } from '../types';
import { supabase } from '../services/supabaseClient';

interface RiskIntelligenceViewProps {
  inspections: InspectionRecord[];
  onSelectInspection: (inspection: InspectionRecord) => void;
}

export const RiskIntelligenceView: React.FC<RiskIntelligenceViewProps> = ({
  inspections,
  onSelectInspection
}) => {
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'PRIORITY' | 'SEVERITY' | 'DATE'>('PRIORITY');
  const [search, setSearch] = useState('');
  const [selectedInspectionForMatrix, setSelectedInspectionForMatrix] = useState<InspectionRecord | null>(null);

  // Auto-select first inspection with defect for matrix preview
  useEffect(() => {
    if (!selectedInspectionForMatrix && inspections.length > 0) {
      const defectItem = inspections.find(i => i.isDefectIdentified || i.severity !== 'NONE') || inspections[0];
      setSelectedInspectionForMatrix(defectItem);
    }
  }, [inspections]);

  // Multi-dimensional counts
  const criticalCount = inspections.filter(i => i.multiDimensionalRisk?.overallRiskCategory === 'Critical' || i.severity === 'CRITICAL').length;
  const highCount = inspections.filter(i => i.multiDimensionalRisk?.overallRiskCategory === 'High' || i.severity === 'HIGH').length;
  const moderateCount = inspections.filter(i => i.multiDimensionalRisk?.overallRiskCategory === 'Moderate' || i.severity === 'MEDIUM').length;
  const lowCount = inspections.filter(i => i.multiDimensionalRisk?.overallRiskCategory === 'Low' || (i.severity === 'LOW' && i.multiDimensionalRisk?.overallRiskCategory !== 'Insufficient Evidence')).length;
  const insufficientCount = inspections.filter(i => i.multiDimensionalRisk?.overallRiskCategory === 'Insufficient Evidence' || i.overallInspectionStatus === 'INCONCLUSIVE').length;

  // Active safety escalations
  const safetyEscalations = inspections.filter(i => i.safetyEscalation?.isEscalated);

  // Prioritization Queue ranking logic
  const prioritizedItems = inspections
    .map((insp) => {
      const risk = insp.multiDimensionalRisk;
      const isSafetyEscalated = !!insp.safetyEscalation?.isEscalated;
      const consequence = risk?.consequenceSeverity?.rating || insp.severity || 'LOW';
      const det = risk?.deteriorationLikelihood?.rating || 'STABLE';
      const exposure = risk?.occupantExposure?.level || 'OCCASIONAL';
      const isUnresolved = insp.approval?.status !== 'APPROVED';

      let score = 0;
      if (isSafetyEscalated) score += 1000;
      if (consequence === 'CRITICAL') score += 500;
      else if (consequence === 'HIGH') score += 300;
      else if (consequence === 'MODERATE' || consequence === 'MEDIUM') score += 150;
      else score += 50;

      if (det === 'RAPID') score += 200;
      else if (det === 'PROGRESSIVE') score += 100;

      if (exposure === 'DIRECT_FREQUENT') score += 150;
      else if (exposure === 'OCCASIONAL') score += 75;

      if (isUnresolved) score += 60;

      let reason = '';
      if (isSafetyEscalated) {
        reason = `Rank #1 Tier: Immediate safety escalation active. Falling debris or structural shear threat in ${insp.floorOrRoom}. Cordon and immediate survey mandated.`;
      } else if (consequence === 'CRITICAL' || consequence === 'HIGH') {
        reason = `High Consequence: ${insp.defectCategory} in ${insp.floorOrRoom} exhibits ${det.toLowerCase()} deterioration velocity and ${exposure.toLowerCase().replace('_', ' ')} exposure.`;
      } else if (insp.isDefectIdentified) {
        reason = `Moderate Consequence: Localized ${insp.defectCategory.toLowerCase()} with manageable deterioration rate under routine maintenance monitoring.`;
      } else {
        reason = `Baseline Non-Defect: Pristine surface with sound structural integrity.`;
      }

      return {
        inspection: insp,
        score,
        reason,
        consequence,
        det,
        exposure,
        isUnresolved,
        isSafetyEscalated,
        overallCategory: risk?.overallRiskCategory || (consequence === 'CRITICAL' ? 'Critical' : consequence === 'HIGH' ? 'High' : consequence === 'MEDIUM' ? 'Moderate' : 'Low')
      };
    })
    .filter((item) => {
      const insp = item.inspection;
      const matchesSearch =
        insp.propertyName.toLowerCase().includes(search.toLowerCase()) ||
        insp.location.toLowerCase().includes(search.toLowerCase()) ||
        insp.defectCategory.toLowerCase().includes(search.toLowerCase()) ||
        insp.summary.toLowerCase().includes(search.toLowerCase());

      const matchesCat =
        selectedRiskCategory === 'ALL' || item.overallCategory === selectedRiskCategory;

      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (sortBy === 'PRIORITY') return b.score - a.score;
      if (sortBy === 'SEVERITY') {
        const order: Record<string, number> = { CRITICAL: 4, HIGH: 3, MODERATE: 2, MEDIUM: 2, LOW: 1, NONE: 0 };
        return (order[b.consequence] || 0) - (order[a.consequence] || 0);
      }
      return new Date(b.inspection.createdAt).getTime() - new Date(a.inspection.createdAt).getTime();
    });

  // Property Trend Grouping
  const propertyGroups: Record<string, InspectionRecord[]> = {};
  inspections.forEach((insp) => {
    const key = insp.propertyId || insp.propertyName || 'Default';
    if (!propertyGroups[key]) propertyGroups[key] = [];
    propertyGroups[key].push(insp);
  });

  const getRiskColor = (cat: string) => {
    switch (cat) {
      case 'Critical':
        return 'text-red-400 bg-red-500/15 border-red-500/30';
      case 'High':
        return 'text-orange-400 bg-orange-500/15 border-orange-500/30';
      case 'Moderate':
        return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
      case 'Insufficient Evidence':
        return 'text-zinc-400 bg-zinc-500/15 border-zinc-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Evidence-Grounded Risk Intelligence
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Multi-dimensional risk assessment, portfolio prioritization queue & multi-temporal degradation trends.
          </p>
        </div>
      </div>

      {/* Safety Escalation Alert Banner */}
      {safetyEscalations.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-600/50 shadow-xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-red-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Safety Escalation Active ({safetyEscalations.length} Immediate Hazard{safetyEscalations.length > 1 ? 's' : ''})</span>
                </h3>
                <p className="text-xs text-red-300/90 mt-1 leading-relaxed">
                  Severe structural defect or active life-safety exposure detected. Mandatory 3-meter cordon perimeter and licensed structural engineer audit required.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950 px-2.5 py-1 rounded-lg border border-red-800/80 uppercase">
              Action Mandated
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-red-900/50">
            {safetyEscalations.map((esc) => (
              <div
                key={esc.id}
                onClick={() => setSelectedInspectionForMatrix(esc)}
                className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-between gap-3 cursor-pointer hover:border-red-600 transition-all"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{esc.propertyName}</div>
                  <div className="text-[11px] text-red-300 truncate">{esc.floorOrRoom} • {esc.defectCategory}</div>
                </div>
                <button className="text-[11px] font-bold text-red-300 bg-red-900/50 hover:bg-red-900 px-2.5 py-1 rounded-lg border border-red-700/60 flex items-center gap-1">
                  <span>View</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transparent Risk Distribution Cards (No arbitrary fake numbers) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setSelectedRiskCategory('Critical')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedRiskCategory === 'Critical'
              ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/30'
              : 'bg-[#101726] border-red-500/30 hover:border-red-500/60'
          }`}
        >
          <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Critical Risk</div>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">{criticalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mandatory 24h survey</div>
        </div>

        <div
          onClick={() => setSelectedRiskCategory('High')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedRiskCategory === 'High'
              ? 'bg-orange-950/40 border-orange-500 ring-2 ring-orange-500/30'
              : 'bg-[#101726] border-orange-500/30 hover:border-orange-500/60'
          }`}
        >
          <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">High Risk</div>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">{highCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Physical audit within 48h</div>
        </div>

        <div
          onClick={() => setSelectedRiskCategory('Moderate')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedRiskCategory === 'Moderate'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-[#101726] border-amber-500/30 hover:border-amber-500/60'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Moderate Risk</div>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">{moderateCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Scheduled within 14d</div>
        </div>

        <div
          onClick={() => setSelectedRiskCategory('Low')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedRiskCategory === 'Low'
              ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-[#101726] border-emerald-500/30 hover:border-emerald-500/60'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Low / Baseline</div>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">{lowCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Routine quarterly cycle</div>
        </div>

        <div
          onClick={() => setSelectedRiskCategory('Insufficient Evidence')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedRiskCategory === 'Insufficient Evidence'
              ? 'bg-zinc-900 border-zinc-400 ring-2 ring-zinc-400/30'
              : 'bg-[#101726] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Insufficient Evid.</div>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">{insufficientCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Obscured / blurry image</div>
        </div>
      </div>

      {/* Main Grid: Left Prioritization Queue | Right 6-Dimension Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Portfolio Prioritization Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-[#101726] border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Portfolio Prioritization Queue
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ordered by composite risk: consequence, deterioration velocity, occupant traffic & unresolved status.
                </p>
              </div>

              {/* Sorting Buttons */}
              <div className="flex items-center gap-1 self-start sm:self-auto text-xs bg-[#0b1220] p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setSortBy('PRIORITY')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    sortBy === 'PRIORITY' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Priority
                </button>
                <button
                  onClick={() => setSortBy('SEVERITY')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    sortBy === 'SEVERITY' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Consequence
                </button>
                <button
                  onClick={() => setSortBy('DATE')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    sortBy === 'DATE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Date
                </button>
              </div>
            </div>

            {/* Filter Search & Category Reset */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by property, area, or defect type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0b1220] text-slate-200 placeholder:text-slate-500 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {selectedRiskCategory !== 'ALL' && (
                <button
                  onClick={() => setSelectedRiskCategory('ALL')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all"
                >
                  Show All ({inspections.length})
                </button>
              )}
            </div>
          </div>

          {/* Prioritized List Cards */}
          <div className="space-y-3">
            {prioritizedItems.length === 0 ? (
              <div className="p-8 text-center bg-[#101726] rounded-2xl border border-slate-800">
                <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-300 font-semibold">No assets found matching the selected risk filters.</p>
              </div>
            ) : (
              prioritizedItems.map((item, idx) => {
                const insp = item.inspection;
                const isSelected = selectedInspectionForMatrix?.id === insp.id;

                return (
                  <div
                    key={insp.id}
                    onClick={() => setSelectedInspectionForMatrix(insp)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#131d36] border-blue-500 ring-2 ring-blue-500/20 shadow-xl'
                        : 'bg-[#101726] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Rank Badge */}
                        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center font-mono shrink-0">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">#</span>
                          <span className="text-xs font-extrabold text-blue-400 leading-none">{idx + 1}</span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRiskColor(item.overallCategory)}`}>
                              {item.overallCategory}
                            </span>
                            {item.isSafetyEscalated && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                CORDON
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-slate-400">{insp.id}</span>
                          </div>

                          <h4 className="text-sm font-bold text-white mt-1 truncate">
                            {insp.propertyName}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {insp.location} • {insp.floorOrRoom} • <strong className="text-slate-300 font-semibold">{insp.defectCategory}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {new Date(insp.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectInspection(insp);
                          }}
                          className="mt-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 ml-auto"
                        >
                          <span>Open Dossier</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Qualitative Prioritization Rationale */}
                    <div className="mt-3 p-2.5 rounded-xl bg-[#0b1220] border border-slate-800/80 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{item.reason}</span>
                    </div>

                    {/* Dimension Mini-Pills */}
                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[10px]">
                      <div>
                        <span className="text-slate-500 block">Consequence:</span>
                        <strong className="text-slate-300">{item.consequence}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Deterioration:</span>
                        <strong className="text-slate-300">{item.det}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Exposure:</span>
                        <strong className="text-slate-300">{item.exposure.replace('_', ' ')}</strong>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Multi-Dimensional Risk Matrix & Trends (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Selected Item 6-Dimension Breakdown */}
          {selectedInspectionForMatrix ? (
            <div className="p-5 rounded-2xl bg-[#101726] border border-slate-800 space-y-4">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                    Risk Breakdown Matrix
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    {selectedInspectionForMatrix.propertyName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedInspectionForMatrix.floorOrRoom} • {selectedInspectionForMatrix.defectCategory}
                  </p>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getRiskColor(selectedInspectionForMatrix.multiDimensionalRisk?.overallRiskCategory || selectedInspectionForMatrix.severity)}`}>
                  {selectedInspectionForMatrix.multiDimensionalRisk?.overallRiskCategory || selectedInspectionForMatrix.severity}
                </span>
              </div>

              {/* 6 Dimensions Grid */}
              <div className="space-y-2.5 text-xs">
                
                {/* 1. Consequence Severity */}
                <div className="p-3 rounded-xl bg-[#0b1220] border border-slate-800">
                  <div className="flex items-center justify-between font-bold text-slate-300 mb-0.5">
                    <span>1. Consequence Severity</span>
                    <span className="text-red-400 font-mono">
                      {selectedInspectionForMatrix.multiDimensionalRisk?.consequenceSeverity?.rating || selectedInspectionForMatrix.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedInspectionForMatrix.multiDimensionalRisk?.consequenceSeverity?.assessment || selectedInspectionForMatrix.severityReasoning}
                  </p>
                </div>

                {/* 2. Deterioration Velocity */}
                <div className="p-3 rounded-xl bg-[#0b1220] border border-slate-800">
                  <div className="flex items-center justify-between font-bold text-slate-300 mb-0.5">
                    <span>2. Deterioration Likelihood</span>
                    <span className="text-amber-400 font-mono">
                      {selectedInspectionForMatrix.multiDimensionalRisk?.deteriorationLikelihood?.rating || 'PROGRESSIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedInspectionForMatrix.multiDimensionalRisk?.deteriorationLikelihood?.rationale || 'Gradual propagation along thermal or structural boundaries.'}
                  </p>
                </div>

                {/* 3. Occupant Exposure */}
                <div className="p-3 rounded-xl bg-[#0b1220] border border-slate-800">
                  <div className="flex items-center justify-between font-bold text-slate-300 mb-0.5">
                    <span>3. Occupant Exposure</span>
                    <span className="text-blue-400 font-mono">
                      {(selectedInspectionForMatrix.multiDimensionalRisk?.occupantExposure?.level || 'OCCASIONAL').replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedInspectionForMatrix.multiDimensionalRisk?.occupantExposure?.description || `Inspected in ${selectedInspectionForMatrix.floorOrRoom}.`}
                  </p>
                </div>

                {/* 4. Potential Damage Extent */}
                <div className="p-3 rounded-xl bg-[#0b1220] border border-slate-800">
                  <div className="flex items-center justify-between font-bold text-slate-300 mb-0.5">
                    <span>4. Potential Damage Extent</span>
                    <span className="text-orange-400 font-mono">
                      {(selectedInspectionForMatrix.multiDimensionalRisk?.potentialDamageExtent?.scope || 'LOCALIZED_STRUCTURAL').replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedInspectionForMatrix.multiDimensionalRisk?.potentialDamageExtent?.projectedImpact || 'Localized structural distress requiring specialized remediation.'}
                  </p>
                </div>

                {/* 5. Urgency of Investigation */}
                <div className="p-3 rounded-xl bg-[#0b1220] border border-slate-800">
                  <div className="flex items-center justify-between font-bold text-slate-300 mb-0.5">
                    <span>5. Investigation Urgency</span>
                    <span className="text-white font-mono">
                      {selectedInspectionForMatrix.multiDimensionalRisk?.investigationUrgency?.level || 'Scheduled (1-2 weeks)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedInspectionForMatrix.multiDimensionalRisk?.investigationUrgency?.timeframeExplanation || 'Routine engineering validation.'}
                  </p>
                </div>

                {/* 6. Confidence & Limitations */}
                <div className="p-3 rounded-xl bg-[#0b1220] border border-slate-800">
                  <div className="flex items-center justify-between font-bold text-slate-300 mb-0.5">
                    <span>6. Confidence & Limitations</span>
                    <span className="text-emerald-400 font-mono">
                      {selectedInspectionForMatrix.multiDimensionalRisk?.confidenceAndLimitations?.confidenceLevel || 'High'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Surface pixels evaluated. Physical ultrasonic or core tests mandated before load-bearing sign-off.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSelectInspection(selectedInspectionForMatrix)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-600/30"
              >
                <span>View Full Investigation Dossier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {/* Multi-Temporal Property Risk Trends with Honest Empty States */}
          <div className="p-5 rounded-2xl bg-[#101726] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-400" />
                  Historical Risk Trends
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tracking recurring dampness, repeated defects & failing prior repairs across survey cycles.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(propertyGroups).map(([propKey, propInsps]) => {
                const propName = propInsps[0]?.propertyName || propKey;
                const totalInspections = propInsps.length;
                const hasSufficientData = totalInspections >= 2;

                // Category recurrence
                const catCount: Record<string, number> = {};
                propInsps.forEach(i => {
                  if (i.defectCategory && i.defectCategory !== 'None / Normal Condition') {
                    catCount[i.defectCategory] = (catCount[i.defectCategory] || 0) + 1;
                  }
                });

                const recurringCategories = Object.entries(catCount).filter(([_, count]) => count >= 2);

                return (
                  <div key={propKey} className="p-3.5 rounded-xl bg-[#0b1220] border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-white font-bold">{propName}</strong>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {totalInspections} Survey{totalInspections > 1 ? 's' : ''}
                      </span>
                    </div>

                    {!hasSufficientData ? (
                      // Honest Empty State
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>Baseline survey recorded. Minimum 2 historical inspection cycles required for multi-temporal degradation trend tracking.</span>
                      </div>
                    ) : recurringCategories.length > 0 ? (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider block">
                          Repeated Defect Alerts:
                        </span>
                        {recurringCategories.map(([cat, count]) => (
                          <div key={cat} className="p-2 rounded bg-red-950/20 border border-red-900/40 text-[11px] text-red-300 flex items-center justify-between">
                            <span>{cat}</span>
                            <span className="font-mono font-bold text-red-400">{count}x recurring</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" />
                        No repeated defects across {totalInspections} survey cycles.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
