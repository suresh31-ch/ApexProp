import React, { useState } from 'react';
import {
  User,
  Building2,
  Bell,
  Sliders,
  Shield,
  Info,
  Save,
  CheckCircle2,
  Lock,
  LogOut,
  Mail,
  Phone,
  Award,
  Globe,
  FileCheck2,
  ShieldAlert,
  Flame,
  Wrench,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SettingsViewProps {
  settings: any;
  onSaveSettings: (settings: any) => Promise<void>;
  onOpenAuthModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onOpenAuthModal
}) => {
  const { user, profile, signOut, resetPassword } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'organization' | 'notifications' | 'inspection' | 'security' | 'info'
  >('profile');

  // Form State
  const [formData, setFormData] = useState({
    inspectorName: settings?.inspectorName || profile?.fullName || 'Suresh Chandragiri',
    inspectorTitle: settings?.inspectorTitle || profile?.role || 'Property Operations Manager',
    licenseNumber: settings?.licenseNumber || 'RICS-IN-84210',
    contactEmail: settings?.alertEmail || user?.email || 'manager@apexprop.ai',
    contactPhone: settings?.emergencyHotline || '+91 98765 43210',
    signatureText: settings?.signatureText || 'Suresh Chandragiri, BOMA / RICS Cert.',

    organizationName: settings?.organizationName || profile?.organization || 'ApexProp Assets Group',
    officeAddress: settings?.officeAddress || 'Cyber City Tower B, Sector 24, Gurgaon, India',
    emergencyHotline: settings?.emergencyHotline || '+91 98765 43210',
    currency: settings?.currency || 'INR (₹)',
    portfolioTier: 'Enterprise Commercial & Residential',

    // Notifications
    alertCriticalDefects: true,
    alertWorkOrderUpdates: true,
    alertWeeklyDigest: true,
    alertContractorDispatch: true,

    // Inspection
    defaultBuildingType: 'Commercial Complex',
    requireHumanSignoff: true,
    autoFormulateScope: true,
    strictVisibleEvidenceFilter: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const res = await resetPassword(user.email);
    if (!res.error) {
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    }
  };

  const navTabs = [
    { id: 'profile', label: 'Manager Profile', icon: User },
    { id: 'organization', label: 'Organization & Portfolio', icon: Building2 },
    { id: 'notifications', label: 'Notification Rules', icon: Bell },
    { id: 'inspection', label: 'Inspection Preferences', icon: Sliders },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'info', label: 'System Compliance', icon: Info },
  ];

  return (
    <div className="space-y-6 max-w-5xl text-left select-text">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Platform Settings & Operations Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure operations credentials, organizational standards, notification workflows, and compliance sign-offs.
          </p>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Vertical Sub-Navigation */}
        <div className="md:col-span-1 space-y-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tab Content Container */}
        <div className="md:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Property Manager Profile Tab */}
            {activeTab === 'profile' && (
              <div className="rounded-2xl bg-[#101726]/90 border border-slate-800 p-6 shadow-xl space-y-5">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Property Operations Manager Profile</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Credentials and designations stamped on forensic inspection reports and work order approvals.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={formData.inspectorName}
                      onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
                      className="w-full bg-[#0d1424] text-slate-100 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Official Designation / Title
                    </label>
                    <input
                      type="text"
                      value={formData.inspectorTitle}
                      onChange={(e) => setFormData({ ...formData, inspectorTitle: e.target.value })}
                      className="w-full bg-[#0d1424] text-slate-100 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Professional License / RICS ID
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full bg-[#0d1424] text-slate-100 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full bg-[#0d1424] text-slate-100 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Digital Sign-off Endorsement Text
                    </label>
                    <input
                      type="text"
                      value={formData.signatureText}
                      onChange={(e) => setFormData({ ...formData, signatureText: e.target.value })}
                      className="w-full bg-[#0d1424] text-slate-100 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Appended to Stage 7 human validation sign-offs and exported PDF dossiers.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Organization Information Tab */}
            {activeTab === 'organization' && (
              <div className="rounded-2xl bg-[#101726]/90 border border-slate-800 p-6 shadow-xl space-y-5">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span>Real Estate Asset Organization</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Corporate entity and regional portfolio operational parameters.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      className="w-full bg-[#0d1424] text-slate-100 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Emergency Structural Hotline
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyHotline}
                      onChange={(e) => setFormData({ ...formData, emergencyHotline: e.target.value })}
                      className="w-full bg-[#0d1424] text-slate-100 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Corporate Facility / Operations Office
                    </label>
                    <input
                      type="text"
                      value={formData.officeAddress}
                      onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
                      className="w-full bg-[#0d1424] text-slate-100 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Operating Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full bg-[#0d1424] text-slate-100 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="INR (₹)">INR (₹) — Indian Rupee</option>
                      <option value="USD ($)">USD ($) — US Dollar</option>
                      <option value="EUR (€)">EUR (€) — Euro</option>
                      <option value="GBP (£)">GBP (£) — British Pound</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Asset Portfolio Tier
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.portfolioTier}
                      className="w-full bg-[#0a0f1d] text-slate-400 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-800 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Notification Preferences Tab */}
            {activeTab === 'notifications' && (
              <div className="rounded-2xl bg-[#101726]/90 border border-slate-800 p-6 shadow-xl space-y-5">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <span>Automated Dispatch & Alert Notifications</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure real-time triggers for critical structural alerts and contractor progress.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-200">
                        Critical Severity Defect Alerts
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Trigger priority notifications immediately when Category B structural hazards (beam shear cracks, major slab deflection) are detected.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.alertCriticalDefects}
                      onChange={(e) => setFormData({ ...formData, alertCriticalDefects: e.target.checked })}
                      className="w-4 h-4 mt-1 accent-blue-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-200">
                        Work Order Dispatch & Status Transitions
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Send notifications when contractors accept work orders, update milestone progress, or request completion sign-off.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.alertWorkOrderUpdates}
                      onChange={(e) => setFormData({ ...formData, alertWorkOrderUpdates: e.target.checked })}
                      className="w-4 h-4 mt-1 accent-blue-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-200">
                        Weekly Portfolio Integrity Digest
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Consolidated overview of all open observations, unresolved maintenance scopes, and financial projections.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.alertWeeklyDigest}
                      onChange={(e) => setFormData({ ...formData, alertWeeklyDigest: e.target.checked })}
                      className="w-4 h-4 mt-1 accent-blue-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 4. Inspection Preferences Tab */}
            {activeTab === 'inspection' && (
              <div className="rounded-2xl bg-[#101726]/90 border border-slate-800 p-6 shadow-xl space-y-5">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span>Autonomous Inspection & Forensic Protocols</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Engineering standards governing Gemini 3.8 Flash multimodal analysis and human sign-off rules.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Default Building Classification
                    </label>
                    <select
                      value={formData.defaultBuildingType}
                      onChange={(e) => setFormData({ ...formData, defaultBuildingType: e.target.value })}
                      className="w-full bg-[#0d1424] text-slate-100 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Commercial Complex">Commercial Complex</option>
                      <option value="Residential High-Rise">Residential High-Rise</option>
                      <option value="Industrial Warehouse">Industrial Warehouse</option>
                      <option value="Institutional Facility">Institutional Facility</option>
                      <option value="Mixed-Use Development">Mixed-Use Development</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-200">
                          Enforce Human Approval Gate (Stage 7)
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Requires a Property Manager or structural engineer to review Category A evidence and Category B hypotheses before work orders can be dispatched.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.requireHumanSignoff}
                        onChange={(e) => setFormData({ ...formData, requireHumanSignoff: e.target.checked })}
                        className="w-4 h-4 mt-1 accent-blue-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-200">
                          Automate Maintenance Scope Formulation (Stage 5)
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Automatically generates trade-specific material checklists, surface preparation protocols, and INR cost brackets from visual indicators.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.autoFormulateScope}
                        onChange={(e) => setFormData({ ...formData, autoFormulateScope: e.target.checked })}
                        className="w-4 h-4 mt-1 accent-blue-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Security & Account Tab */}
            {activeTab === 'security' && (
              <div className="rounded-2xl bg-[#101726]/90 border border-slate-800 p-6 shadow-xl space-y-5">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span>Security, Authentication & Session</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Authorized account session, credentials, and access permissions.
                  </p>
                </div>

                {user ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Authenticated Account</span>
                        <span className="text-xs font-mono text-slate-200">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Designated Role</span>
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {profile?.role || 'Property Manager'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Security Clearance</span>
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Row Level Security Enforced</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start"
                      >
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Reset Account Password</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await signOut();
                        }}
                        className="px-4 py-2 rounded-xl bg-red-600/15 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out of Portal</span>
                      </button>
                    </div>

                    {resetSent && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Password reset link sent to {user.email}.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                    <p className="text-xs text-slate-300">
                      You are currently operating in unauthenticated review mode. Sign in to protect your property records and access restricted portfolios.
                    </p>
                    {onOpenAuthModal && (
                      <button
                        type="button"
                        onClick={onOpenAuthModal}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                      >
                        Sign In as Property Manager
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 6. System & Compliance Tab */}
            {activeTab === 'info' && (
              <div className="rounded-2xl bg-[#101726]/90 border border-slate-800 p-6 shadow-xl space-y-5">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span>Application Standards & Engineering Compliance</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Forensic algorithms and building codes governing automated defect classification.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="font-bold text-slate-200">National Building Code (NBC 2016)</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Part 6: Structural Design, Section 5: Concrete and masonry damage limits and crack severity indices.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="font-bold text-slate-200">IS 456:2000 Structural Code</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Permissible crack widths (0.3mm non-aggressive, 0.2mm aggressive exposure) and rebar cover standards.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="font-bold text-slate-200">ASTM C876 Forensic Standards</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Standard Test Method for Corrosion Potentials of Uncoated Reinforcing Steel in Concrete.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="font-bold text-slate-200">Platform Version</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      ApexProp AI Enterprise Edition • Engine: Gemini 3.8 Flash Multimodal Architecture.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Settings updated successfully</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
