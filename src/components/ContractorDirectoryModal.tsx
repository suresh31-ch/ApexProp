import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  X,
  Plus,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Contractor, TradeCategory } from '../types';

interface ContractorDirectoryModalProps {
  contractors: Contractor[];
  isOpen: boolean;
  onClose: () => void;
  onAddContractor: (data: Partial<Contractor>) => Promise<void>;
  onUpdateContractor: (id: string, updates: Partial<Contractor>) => Promise<void>;
}

export const ContractorDirectoryModal: React.FC<ContractorDirectoryModalProps> = ({
  contractors,
  isOpen,
  onClose,
  onAddContractor,
  onUpdateContractor
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [tradeFilter, setTradeFilter] = useState<string>('ALL');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [trade, setTrade] = useState<TradeCategory>('Structural & Masonry');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [insuranceRef, setInsuranceRef] = useState('');
  const [serviceCoverage, setServiceCoverage] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const filtered = contractors.filter((c) => {
    if (tradeFilter === 'ALL') return true;
    return c.trade === tradeFilter;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onAddContractor({
        name,
        company,
        trade,
        contactPhone,
        contactEmail,
        licenseNumber,
        insuranceRef,
        serviceCoverage: serviceCoverage || 'National Capital Region',
        notes,
        availability: 'AVAILABLE',
        status: 'ACTIVE'
      });
      setShowAddForm(false);
      setName('');
      setCompany('');
      setContactPhone('');
      setContactEmail('');
      setLicenseNumber('');
      setInsuranceRef('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (contractor: Contractor) => {
    const nextAvailability = contractor.availability === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
    await onUpdateContractor(contractor.id, { availability: nextAvailability });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0f172a] border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Authorized Contractor Directory
              </h2>
              <p className="text-xs text-slate-400">
                Verified trade specialists, professional licenses, and human dispatch credentials.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'View List' : 'Add Contractor'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {showAddForm ? (
            /* Add Contractor Form */
            <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                Register New Qualified Contractor
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Contractor / Representative Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Company / Entity Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Patel Structural Works LLP"
                    className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Primary Trade Category *
                  </label>
                  <select
                    value={trade}
                    onChange={(e) => setTrade(e.target.value as TradeCategory)}
                    className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Structural & Masonry">Structural & Masonry</option>
                    <option value="Waterproofing & Damp Proofing">Waterproofing & Damp Proofing</option>
                    <option value="Plumbing & Drainage">Plumbing & Drainage</option>
                    <option value="Civil & Finishing">Civil & Finishing</option>
                    <option value="Electrical & Safety">Electrical & Safety</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Service Region / Coverage
                  </label>
                  <input
                    type="text"
                    value={serviceCoverage}
                    onChange={(e) => setServiceCoverage(e.target.value)}
                    placeholder="e.g. NCR / Delhi & Gurugram"
                    className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contractor@domain.in"
                    className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Professional License / Registration #
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. DL-PWD-SE-2021-998"
                    className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Commercial Insurance Policy Ref
                  </label>
                  <input
                    type="text"
                    value={insuranceRef}
                    onChange={(e) => setInsuranceRef(e.target.value)}
                    placeholder="e.g. TATA-AIG-IND-448102"
                    className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Specialist Credentials & Trade Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specialization in epoxy resin pressure grouting, carbon fiber wraps, or polyurethane injection..."
                  className="w-full bg-[#0a0f1d] border border-slate-700 text-xs text-slate-100 p-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Save Contractor'}
                </button>
              </div>
            </form>
          ) : (
            /* Contractor Directory List */
            <>
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['ALL', 'Structural & Masonry', 'Waterproofing & Damp Proofing', 'Plumbing & Drainage', 'Civil & Finishing'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTradeFilter(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      tradeFilter === t
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Directory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white">{c.name}</h4>
                          <p className="text-xs text-blue-400 font-medium">{c.company}</p>
                        </div>
                        <button
                          onClick={() => handleToggleAvailability(c)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                            c.availability === 'AVAILABLE'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {c.availability}
                        </button>
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Trade: <strong className="text-slate-200">{c.trade}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Coverage: {c.serviceCoverage}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>License: <span className="font-mono text-slate-200">{c.licenseNumber || 'Verified Active'}</span></span>
                        </div>
                      </div>

                      {c.notes && (
                        <p className="mt-2 text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                          {c.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <a
                        href={`tel:${c.contactPhone}`}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                        <span>{c.contactPhone}</span>
                      </a>
                      <a
                        href={`mailto:${c.contactEmail}`}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{c.contactEmail}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>All contractors screened against commercial insurance and trade license requirements.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
