import React, { useState } from 'react';
import { Sparkles, Scan, FileSearch, ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { InspectionUploader } from '../components/InspectionUploader';
import { PipelineStageViewer } from '../components/PipelineStageViewer';
import { InspectionRecord } from '../types';

interface InspectViewProps {
  onInspectionCreated: (inspection: InspectionRecord) => void;
  onApproveInspection: (id: string, notes: string) => Promise<void>;
  onCreateWorkOrder: (inspection: InspectionRecord) => void;
  initialInspection?: InspectionRecord | null;
}

export const InspectView: React.FC<InspectViewProps> = ({
  onInspectionCreated,
  onApproveInspection,
  onCreateWorkOrder,
  initialInspection = null
}) => {
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(initialInspection);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Scan className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Autonomous Property Inspection Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Multimodal Gemini 3.8 Flash visual investigation, pixel evidence isolation & risk quantification.
          </p>
        </div>

        {selectedInspection && (
          <button
            onClick={() => setSelectedInspection(null)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 self-start"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Upload Another Asset</span>
          </button>
        )}
      </div>

      {/* Main Inspection Interface */}
      {selectedInspection ? (
        <PipelineStageViewer
          inspection={selectedInspection}
          onApprove={(notes) => onApproveInspection(selectedInspection.id, notes)}
          onCreateWorkOrder={() => onCreateWorkOrder(selectedInspection)}
          onClose={() => setSelectedInspection(null)}
        />
      ) : (
        <div className="space-y-6">
          <InspectionUploader
            onInspectionComplete={(record) => {
              onInspectionCreated(record);
              setSelectedInspection(record);
            }}
          />

          {/* Forensic Protocol Explanatory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/20">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2 font-bold text-xs">
                A
              </div>
              <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                Direct Visible Evidence
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Extracts only unambiguous physical pixels (color shift, fissure geometry, crystalline efflorescence). Never fabricates absent damage.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/20">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 font-bold text-xs">
                B
              </div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                AI Hypotheses Isolation
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Plausible root causes and environmental dynamics are strictly framed as hypotheses, never presented as established facts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/20">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2 font-bold text-xs">
                C
              </div>
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                Human & Engineering Verification
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Flags compulsory on-site physical tests (moisture mapping, UPV testing, structural engineer review). Requires human dispatch approval.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
