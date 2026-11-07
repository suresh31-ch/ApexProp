import React, { useState } from 'react';
import { Wrench, X, Check, Building, MapPin, Calendar, DollarSign, Layers } from 'lucide-react';
import { TradeCategory, WorkOrder, InspectionRecord } from '../types';

interface CreateWorkOrderModalProps {
  inspection?: InspectionRecord | null;
  onClose: () => void;
  onSubmit: (data: Partial<WorkOrder>) => Promise<void>;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  inspection,
  onClose,
  onSubmit
}) => {
  const [propertyName, setPropertyName] = useState(inspection?.propertyName || 'Riverside Towers');
  const [location, setLocation] = useState(inspection?.location || 'Sector 42, Gurgaon');
  const [title, setTitle] = useState(
    inspection
      ? `${inspection.pipeline?.stage5_maintenancePlanner?.suggestedTrade || 'Maintenance'} for ${inspection.floorOrRoom}`
      : 'Structural Masonry Remediation'
  );
  const [trade, setTrade] = useState<TradeCategory>(
    inspection?.pipeline?.stage5_maintenancePlanner?.suggestedTrade || 'Structural & Masonry'
  );
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>(
    (inspection?.severity === 'CRITICAL' || inspection?.severity === 'HIGH' || inspection?.severity === 'MEDIUM')
      ? inspection.severity
      : 'MEDIUM'
  );
  const [assignedTo, setAssignedTo] = useState('Premier Property Engineering Ltd.');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [estimatedCostINR, setEstimatedCostINR] = useState(
    inspection?.pipeline?.stage4_repairIntelligence?.permanentRemediation?.estCostRangeINR || '₹45,000 – ₹70,000'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const budgetNum = Number(estimatedCostINR.replace(/[^0-9.]/g, '')) || 25000;
      await onSubmit({
        inspectionId: inspection?.id,
        propertyName,
        location,
        title,
        trade,
        priority,
        status: 'AWAITING_APPROVAL',
        assignedTo,
        scheduledDate,
        dueDate,
        approvedBudgetINR: budgetNum,
        actualCostINR: 0,
        progressPercent: 0,
        estimatedCostINR,
        materialsRequired: inspection?.pipeline?.stage5_maintenancePlanner?.requiredMaterials || ['Specialist repair compounds'],
        safetyBriefing: inspection?.pipeline?.stage5_maintenancePlanner?.safetyPrecautions || ['Standard site PPE']
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#101728] border border-slate-700 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-white">Create Maintenance Work Order</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Dispatch contractor with defined scope of work and required safety briefing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Work Order Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0d1424] text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Property Name</label>
              <input
                type="text"
                required
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                className="w-full bg-[#0d1424] text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Location / Zone</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#0d1424] text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Specialized Trade</label>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value as TradeCategory)}
                className="w-full bg-[#0d1424] text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="Structural & Masonry">Structural & Masonry</option>
                <option value="Waterproofing & Damp Proofing">Waterproofing & Damp</option>
                <option value="Plumbing & Drainage">Plumbing & Drainage</option>
                <option value="Façade & Cladding">Façade & Cladding</option>
                <option value="Roofing & Guttering">Roofing & Guttering</option>
                <option value="Electrical & Systems">Electrical & Systems</option>
                <option value="Civil Inspection / Geotechnical">Civil Inspection</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#0d1424] text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="CRITICAL">Critical (24h)</option>
                <option value="HIGH">High (48h)</option>
                <option value="MEDIUM">Medium (1-2 weeks)</option>
                <option value="LOW">Low (Routine)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Assigned Team / Contractor</label>
              <input
                type="text"
                required
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-[#0d1424] text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Estimated Cost (INR)</label>
              <input
                type="text"
                required
                value={estimatedCostINR}
                onChange={(e) => setEstimatedCostINR(e.target.value)}
                className="w-full bg-[#0d1424] text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-[#0d1424] text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#0d1424] text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Creating...' : 'Authorize & Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
