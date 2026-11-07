import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  FileText,
  Search,
  ArrowRight,
  Layers,
  Wrench,
  Download,
  Clock,
  UserCheck,
  Send,
  Plus,
  Compass,
  AlertOctagon,
  Eye,
  Check,
  Ban,
  Edit3
} from 'lucide-react';
import {
  InspectionRecord,
  InvestigationHypothesis,
  InvestigationQuestion,
  HumanReviewRecord,
  InvestigationOutcome
} from '../types';
import { supabase } from '../services/supabaseClient';
import { generateInspectionPDF } from '../utils/pdfGenerator';

interface InvestigationDossierModalProps {
  inspection: InspectionRecord;
  onClose: () => void;
  onUpdateInspection: (updated: InspectionRecord) => void;
  onCreateWorkOrder: (inspection: InspectionRecord) => void;
}

export const InvestigationDossierModal: React.FC<InvestigationDossierModalProps> = ({
  inspection,
  onClose,
  onUpdateInspection,
  onCreateWorkOrder
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'hypotheses' | 'questions' | 'humanReview'>('hypotheses');
  
  // Follow-up questions interactive state
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<string | null>(null);
  const [answerSuccessNotice, setAnswerSuccessNotice] = useState<string | null>(null);

  // Human review form state
  const [reviewAction, setReviewAction] = useState<'ACCEPT' | 'REJECT' | 'AMEND' | 'REQUEST_INSPECTION' | 'MARK_INSUFFICIENT'>('ACCEPT');
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string>(
    inspection.investigationHypotheses?.[0]?.hypothesisId || ''
  );
  const [professionalNotes, setProfessionalNotes] = useState('');
  const [amendedPrimaryCause, setAmendedPrimaryCause] = useState('');
  const [outcomeDecision, setOutcomeDecision] = useState<InvestigationOutcome>(
    inspection.investigationOutcome || 'CAUSE_SUPPORTED_BY_EVIDENCE'
  );
  const [escalationAcknowledged, setEscalationAcknowledged] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Helper for auth headers
  const getAuthHeaders = async () => {
    let token: string | undefined;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token;
    }
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  // Submit Answer to a Question
  const handleAnswerSubmit = async (questionId: string) => {
    const answer = questionAnswers[questionId];
    if (!answer || !answer.trim()) return;

    setIsSubmittingAnswer(questionId);
    setAnswerSuccessNotice(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/investigations/${inspection.id}/questions/${questionId}/answer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ answer: answer.trim() })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit follow-up response.');
      }

      const result = await res.json();
      if (result.inspection) {
        onUpdateInspection(result.inspection);
      }
      setAnswerSuccessNotice('Response recorded successfully. Original observations remain immutable.');
      setTimeout(() => setAnswerSuccessNotice(null), 4000);
    } catch (err: any) {
      console.error('[InvestigationDossier] Answer submit error:', err);
      alert(err?.message || 'Failed to submit answer.');
    } finally {
      setIsSubmittingAnswer(null);
    }
  };

  // Submit Professional Human Review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalNotes.trim()) {
      setReviewError('Professional engineering notes are compulsory to complete sign-off.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const headers = await getAuthHeaders();
      const payload = {
        action: reviewAction,
        hypothesisId: selectedHypothesisId || undefined,
        professionalNotes: professionalNotes.trim(),
        outcomeDecision,
        amendedPrimaryCause: reviewAction === 'AMEND' ? amendedPrimaryCause.trim() : undefined,
        escalationAcknowledged
      };

      const res = await fetch(`/api/investigations/${inspection.id}/review`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit professional review.');
      }

      const result = await res.json();
      if (result.inspection) {
        onUpdateInspection(result.inspection);
      }
      setReviewSuccess('Professional review recorded. Outcome updated and logged to audit trail.');
      setProfessionalNotes('');
    } catch (err: any) {
      console.error('[InvestigationDossier] Review submit error:', err);
      setReviewError(err?.message || 'Failed to record professional review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const hypotheses = inspection.investigationHypotheses || [];
  const questions = inspection.investigationQuestions || [];
  const reviews = inspection.humanReviews || [];
  const safety = inspection.safetyEscalation;

  const outcomeBadge = (outcome?: string) => {
    switch (outcome) {
      case 'CAUSE_SUPPORTED_BY_EVIDENCE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'MULTIPLE_PLAUSIBLE_CAUSES':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'PROFESSIONAL_ASSESSMENT_REQUIRED':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'EVIDENCE_INSUFFICIENT':
        return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40';
      case 'COMPLETED_WITH_LIMITATIONS':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const confidenceBadge = (cat?: string) => {
    switch (cat) {
      case 'High':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Moderate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#0c1322] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#10192e] border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                DOSSIER • {inspection.id}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${outcomeBadge(inspection.investigationOutcome)}`}>
                {inspection.investigationOutcome?.replace(/_/g, ' ') || 'INVESTIGATION REQUIRED'}
              </span>
              {safety?.isEscalated && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600/30 text-red-300 border border-red-500/50 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  SAFETY ESCALATION ACTIVE
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
              {inspection.propertyName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {inspection.location} • {inspection.floorOrRoom} • Category: <span className="text-slate-200 font-semibold">{inspection.defectCategory}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateInspectionPDF(inspection)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Export Forensic Dossier PDF"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Safety Escalation Alert Bar */}
        {safety?.isEscalated && (
          <div className="px-6 py-3 bg-red-950/40 border-b border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-red-200 uppercase tracking-wide">
                  Hazard Precaution Mandate: Cordoning & Access Restriction
                </h4>
                <p className="text-[11px] text-red-300/80 mt-0.5 leading-relaxed">
                  {safety.triggerReason}
                </p>
              </div>
            </div>
            <div className="text-[11px] font-mono text-red-400 bg-red-950/80 px-2.5 py-1 rounded-lg border border-red-800/80 whitespace-nowrap self-start sm:self-auto">
              Perimeter: 3m Cordon
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 bg-[#0e1628] flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'hypotheses', label: `Hypotheses (${hypotheses.length})`, icon: Compass },
            { id: 'evidence', label: 'Evidence & Morphology', icon: Eye },
            { id: 'questions', label: `Manager Follow-Up (${questions.length})`, icon: HelpCircle },
            { id: 'humanReview', label: `Human Sign-Off (${reviews.length})`, icon: UserCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* TAB 1: HYPOTHESES */}
          {activeTab === 'hypotheses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Grounded Pathology Hypotheses
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evaluated against surface characteristics, crack orientation, moisture boundary & environmental exposure.
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {hypotheses.length} evaluated mechanisms
                </span>
              </div>

              {hypotheses.length === 0 ? (
                <div className="p-8 text-center bg-[#101726] rounded-2xl border border-slate-800">
                  <Compass className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-300 font-semibold">No hypotheses generated.</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sound structural element or non-defective baseline.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hypotheses.map((hyp, idx) => (
                    <div
                      key={hyp.hypothesisId || idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        hyp.isHumanAccepted
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : hyp.humanDecision === 'REJECTED'
                          ? 'bg-red-950/20 border-red-500/30 opacity-75'
                          : 'bg-[#10192e] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Hypothesis Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-mono font-bold flex items-center justify-center border border-blue-500/30">
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            {hyp.possibleCause}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${confidenceBadge(hyp.confidenceCategory)}`}>
                            Confidence: {hyp.confidenceCategory}
                          </span>

                          {hyp.isHumanAccepted && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              Accepted by Manager
                            </span>
                          )}

                          {hyp.humanDecision === 'REJECTED' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                              <Ban className="w-3 h-3 text-red-400" />
                              Rejected by Manager
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Plausibility Explanation */}
                      <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                        {hyp.explanationOfPlausibility}
                      </p>

                      {/* Evidence Grid: Supporting vs Contradictory/Missing */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <div className="p-3 rounded-xl bg-[#0b1220] border border-slate-800/80">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Supporting Evidence
                          </span>
                          <ul className="mt-1.5 space-y-1 text-xs text-slate-300">
                            {hyp.supportingEvidence.map((ev, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-500 mt-1">•</span>
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 rounded-xl bg-[#0b1220] border border-slate-800/80">
                          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" />
                            Contradictory / Missing Evidence
                          </span>
                          <ul className="mt-1.5 space-y-1 text-xs text-slate-300">
                            {hyp.contradictoryOrMissingEvidence.map((ev, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-500 mt-1">•</span>
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Verification Method & Information Needed */}
                      <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="text-slate-400">
                          <span className="text-slate-500 font-semibold">Recommended Physical Test: </span>
                          <span className="text-blue-300 font-medium">{hyp.recommendedVerificationMethod}</span>
                        </div>

                        {hyp.humanNotes && (
                          <div className="text-[11px] text-slate-400 italic bg-[#0c1322] px-2.5 py-1 rounded-lg border border-slate-800">
                            Review Note: "{hyp.humanNotes}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EVIDENCE & MORPHOLOGY */}
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Photo with Pinpoint Coordinate */}
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3] flex items-center justify-center">
                    <img
                      src={inspection.imageUrl}
                      alt={inspection.propertyName}
                      className="w-full h-full object-contain"
                    />

                    {/* Coordinate Pins */}
                    {inspection.evidenceItems?.map((ev, idx) => (
                      ev.coordinates?.yMin ? (
                        <div
                          key={ev.findingId || idx}
                          style={{
                            top: `${ev.coordinates.yMin / 10}%`,
                            left: `${(ev.coordinates.xMin || 500) / 10}%`
                          }}
                          className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-blue-500/30"
                          title={ev.visibleEvidenceDescription}
                        >
                          {idx + 1}
                        </div>
                      ) : null
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-[#10192e] border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Resolution: <strong className="text-slate-200">{inspection.imageQuality?.resolution || 'HIGH'}</strong></span>
                    <span className="text-slate-400">Lighting: <strong className="text-slate-200">{inspection.imageQuality?.lighting || 'ADEQUATE'}</strong></span>
                    <span className="text-slate-400">Focus: <strong className="text-slate-200">{inspection.imageQuality?.focus || 'SHARP'}</strong></span>
                  </div>
                </div>

                {/* Visible Evidence List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                    Observable Pixel Findings (Immutable Category A)
                  </h4>

                  <div className="space-y-2">
                    {inspection.categoryA_visibleEvidence && inspection.categoryA_visibleEvidence.length > 0 ? (
                      inspection.categoryA_visibleEvidence.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#10192e] border border-slate-800 text-xs">
                          <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
                            <span className="w-4 h-4 rounded-full bg-blue-500/20 text-[10px] font-mono flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span>Direct Visual Indicator</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{item}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No physical defect markings documented.</p>
                    )}
                  </div>

                  {/* Visual Limitations */}
                  <div className="p-3 rounded-xl bg-[#0b1220] border border-slate-800 mt-4">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Optical Limitations & Non-Certifying Boundary
                    </span>
                    <ul className="mt-1.5 space-y-1 text-[11px] text-slate-400">
                      {(inspection.limitations || [
                        'Visual inspection evaluates surface pixels only.',
                        'Subsurface reinforcement loss percentage cannot be verified without physical non-destructive testing.'
                      ]).map((lim, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-slate-500">•</span>
                          <span>{lim}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FOLLOW-UP QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Defect-Specific Property Manager Inquiries
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Answer these targeted contextual questions to clarify environmental correlation, progression & past repairs without altering original optical observations.
                  </p>
                </div>
              </div>

              {answerSuccessNotice && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{answerSuccessNotice}</span>
                </div>
              )}

              {questions.length === 0 ? (
                <div className="p-8 text-center bg-[#101726] rounded-2xl border border-slate-800">
                  <HelpCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-300 font-semibold">No follow-up questions active for this finding.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q.questionId || idx}
                      className="p-4 rounded-2xl bg-[#10192e] border border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            Q{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-white leading-relaxed">
                              {q.question}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {q.contextRationale}
                            </p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                          q.answered
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {q.answered ? 'ANSWERED' : 'PENDING'}
                        </span>
                      </div>

                      {/* Display Existing Answer if Present */}
                      {q.answered && q.answer && (
                        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold mb-1">
                            <span>Recorded Manager Response:</span>
                            <span className="text-[10px] text-slate-400 font-mono">{q.answeredAt ? new Date(q.answeredAt).toLocaleDateString() : 'Recorded'}</span>
                          </div>
                          <p className="text-xs text-slate-200">{q.answer}</p>
                        </div>
                      )}

                      {/* Quick suggested answers */}
                      {q.suggestedAnswers && q.suggestedAnswers.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            Suggested Pre-fills:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {q.suggestedAnswers.map((sug, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setQuestionAnswers(prev => ({ ...prev, [q.questionId]: sug }))}
                                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0b1220] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-left"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Answer Input Field */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder={q.answered ? "Update response..." : "Type property manager notes or select a suggestion above..."}
                          value={questionAnswers[q.questionId] ?? (q.answer || '')}
                          onChange={(e) => setQuestionAnswers(prev => ({ ...prev, [q.questionId]: e.target.value }))}
                          className="flex-1 bg-[#0b1220] text-slate-100 placeholder:text-slate-500 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={isSubmittingAnswer === q.questionId || !questionAnswers[q.questionId]?.trim()}
                          onClick={() => handleAnswerSubmit(q.questionId)}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Send className="w-3 h-3" />
                          <span>{isSubmittingAnswer === q.questionId ? 'Saving...' : 'Submit'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HUMAN REVIEW & SIGN-OFF */}
          {activeTab === 'humanReview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Professional Engineering Decision & Sign-Off
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  The AI does not self-certify. Property Managers record professional review, accept/reject hypotheses, or mandate physical on-site structural engineer verification.
                </p>
              </div>

              {reviewSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{reviewSuccess}</span>
                </div>
              )}

              {reviewError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>{reviewError}</span>
                </div>
              )}

              {/* Review Submission Form */}
              <form onSubmit={handleReviewSubmit} className="p-5 rounded-2xl bg-[#10192e] border border-slate-800 space-y-4">
                
                {/* Action Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    Review Decision Action:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'ACCEPT', label: 'Accept Hypothesis', desc: 'Concur with AI root cause' },
                      { id: 'REJECT', label: 'Reject Hypothesis', desc: 'Disagree with mechanism' },
                      { id: 'AMEND', label: 'Amend / Modify', desc: 'Propose alternate cause' },
                      { id: 'REQUEST_INSPECTION', label: 'Request On-Site Audit', desc: 'Mandate licensed engineer' },
                      { id: 'MARK_INSUFFICIENT', label: 'Mark Insufficient', desc: 'Require higher res imagery' }
                    ].map(act => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setReviewAction(act.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          reviewAction === act.id
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                            : 'bg-[#0b1220] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-bold">{act.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{act.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Hypothesis Selector */}
                {hypotheses.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Target Hypothesis:
                    </label>
                    <select
                      value={selectedHypothesisId}
                      onChange={(e) => setSelectedHypothesisId(e.target.value)}
                      className="w-full bg-[#0b1220] text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    >
                      {hypotheses.map(h => (
                        <option key={h.hypothesisId} value={h.hypothesisId}>
                          {h.hypothesisId}: {h.possibleCause} ({h.confidenceCategory} Confidence)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Amended Cause if AMEND selected */}
                {reviewAction === 'AMEND' && (
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Amended Root-Cause Mechanism:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Inadequate expansion joint spacing rather than foundation settlement"
                      value={amendedPrimaryCause}
                      onChange={(e) => setAmendedPrimaryCause(e.target.value)}
                      className="w-full bg-[#0b1220] text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Overall Outcome Status Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Set Formal Investigation Outcome:
                  </label>
                  <select
                    value={outcomeDecision}
                    onChange={(e) => setOutcomeDecision(e.target.value as any)}
                    className="w-full bg-[#0b1220] text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="INVESTIGATION_REQUIRED">INVESTIGATION REQUIRED (Awaiting physical testing)</option>
                    <option value="MULTIPLE_PLAUSIBLE_CAUSES">MULTIPLE PLAUSIBLE CAUSES (Plumbing vs Rainwater)</option>
                    <option value="CAUSE_SUPPORTED_BY_EVIDENCE">CAUSE SUPPORTED BY EVIDENCE (Strong optical corroboration)</option>
                    <option value="PROFESSIONAL_ASSESSMENT_REQUIRED">PROFESSIONAL ASSESSMENT REQUIRED (Structural hazard)</option>
                    <option value="EVIDENCE_INSUFFICIENT">EVIDENCE INSUFFICIENT (Dim, blurry or obscured imagery)</option>
                    <option value="COMPLETED_WITH_LIMITATIONS">COMPLETED WITH LIMITATIONS (Routine non-structural baseline)</option>
                  </select>
                </div>

                {/* Professional Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Professional Review Notes (Compulsory):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter on-site context, verified structural history, or surveyor instructions..."
                    value={professionalNotes}
                    onChange={(e) => setProfessionalNotes(e.target.value)}
                    className="w-full bg-[#0b1220] text-slate-200 placeholder:text-slate-500 text-xs p-3 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Safety Escalation Acknowledgement Checkbox */}
                {safety?.isEscalated && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/30 border border-red-800/60">
                    <input
                      type="checkbox"
                      id="escCheck"
                      checked={escalationAcknowledged}
                      onChange={(e) => setEscalationAcknowledged(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="escCheck" className="text-xs text-red-200 leading-snug">
                      I acknowledge the active safety escalation and confirm 3m cordon barricades or access restrictions have been initiated.
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingReview || !professionalNotes.trim()}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isSubmittingReview ? 'Recording Audit Record...' : 'Confirm Professional Sign-Off'}</span>
                </button>
              </form>

              {/* Review History & Audit Trail */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Recorded Human Decisions ({reviews.length})
                </h4>

                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No previous human reviews recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {reviews.map((rev, idx) => (
                      <div key={rev.id || idx} className="p-3 rounded-xl bg-[#0b1220] border border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-bold text-slate-200">{rev.reviewerName} • Action: <strong className="text-blue-400">{rev.action}</strong></span>
                          <span className="font-mono text-slate-500">{new Date(rev.reviewDate).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-300">{rev.professionalNotes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3.5 bg-[#10192e] border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            Close Dossier
          </button>

          <button
            onClick={() => {
              onCreateWorkOrder(inspection);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Generate Work Order</span>
          </button>
        </div>

      </div>
    </div>
  );
};
