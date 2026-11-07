import React, { useState } from 'react';
import {
  Building2,
  ScanEye,
  ShieldAlert,
  Calculator,
  CalendarCheck2,
  Wrench,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Zap,
  Target,
  FileCheck2,
  TrendingDown,
  Clock,
  ExternalLink,
  ChevronRight,
  HardHat,
  Scale,
  Database,
  Lock,
  Cpu
} from 'lucide-react';

interface LandingPageViewProps {
  onNavigate: (path: string) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onNavigate }) => {
  const [activePipelineStep, setActivePipelineStep] = useState<number>(1);

  const pipelineSteps = [
    {
      step: 1,
      tag: 'Stage 1: Evidence Ingestion',
      title: 'High-Resolution Visual Ingestion & Scale Extraction',
      desc: 'Property inspectors capture or upload raw facade, column, or wall imagery. The multimodal engine validates MIME type, image sharpness, and dimension scale rulers.',
      badge: 'Multimodal Vision',
      color: 'blue'
    },
    {
      step: 2,
      tag: 'Stage 2: Category A Evidence',
      title: 'Sub-Millimeter Coordinate & Bounding Box Localization',
      desc: 'Pixel-level feature extraction detects cracks, spalling, dampness, and rebar corrosion. Exact normalized bounding coordinates are anchored to prevent hallucinations.',
      badge: 'Direct Visual Finding',
      color: 'indigo'
    },
    {
      step: 3,
      tag: 'Stage 3: Category B Pathology',
      title: 'Root-Cause Hypotheses & Forensic Explanations',
      desc: 'Formulates probabilistic defect etiology: carbonation depth, chloride attack, thermal settlement, or moisture capillary rise, with alternative explanations.',
      badge: 'Probabilistic AI',
      color: 'purple'
    },
    {
      step: 4,
      tag: 'Stage 4: Category C Grounding',
      title: 'Mandatory Physical Checks (IS 456 & NBC 2016)',
      desc: 'Explicit boundary enforcement: visual AI never certifies structural stability. Automatically mandates Schmidt hammer, core drilling, or cover meter physical checks.',
      badge: 'Engineering Governance',
      color: 'amber'
    },
    {
      step: 5,
      tag: 'Stage 5: Repair Intelligence',
      title: '3-Way Option Comparison & Itemized Cost Engine',
      desc: 'Calculates Quick Patch vs Comprehensive vs Structural Re-engineering trade-offs. Itemized unit rate catalog math with materials, labor, contingency buffers, and taxes.',
      badge: 'Deterministic Math',
      color: 'emerald'
    },
    {
      step: 6,
      tag: 'Stage 6: Maintenance Lifecycle',
      title: '15-State Work Order FSM & Verification Gate',
      desc: 'Dispatches licensed contractors, logs execution progress %, tracks operational pause delays, audits budget revisions, and enforces chartered engineer sign-off.',
      badge: 'Audit Closure Gate',
      color: 'blue'
    }
  ];

  const features = [
    {
      icon: ScanEye,
      title: 'Multimodal Defect Forensics',
      desc: 'Detects structural wall cracks, rising dampness, concrete spalling, and corroded rebar with normalized bounding coordinates.',
      badge: 'Gemini 3.8 Flash'
    },
    {
      icon: ShieldAlert,
      title: 'Risk Intelligence Matrix',
      desc: 'Transparent scoring based on Severity × Likelihood × Asset Criticality. Immediate escalation protocols for critical structural hazards.',
      badge: 'Transparent Matrix'
    },
    {
      icon: Calculator,
      title: 'Deterministic Cost Estimator',
      desc: 'Unit rate catalog matching for localized labor and material tariffs. Fiduciary separation between Estimated, Approved, and Actual job expenditures.',
      badge: 'Zero-Hallucination Math'
    },
    {
      icon: CalendarCheck2,
      title: 'Maintenance Strategic Planner',
      desc: 'Aggregates open proposals, upcoming preventative tasks, and approved budgets across your entire commercial property portfolio.',
      badge: 'CapEx Forecasting'
    },
    {
      icon: Wrench,
      title: '15-State Work Order FSM',
      desc: 'From initial draft to contractor acknowledgment, pause delays, material logs, formal change orders, quality verification, and closure.',
      badge: 'Finite State Machine'
    },
    {
      icon: FileText,
      title: 'Certified Executive PDF Dossiers',
      desc: '5 downloadable print-ready engineering reports (Inspection, Investigation, Repair Estimate, Work Order, Portfolio Health) and universal CSVs.',
      badge: 'Audit-Ready Exports'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-blue-600 selection:text-white flex flex-col font-sans">
      {/* ==================================================================== */}
      {/* TOP NAVIGATION BAR                                                   */}
      {/* ==================================================================== */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25 text-white font-black">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">ApexProp</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Autonomous Property Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Anchors (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
            <a href="#problem" className="hover:text-white transition-colors">Problem</a>
            <a href="#pipeline" className="hover:text-white transition-colors">6-Stage Pipeline</a>
            <a href="#features" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#governance" className="hover:text-white transition-colors">Standards & Codes</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/login')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('/signup')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ==================================================================== */}
      {/* HERO SECTION                                                         */}
      {/* ==================================================================== */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          {/* Hero Header Pill */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>INFINEX 2K26 Flagship Showcase • Multimodal AI Defect Forensics</span>
            </div>
          </div>

          {/* Headline & Subtitle */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              Autonomous Property Defect Forensics &amp; Maintenance Lifecycle
            </h1>
            <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto font-normal">
              Convert raw property inspection photographs into millimeter-accurate defect bounding, probabilistic root-cause pathology, itemized repair estimates, and 15-state verified work orders.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('/signup')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('/login')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Enter Enterprise Studio</span>
              </button>
            </div>

            {/* Regulatory & Standards Badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                IS 456:2000 Structural Code Aligned
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                National Building Code (NBC) 2016 Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Category A/B/C Epistemic Segregation
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Zero Hallucination Math
              </span>
            </div>
          </div>

          {/* Hero Visual Mockup HUD */}
          <div className="mt-14 max-w-5xl mx-auto relative rounded-2xl overflow-hidden border border-blue-500/30 bg-[#0d1424] shadow-2xl shadow-blue-900/30 group">
            {/* Top Bar Window Chrome */}
            <div className="px-4 py-3 bg-[#0a0f1d] border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-semibold text-slate-400 font-mono">
                  ApexProp AI Studio • Multimodal Forensic HUD [Asset #1250 - Commercial High-Rise]
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-blue-400 font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACTIVE INSPECTION SESSION</span>
              </div>
            </div>

            {/* Simulated Live Viewport */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
              {/* Actual Generated High-Res Commercial Building Photo */}
              <img
                src="/assets/property_facade_hero.jpg"
                alt="Commercial High-Rise Facade"
                className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.05]"
              />

              {/* Overlay HUD Grid & Scanning Lines */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-transparent to-transparent opacity-80 pointer-events-none" />

              {/* Simulated Coordinate Bounding Box 1 (Spalling & Column Crack) */}
              <div className="absolute top-[28%] left-[45%] w-[26%] h-[42%] border-2 border-red-500/90 bg-red-500/10 rounded-lg pointer-events-none backdrop-blur-[1px] animate-pulse">
                <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold flex items-center gap-1 shadow-md">
                  <span>DEFECT-01: CONCRETE SPALLING &amp; SHEAR FISSURE</span>
                </div>
                <div className="absolute -bottom-5 right-0 px-1.5 py-0.5 rounded bg-slate-900/90 text-red-300 font-mono text-[9px]">
                  [x: 360, y: 440, w: 210, h: 280]
                </div>
              </div>

              {/* Floating Pinpoint Indicator 1 */}
              <div className="absolute top-[36%] left-[58%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                <div className="w-6 h-6 rounded-full bg-red-600/80 border-2 border-white flex items-center justify-center text-white font-mono text-[10px] font-black animate-ping" />
              </div>

              {/* Floating Diagnostic Cards over image */}
              <div className="absolute bottom-4 left-4 right-4 grid grid-cols-1 md:grid-cols-3 gap-3 pointer-events-none">
                {/* Diagnostic Card 1: Visual Finding */}
                <div className="p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-xl">
                  <div className="flex items-center justify-between text-[10px] font-bold text-red-400 uppercase">
                    <span>Category A • Visible Evidence</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">94.8% Match</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 mt-1">Spalling with Exposed Rebar</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Visible concrete delamination along ground-level structural column.</p>
                </div>

                {/* Diagnostic Card 2: AI Root Cause Hypothesis */}
                <div className="p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-xl">
                  <div className="flex items-center justify-between text-[10px] font-bold text-indigo-400 uppercase">
                    <span>Category B • Forensic Root Cause</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Probable</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 mt-1">Carbonation &amp; Chloride Attack</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Atmospheric carbonation lowering pH, causing volumetric oxide expansion.</p>
                </div>

                {/* Diagnostic Card 3: Deterministic Cost & Trade-off */}
                <div className="p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-xl">
                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400 uppercase">
                    <span>Stage 5 • Deterministic Cost</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">3 Options</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 mt-1">Approved Budget: ₹56,640</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Polymer re-alkalisation + rebar anti-rust passivator. Trade: Structural.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* THE PROBLEM VS APEXPROP SOLUTION SECTION                            */}
      {/* ==================================================================== */}
      <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-[#080d19]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              The Facilities Management Gap
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
              Why Conventional Property Inspections Fail
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              Real estate asset managers, strata councils, and institutional landlords lose billions annually to delayed interventions, hallucinated repairs, and unverified contractor invoices.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="p-6 sm:p-8 rounded-2xl bg-red-950/15 border border-red-500/20 shadow-xl">
              <div className="flex items-center gap-2.5 mb-4 text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-extrabold text-red-300">The Conventional Manual Approach</h3>
              </div>
              <ul className="space-y-4 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✕</span>
                  <div>
                    <strong className="text-slate-100">Subjective &amp; Untraceable Reports:</strong> Inspections rely on handwritten surveyor notes without precise pixel coordinate anchors or dimension rulers.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✕</span>
                  <div>
                    <strong className="text-slate-100">Delayed Structural Interventions:</strong> Micro-fissures and rising dampness are ignored until costly concrete spalling or catastrophic safety hazards emerge.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✕</span>
                  <div>
                    <strong className="text-slate-100">Opaque Contractor Quotations:</strong> Contractors submit arbitrary lump-sum bids without transparent unit rate catalogs, material receipts, or labor breakdowns.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✕</span>
                  <div>
                    <strong className="text-slate-100">Zero Governance or Verification:</strong> Work orders are closed on blind faith without chartered engineer quality checkpoints or photographic evidence sign-offs.
                  </div>
                </li>
              </ul>
            </div>

            {/* The ApexProp Way */}
            <div className="p-6 sm:p-8 rounded-2xl bg-blue-950/20 border border-blue-500/30 shadow-xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2.5 mb-4 text-blue-400">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-extrabold text-blue-200">The ApexProp Autonomous Paradigm</h3>
              </div>
              <ul className="space-y-4 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</span>
                  <div>
                    <strong className="text-slate-100">Sub-Millimeter Coordinate Anchoring:</strong> Multimodal vision models detect and track defects with exact normalized bounding coordinates.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</span>
                  <div>
                    <strong className="text-slate-100">Category A/B/C Epistemic Segregation:</strong> Strict isolation between pixel evidence, AI root-cause hypotheses, and mandatory physical engineering tests.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</span>
                  <div>
                    <strong className="text-slate-100">Deterministic Rate Catalog Math:</strong> Transparent line-item pricing (materials, technicians, taxes, contingency) with zero AI hallucination.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</span>
                  <div>
                    <strong className="text-slate-100">15-State FSM Verification Gate:</strong> Strict lifecycle rules: orders CANNOT be closed until certified by an authorized reviewer with passed QC checkpoints.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6-STAGE AUTONOMOUS PIPELINE ("HOW IT WORKS")                         */}
      {/* ==================================================================== */}
      <section id="pipeline" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-[#070b14]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              End-to-End Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
              The 6-Stage Autonomous Inspection Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              How ApexProp AI processes an uploaded photograph into an evidence-grounded, verified maintenance resolution.
            </p>
          </div>

          {/* Interactive Pipeline Timeline Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-8">
            {pipelineSteps.map((p) => {
              const isActive = activePipelineStep === p.step;
              return (
                <button
                  key={p.step}
                  onClick={() => setActivePipelineStep(p.step)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className={`text-[10px] font-bold block ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                    0{p.step}
                  </span>
                  <div className="text-xs font-bold mt-1 truncate">{p.badge}</div>
                </button>
              );
            })}
          </div>

          {/* Active Pipeline Card Detail */}
          {(() => {
            const current = pipelineSteps.find((p) => p.step === activePipelineStep) || pipelineSteps[0];
            return (
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0e1628] to-[#090f1d] border border-blue-500/30 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                  <div>
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                      {current.tag}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      {current.title}
                    </h3>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold self-start md:self-auto">
                    {current.badge}
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mt-6 max-w-4xl">
                  {current.desc}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onNavigate('/signup')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Test This Pipeline in Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActivePipelineStep((prev) => (prev % 6) + 1)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Next Stage ({((activePipelineStep % 6) + 1)}/6) →
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* PLATFORM CAPABILITIES GRID (THE 6 MODULES)                           */}
      {/* ==================================================================== */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-[#080d19]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Core Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
              Engineered for Enterprise Property Portfolios
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              Every tool required to identify defects, quantify structural liability, compare repair options, and coordinate contractors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-1 group shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60">
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* REGULATORY STANDARDS & AI CREDIBILITY                                */}
      {/* ==================================================================== */}
      <section id="governance" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-[#070b14]">
        <div className="max-w-7xl mx-auto">
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-indigo-950/40 border border-blue-500/30 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  <span>Civil Engineering Compliance Boundary</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Visual AI Does Not Replace Licensed Structural Certification
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Unlike consumer AI tools that claim to predict structural building collapse from a single photograph, ApexProp AI maintains strict civil engineering discipline. Our system adheres to Indian Standard <strong>IS 456:2000</strong> (Code of Practice for Plain and Reinforced Concrete) and <strong>NBC 2016</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-blue-400 font-bold block">Category A</span>
                    <span className="text-slate-300 mt-1 block font-medium">Visible Findings Detected</span>
                    <span className="text-[11px] text-slate-400">Direct pixel indicators</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-indigo-400 font-bold block">Category B</span>
                    <span className="text-slate-300 mt-1 block font-medium">AI Pathology Hypotheses</span>
                    <span className="text-[11px] text-slate-400">Probabilistic causes</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-amber-400 font-bold block">Category C</span>
                    <span className="text-slate-300 mt-1 block font-medium">Mandatory Physical Checks</span>
                    <span className="text-[11px] text-slate-400">Qualified human sign-off</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
                <HardHat className="w-12 h-12 text-blue-400 mb-3" />
                <h4 className="text-sm font-bold text-slate-100">Fiduciary Grade Assurance</h4>
                <p className="text-xs text-slate-400 mt-1">Zero fabricated engineering measurements. Every repair plan requires authorized human review.</p>
                <button
                  onClick={() => onNavigate('/signup')}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Create Property Manager Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* ENTERPRISE ARCHITECTURE                                              */}
      {/* ==================================================================== */}
      <section id="architecture" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-[#080d19]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Technical Infrastructure
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
              Enterprise Defense-In-Depth Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              Built on battle-tested production primitives with zero compromise on data isolation or reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <Cpu className="w-6 h-6 text-blue-400 mb-2" />
              <h4 className="text-sm font-bold text-white">Google Gemini 3.8 Flash</h4>
              <p className="text-xs text-slate-400 mt-1">Multimodal vision SDK for high-speed sub-millimeter bounding boxes and visual anomaly extraction.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <Database className="w-6 h-6 text-indigo-400 mb-2" />
              <h4 className="text-sm font-bold text-white">Supabase PostgreSQL 15</h4>
              <p className="text-xs text-slate-400 mt-1">Row-Level Security (RLS) policies, immutable audit logs, and private encrypted object storage buckets.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <Lock className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="text-sm font-bold text-white">Sliding-Window Limiter</h4>
              <p className="text-xs text-slate-400 mt-1">250 req/min general API rate limiter and 20 req/min AI endpoint protection against compute exhaustion.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <FileCheck2 className="w-6 h-6 text-amber-400 mb-2" />
              <h4 className="text-sm font-bold text-white">Vector PDF Engine</h4>
              <p className="text-xs text-slate-400 mt-1">jsPDF + autotable client-side rendering for instant, zero-server-load downloadable engineering dossiers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* FINAL CALL TO ACTION BANNER                                          */}
      {/* ==================================================================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-gradient-to-b from-[#070b14] to-[#0d1527]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/25">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Transform Your Commercial Property Inspections?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join facility directors, property managers, and civil engineers using ApexProp AI to detect defects, eliminate uncoordinated contractor bids, and protect structural longevity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('/signup')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('/login')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all cursor-pointer"
            >
              Sign In to Your Workspace
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* PUBLIC FOOTER                                                        */}
      {/* ==================================================================== */}
      <footer className="border-t border-slate-800/80 bg-[#05080f] py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-slate-300">ApexProp AI</span>
            <span>• Autonomous Property Intelligence Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/login')} className="hover:text-slate-300 transition-colors cursor-pointer">
              Sign In
            </button>
            <button onClick={() => onNavigate('/signup')} className="hover:text-slate-300 transition-colors cursor-pointer">
              Register
            </button>
            <a href="#pipeline" className="hover:text-slate-300 transition-colors">
              Inspection Pipeline
            </a>
            <a href="#governance" className="hover:text-slate-300 transition-colors">
              IS 456 Standards
            </a>
          </div>

          <div className="text-[11px] text-slate-600">
            © 2026 ApexProp AI. Built for INFINEX 2K26.
          </div>
        </div>
      </footer>
    </div>
  );
};
