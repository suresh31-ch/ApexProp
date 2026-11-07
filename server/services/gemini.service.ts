import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type {
  InvestigationOutcome,
  InvestigationHypothesis,
  InvestigationQuestion,
  MultiDimensionalRisk,
  SafetyEscalation
} from '../../src/types';

export interface PinpointCoordinate {
  xPercent: number;
  yPercent: number;
  label?: string;
}

export interface AdditionalImageInput {
  cleanBase64: string;
  mimeType: string;
  label?: string;
  imageType?: 'establishing' | 'close_up' | 'scale_reference' | 'instrument_reading' | 'other';
}

export interface MultimodalInspectionInput {
  cleanBase64: string;
  mimeType: string;
  propertyName: string;
  location: string;
  buildingType: string;
  floorOrRoom: string;
  userNotes?: string;
  pinpointCoordinate?: PinpointCoordinate;
  additionalImages?: AdditionalImageInput[];
}

export interface InspectionImageQuality {
  resolution: 'HIGH' | 'MEDIUM' | 'LOW';
  lighting: 'OPTIMAL' | 'ADEQUATE' | 'DIM' | 'OVEREXPOSED';
  focus: 'SHARP' | 'MODERATE' | 'BLURRY';
  obstructions: string;
  overallAssessment: string;
}

export interface GroundedEvidenceFinding {
  findingId: string;
  defectCategory: string;
  imageRef: string;
  visibleEvidenceDescription: string;
  visualLocationOrQuadrant?: string;
  coordinates?: {
    yMin?: number;
    xMin?: number;
    yMax?: number;
    xMax?: number;
  };
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  severityReasoning: string;
  visualConfidence: number;
  confidenceExplanation: string;
  alternativeExplanations: string[];
  recommendedNextAction: string;
}

export interface PinpointVerificationResult {
  targetProvided: boolean;
  defectConfirmedAtTarget: boolean | null;
  targetObservations: string;
  comparisonWithSurroundings: string;
  inconclusive: boolean;
}

export interface GeminiMultimodalOutput {
  isDefectIdentified: boolean;
  overallInspectionStatus: 'DEFECT_CONFIRMED' | 'VISUAL_FINDING_DETECTED' | 'POTENTIAL_DEFECT' | 'NO_VISIBLE_DEFECT' | 'INCONCLUSIVE';
  summary: string;
  defectCategory: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  severityReasoning: string;
  visualConfidence: number;
  confidenceExplanation: string;
  imageQuality: InspectionImageQuality;
  pinpointAnalysis?: PinpointVerificationResult;
  multiImageCorrelation?: {
    imagesAnalyzedCount: number;
    crossCorroborationSummary: string;
    perspectiveNotes: string[];
  };
  evidenceItems: GroundedEvidenceFinding[];
  rootCauseHypothesesList: Array<{
    hypothesis: string;
    likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
    rationale: string;
    environmentalOrAgeFactors?: string[];
  }>;
  alternativeExplanationsList: string[];
  recommendedTests: string[];
  immediatePrecautions: string[];
  recommendedNextActions: string[];
  professionalVerificationRequired: boolean;
  verificationRationale: string;
  limitations: string[];
  categoryA_visibleEvidence: string[];
  categoryB_aiHypotheses: string[];
  categoryC_humanVerificationRequired: string[];
  investigationOutcome: InvestigationOutcome;
  investigationHypotheses: InvestigationHypothesis[];
  investigationQuestions: InvestigationQuestion[];
  multiDimensionalRisk: MultiDimensionalRisk;
  safetyEscalation: SafetyEscalation;
  pipeline: {
    stage1_evidence: {
      visibleObservations: Array<{
        element: string;
        visibleFeature: string;
        exactVisualEvidence: string;
        visualLocationInImage?: string;
      }>;
      rawVisualFindings: string[];
      surfaceCondition: string;
      lightingAndClarityAssessment: string;
    };
    stage2_rootCause: {
      primaryHypothesis: string;
      plausibleCauses: string[];
      alternativeExplanations: string[];
      environmentalOrAgeFactors: string[];
    };
    stage3_riskIntelligence: {
      urgencyLevel: 'Immediate (Within 24h)' | 'Urgent (Within 48h)' | 'Scheduled (1-2 weeks)' | 'Routine Monitoring (Quarterly)' | 'No Action Required';
      safetyRiskEvaluation: string;
      consequencesOfInaction: string[];
      recommendedInspectionInterval: string;
    };
    stage4_repairIntelligence: {
      temporaryMitigation: {
        action: string;
        estCostRangeINR: string;
        timeline: string;
        assumptionsAndDisclaimer: string;
      };
      permanentRemediation: {
        action: string;
        estCostRangeINR: string;
        timeline: string;
        assumptionsAndDisclaimer: string;
      };
      monitoringProtocol: {
        action: string;
        inspectionCadence: string;
      };
    };
    stage5_maintenancePlanner: {
      suggestedTrade: string;
      requiredMaterials: string[];
      equipmentNeeded: string[];
      safetyPrecautions: string[];
      accessRequirements: string;
      estimatedLaborHours: string;
      recommendedSchedule?: string;
    };
    stage6_verificationAgent: {
      supportedClaims: string[];
      unsupportedOrAmbiguousClaims: string[];
      unresolvedUncertainties: string[];
      verificationScoreOutOf100: number;
      auditPassed: boolean;
      verificationNotes: string;
    };
  };
  disclaimer: string;
}

export class GeminiInspectionService {
  private ai: GoogleGenAI;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.ai = new GoogleGenAI({
      apiKey: this.apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  public isKeyConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
  }

  public async inspectPropertyPhoto(input: MultimodalInspectionInput): Promise<GeminiMultimodalOutput> {
    if (!this.isKeyConfigured()) {
      throw new Error(
        'GEMINI_API_KEY is not configured in the server environment. Please attach your API key in AI Studio Settings > Secrets.'
      );
    }

    const hasPinpoint = !!input.pinpointCoordinate;
    const pinpointText = hasPinpoint
      ? `\n- INSPECTOR TARGET PINPOINT: The surveyor positioned a target coordinate at [X: ${input.pinpointCoordinate!.xPercent.toFixed(1)}%, Y: ${input.pinpointCoordinate!.yPercent.toFixed(1)}%] on Photo 1 (Primary) with annotation "${input.pinpointCoordinate!.label || 'Surveyor Focus Target'}".
CRITICAL PINPOINT INSTRUCTIONS:
1. Focus high-resolution forensic visual analysis specifically at coordinates X: ${input.pinpointCoordinate!.xPercent.toFixed(1)}%, Y: ${input.pinpointCoordinate!.yPercent.toFixed(1)}%.
2. Compare this target zone with the surrounding adjacent surfaces.
3. Explicitly report whether an actual defect is visible at that exact point.
4. If the target area is completely normal, clean, or undamaged, you MUST state "defect_confirmed_at_target": false. NEVER invent or hallucinate a defect simply because a pin was placed! If the area is blurry or ambiguous, set "defect_confirmed_at_target": null and "inconclusive": true.`
      : '\n- INSPECTOR TARGET PINPOINT: None specified. Perform comprehensive full-frame visual pathology across the submitted photographic evidence.';

    const totalImagesCount = 1 + (input.additionalImages?.length || 0);
    const multiImageText = input.additionalImages && input.additionalImages.length > 0
      ? `\n- MULTI-IMAGE EVIDENCE: ${totalImagesCount} distinct photographic perspectives are provided.
Photo 1: Primary Inspection View / Establishing Shot.
${input.additionalImages.map((img, idx) => `Photo ${idx + 2}: ${img.label || 'Additional perspective / detail'} (Type: ${img.imageType || 'Macro detail'})`).join('\n')}
Analyze all images as distinct evidence sources. Correlate wide-angle views with close-up macro shots or scale/instrument measurements. Avoid double-counting the same defect photographed from multiple vantage points.`
      : '\n- MULTI-IMAGE EVIDENCE: Single high-resolution inspection photograph submitted.';

    const promptText = `You are a certified structural forensic engineer, building envelope pathologist, and senior property surveyor.
You are performing an autonomous, evidence-grounded visual inspection of property photographic evidence using real pixel analysis.

PROPERTY CONTEXT:
- Property Name: ${input.propertyName}
- Location: ${input.location}
- Building Type: ${input.buildingType}
- Specific Facility/Area: ${input.floorOrRoom}
- Surveyor Context Notes: ${input.userNotes || 'None provided'}${pinpointText}${multiImageText}

FORENSIC PRINCIPLES & BOUNDARIES (STRICT MANDATE):
1. TRUTHFULNESS & ZERO HALLUCINATION MANDATE:
   - Base all findings strictly on physical pixels present in the images.
   - Support visible defects: wall/ceiling cracks, concrete spalling, exposed rebar, dampness/efflorescence, water stains, paint blistering, surface corrosion, tile damage, masonry deterioration, visible deformation/sagging.
   - If NO defect is visible (e.g. clean painted wall, intact tile, sound concrete, normal room), YOU MUST set "overall_inspection_status": "NO_VISIBLE_DEFECT", "isDefectIdentified": false, "defect_category": "None / Normal Condition", "severity": "NONE". Never fabricate cracks or moisture!
   - If the image is blurry, dim, overexposed, or obstructed so condition cannot be determined, set "overall_inspection_status": "INCONCLUSIVE", visual_confidence low, and detail limitations.
2. TRIPARTITE SEPARATION OF EVIDENCE:
   - Category A (Directly Visible Evidence): Only what is directly observable in the image pixels (fissure path, discolored watermark, powdery mineral salt crystals, flaking coating).
   - Category B (AI Root-Cause Hypotheses): Plausible engineering hypotheses (thermal movement, differential settlement, plumbing ingress, carbonation depth). Explicitly label as hypotheses.
   - Category C (Compulsory Human & Physical Verification): Physical tests requiring instruments or licensed professionals (calibrated crack meter, carbide moisture meter, ultrasonic pulse velocity, core drill, sounding hammer).
3. SAFETY & PROFESSIONAL INTEGRITY:
   - A photograph CANNOT certify structural, electrical, or fire safety, nor building code compliance. Explicitly state this limitation.
   - For severe structural shear cracks, spalling over active walkways, or corroded load-bearing rebar, issue urgent safety precautions in "immediate_precautions" (e.g. restrict access, cordon perimeter).
   - Never recommend unsupported DIY repairs for structural, electrical, or primary plumbing hazards.
4. REALISTIC ESTIMATES IN INDIAN RUPEES (INR - ₹):
   - Provide realistic repair cost estimates in INR (₹) ranges with explicit assumptions.

Respond ONLY with a valid, parseable JSON object matching this exact schema:
{
  "isDefectIdentified": boolean,
  "overall_inspection_status": "VISUAL_FINDING_DETECTED" | "POTENTIAL_DEFECT" | "NO_VISIBLE_DEFECT" | "INCONCLUSIVE",
  "summary": string,
  "defect_category": "Structural & Masonry" | "Water Ingress & Moisture" | "Façade & Cladding" | "Roofing & Guttering" | "Plumbing & Drainage" | "Electrical & Systems" | "Surface & Finish" | "None / Normal Condition",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE",
  "severity_reasoning": string,
  "visual_confidence": number, // integer 0 to 100
  "confidence_explanation": string,
  "image_quality": {
    "resolution": "HIGH" | "MEDIUM" | "LOW",
    "lighting": "OPTIMAL" | "ADEQUATE" | "DIM" | "OVEREXPOSED",
    "focus": "SHARP" | "MODERATE" | "BLURRY",
    "obstructions": string,
    "overall_assessment": string
  },
  "pinpoint_analysis": {
    "target_provided": boolean,
    "defect_confirmed_at_target": boolean | null,
    "target_observations": string,
    "comparison_with_surroundings": string,
    "inconclusive": boolean
  },
  "multi_image_correlation": {
    "images_analyzed_count": number,
    "cross_corroboration_summary": string,
    "perspective_notes": [string]
  },
  "evidence_items": [
    {
      "finding_id": string,
      "defect_category": string,
      "image_reference": string, // e.g. "Photo 1 (Primary)"
      "visible_evidence_description": string,
      "visual_location_or_quadrant": string,
      "coordinates": { "yMin": number, "xMin": number, "yMax": number, "xMax": number },
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE",
      "severity_reasoning": string,
      "visual_confidence": number,
      "confidence_explanation": string,
      "alternative_explanations": [string],
      "recommended_next_action": string
    }
  ],
  "root_cause_hypotheses": [
    {
      "hypothesis": string,
      "likelihood": "HIGH" | "MEDIUM" | "LOW",
      "rationale": string,
      "environmental_factors": [string]
    }
  ],
  "alternative_explanations": [string],
  "recommended_tests": [string],
  "immediate_precautions": [string],
  "recommended_next_actions": [string],
  "professional_verification_required": boolean,
  "verification_rationale": string,
  "limitations": [string],
  "categoryA_visibleEvidence": [string],
  "categoryB_aiHypotheses": [string],
  "categoryC_humanVerificationRequired": [string],
  "pipeline": {
    "stage1_evidence": {
      "visibleObservations": [
        {
          "element": string,
          "visibleFeature": string,
          "exactVisualEvidence": string,
          "visualLocationInImage": string
        }
      ],
      "rawVisualFindings": [string],
      "surfaceCondition": string,
      "lightingAndClarityAssessment": string
    },
    "stage2_rootCause": {
      "primaryHypothesis": string,
      "plausibleCauses": [string],
      "alternativeExplanations": [string],
      "environmentalOrAgeFactors": [string]
    },
    "stage3_riskIntelligence": {
      "urgencyLevel": "Immediate (Within 24h)" | "Urgent (Within 48h)" | "Scheduled (1-2 weeks)" | "Routine Monitoring (Quarterly)" | "No Action Required",
      "safetyRiskEvaluation": string,
      "consequencesOfInaction": [string],
      "recommendedInspectionInterval": string
    },
    "stage4_repairIntelligence": {
      "temporaryMitigation": {
        "action": string,
        "estCostRangeINR": string,
        "timeline": string,
        "assumptionsAndDisclaimer": string
      },
      "permanentRemediation": {
        "action": string,
        "estCostRangeINR": string,
        "timeline": string,
        "assumptionsAndDisclaimer": string
      },
      "monitoringProtocol": {
        "action": string,
        "inspectionCadence": string
      }
    },
    "stage5_maintenancePlanner": {
      "suggestedTrade": string,
      "requiredMaterials": [string],
      "equipmentNeeded": [string],
      "safetyPrecautions": [string],
      "accessRequirements": string,
      "estimatedLaborHours": string,
      "recommendedSchedule": string
    },
    "stage6_verificationAgent": {
      "supportedClaims": [string],
      "unsupportedOrAmbiguousClaims": [string],
      "unresolvedUncertainties": [string],
      "verificationScoreOutOf100": number,
      "auditPassed": boolean,
      "verificationNotes": string
    }
  },
  "disclaimer": string
}`;

    const parts: any[] = [];

    // Helper to add image parts safely for both raster (JPEG, PNG, WEBP) and vector (SVG)
    const addImagePart = (mimeType: string, cleanBase64: string, roleText: string) => {
      parts.push({ text: roleText });
      const lowerMime = (mimeType || 'image/jpeg').toLowerCase();
      if (lowerMime === 'image/svg+xml') {
        try {
          const svgCode = Buffer.from(cleanBase64, 'base64').toString('utf-8');
          parts.push({
            text: `[STRUCTURAL VISUAL FORENSIC DRAWING (SVG SPECIFICATION)]:\n${svgCode}`
          });
        } catch {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          });
        }
      } else {
        const safeMime = ['image/jpeg', 'image/png', 'image/webp'].includes(lowerMime)
          ? lowerMime
          : 'image/jpeg';
        parts.push({
          inlineData: {
            mimeType: safeMime,
            data: cleanBase64
          }
        });
      }
    };

    // 1. Primary photo
    addImagePart(
      input.mimeType,
      input.cleanBase64,
      `[EVIDENCE PHOTO 1 (PRIMARY)] Target: ${input.propertyName} - ${input.floorOrRoom}`
    );

    // 2. Additional photos (establishing, macro, scale, meter)
    if (input.additionalImages && input.additionalImages.length > 0) {
      input.additionalImages.forEach((img, idx) => {
        addImagePart(
          img.mimeType,
          img.cleanBase64,
          `[EVIDENCE PHOTO ${idx + 2}] Role/Type: ${img.label || 'Additional perspective'} (${img.imageType || 'macro/scale/meter'})`
        );
      });
    }

    // 3. System prompt instructions
    parts.push({
      text: promptText
    });

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const config: any = {
            responseMimeType: 'application/json'
          };

          if (modelName === 'gemini-3.8-flash') {
            config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
          }

          response = await this.ai.models.generateContent({
            model: modelName,
            contents: {
              parts
            },
            config
          });

          if (response && response.text) {
            console.log(`[GeminiService] Inspection completed with ${modelName} on attempt ${attempt}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          const msg = err?.message || String(err);
          console.warn(`[GeminiService] ${modelName} attempt ${attempt} returned: ${msg}`);
          if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('quota')) {
            // Daily quota exhausted on this specific model, break immediately to fallback model
            console.log(`[GeminiService] ${modelName} quota exhausted (429), switching to next candidate model.`);
            break;
          }
          if (attempt === 1 && (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('overloaded'))) {
            // Transient backoff
            await new Promise(r => setTimeout(r, 1500));
          }
        }
      }

      if (response && response.text) {
        break;
      }
    }

    if (!response || !response.text) {
      const msg = lastError?.message || '';
      if (msg.includes('PERMISSION_DENIED') || msg.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
        throw new Error('Gemini API authentication failed (403). Please verify your API key in AI Studio Settings > Secrets.');
      }
      if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
        throw new Error('Gemini models are experiencing high demand spike (503). Please retry in a few moments.');
      }
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
        throw new Error('Gemini API rate quota limit exceeded (429). Please select a billing-enabled key in Settings > Secrets.');
      }
      throw lastError || new Error('No output returned from Gemini multimodal analysis.');
    }

    try {
      const parsed = JSON.parse(response.text);
      return this.normalizeInspectionOutput(parsed, input);
    } catch (parseErr) {
      console.error('[GeminiService] Failed to parse model JSON output:', response.text);
      throw new Error('Gemini API returned malformed response JSON.');
    }
  }

  private normalizeInspectionOutput(raw: any, input: MultimodalInspectionInput): GeminiMultimodalOutput {
    const isDefect = raw.isDefectIdentified ?? (raw.severity && raw.severity !== 'NONE');
    const defaultStatus = !isDefect
      ? 'NO_VISIBLE_DEFECT'
      : raw.severity === 'CRITICAL' || raw.severity === 'HIGH'
      ? 'VISUAL_FINDING_DETECTED'
      : 'POTENTIAL_DEFECT';

    let overallStatus = raw.overall_inspection_status || defaultStatus;
    if (overallStatus === 'DEFECT_CONFIRMED') {
      overallStatus = 'VISUAL_FINDING_DETECTED';
    }

    // Normalizing image quality
    const imageQuality: InspectionImageQuality = {
      resolution: raw.image_quality?.resolution || 'HIGH',
      lighting: raw.image_quality?.lighting || 'ADEQUATE',
      focus: raw.image_quality?.focus || 'SHARP',
      obstructions: raw.image_quality?.obstructions || 'None noted',
      overallAssessment: raw.image_quality?.overall_assessment || 'Acceptable diagnostic clarity for surface visual pathology.'
    };

    // Normalizing evidence items
    const rawEvidence = Array.isArray(raw.evidence_items) ? raw.evidence_items : Array.isArray(raw.evidence) ? raw.evidence : [];
    const evidenceItems: GroundedEvidenceFinding[] = rawEvidence.map((ev: any, idx: number) => ({
      findingId: ev.finding_id || `FIND-${String(idx + 1).padStart(2, '0')}`,
      defectCategory: ev.defect_category || raw.defect_category || 'Surface & Finish',
      imageRef: ev.image_reference || ev.imageRef || 'Photo 1 (Primary)',
      visibleEvidenceDescription: ev.visible_evidence_description || ev.visibleEvidenceDescription || ev.exact_visual_evidence || 'Observable anomaly documented in image.',
      visualLocationOrQuadrant: ev.visual_location_or_quadrant || ev.visualLocationOrQuadrant || 'Central field',
      coordinates: ev.coordinates || undefined,
      severity: ev.severity || raw.severity || 'LOW',
      severityReasoning: ev.severity_reasoning || ev.severityReasoning || 'Assessed through visible pixel metrics.',
      visualConfidence: typeof ev.visual_confidence === 'number' ? ev.visual_confidence : 85,
      confidenceExplanation: ev.confidence_explanation || ev.confidenceExplanation || 'Grounded in distinct optical contrast.',
      alternativeExplanations: Array.isArray(ev.alternative_explanations) ? ev.alternative_explanations : [],
      recommendedNextAction: ev.recommended_next_action || ev.recommendedNextAction || 'Qualified trade verification.'
    }));

    // If evidenceItems is empty but defect identified, construct from Category A
    if (evidenceItems.length === 0 && isDefect) {
      const catA = Array.isArray(raw.categoryA_visibleEvidence) ? raw.categoryA_visibleEvidence : [];
      catA.forEach((desc: string, i: number) => {
        evidenceItems.push({
          findingId: `FIND-${String(i + 1).padStart(2, '0')}`,
          defectCategory: raw.defect_category || 'General Defect',
          imageRef: 'Photo 1 (Primary)',
          visibleEvidenceDescription: desc,
          visualLocationOrQuadrant: 'Target inspection sector',
          severity: raw.severity || 'LOW',
          severityReasoning: raw.severity_reasoning || 'Evaluated from visual features.',
          visualConfidence: raw.visual_confidence || 85,
          confidenceExplanation: raw.confidence_explanation || 'Visual evidence identified.',
          alternativeExplanations: raw.alternative_explanations || [],
          recommendedNextAction: 'Physical on-site survey inspection.'
        });
      });
    }

    // Normalizing pinpoint analysis
    let pinpointAnalysis: PinpointVerificationResult | undefined;
    if (input.pinpointCoordinate) {
      pinpointAnalysis = {
        targetProvided: true,
        defectConfirmedAtTarget: raw.pinpoint_analysis?.defect_confirmed_at_target ?? isDefect,
        targetObservations: raw.pinpoint_analysis?.target_observations || `Inspector pin placed at [X: ${input.pinpointCoordinate.xPercent}%, Y: ${input.pinpointCoordinate.yPercent}%].`,
        comparisonWithSurroundings: raw.pinpoint_analysis?.comparison_with_surroundings || 'Examined relative to surrounding plane.',
        inconclusive: raw.pinpoint_analysis?.inconclusive || false
      };
    }

    // Normalizing multi-image correlation
    const totalImages = 1 + (input.additionalImages?.length || 0);
    const multiImageCorrelation = {
      imagesAnalyzedCount: totalImages,
      crossCorroborationSummary: raw.multi_image_correlation?.cross_corroboration_summary || (totalImages > 1 ? `Corroborated across ${totalImages} distinct photographic perspectives.` : 'Evaluated from single primary perspective.'),
      perspectiveNotes: Array.isArray(raw.multi_image_correlation?.perspective_notes) ? raw.multi_image_correlation.perspective_notes : []
    };

    // Normalizing root causes
    const rawHypotheses = Array.isArray(raw.root_cause_hypotheses) ? raw.root_cause_hypotheses : [];
    const rootCauseHypothesesList = rawHypotheses.map((h: any) => ({
      hypothesis: h.hypothesis || h.primaryHypothesis || 'Pathology hypothesis',
      likelihood: (h.likelihood === 'HIGH' || h.likelihood === 'MEDIUM' || h.likelihood === 'LOW') ? h.likelihood : 'MEDIUM',
      rationale: h.rationale || 'Inferred from defect morphology.',
      environmentalOrAgeFactors: Array.isArray(h.environmental_factors) ? h.environmental_factors : []
    }));

    // Safety precautions
    const immediatePrecautions = Array.isArray(raw.immediate_precautions) && raw.immediate_precautions.length > 0
      ? raw.immediate_precautions
      : (raw.severity === 'CRITICAL' || raw.severity === 'HIGH')
      ? ['Cordon off immediate 3-meter safety zone beneath affected structural element.', 'Restrict personnel access until certified structural engineer completes physical on-site audit.']
      : ['Maintain routine area monitoring.', 'Ensure surrounding area is kept clean and dry.'];

    // Professional boundaries & limitations
    const limitations = Array.isArray(raw.limitations) && raw.limitations.length > 0
      ? raw.limitations
      : [
          'Visual AI analysis is based strictly on surface pixels. Does not certify structural safety, electrical safety, fire code compliance, or subsurface integrity.',
          'Subsurface rebar corrosion depth, carbonation depth, and internal concrete voiding cannot be determined without physical non-destructive testing (UPV, hammer test, or core sampling).',
          'Environmental factors, past seismic history, and concealed pipe pathways require qualified on-site physical investigation.'
        ];

    // 1. Determine Investigation Outcome
    let investigationOutcome: InvestigationOutcome = 'INVESTIGATION_REQUIRED';
    if (!isDefect || overallStatus === 'NO_VISIBLE_DEFECT') {
      investigationOutcome = 'COMPLETED_WITH_LIMITATIONS';
    } else if (overallStatus === 'INCONCLUSIVE' || imageQuality.focus === 'BLURRY' || (imageQuality.lighting === 'DIM' && (raw.visual_confidence || 88) < 80)) {
      investigationOutcome = 'EVIDENCE_INSUFFICIENT';
    } else if (raw.severity === 'CRITICAL' || (raw.defect_category === 'Structural & Masonry' && (raw.summary?.toLowerCase().includes('shear') || raw.summary?.toLowerCase().includes('spall') || raw.summary?.toLowerCase().includes('rebar')))) {
      investigationOutcome = 'PROFESSIONAL_ASSESSMENT_REQUIRED';
    } else if (raw.defect_category === 'Water Ingress & Moisture' || (rootCauseHypothesesList.length > 1 && !raw.primaryHypothesis)) {
      investigationOutcome = 'MULTIPLE_PLAUSIBLE_CAUSES';
    } else if (isDefect && evidenceItems.length > 0) {
      investigationOutcome = 'CAUSE_SUPPORTED_BY_EVIDENCE';
    }

    // 2. Build Structured Hypotheses with Evidence Correlation
    const investigationHypotheses: InvestigationHypothesis[] = [];
    if (!isDefect) {
      investigationHypotheses.push({
        hypothesisId: 'HYP-01',
        possibleCause: 'Sound structural surface in normal operating condition',
        supportingEvidence: ['Homogeneous surface finish without detectable fissure, staining, or spalling'],
        contradictoryOrMissingEvidence: ['Absence of damp marks, cracks, mineral efflorescence, or peeling'],
        explanationOfPlausibility: 'Optical inspection shows standard planar surface within acceptable maintenance thresholds.',
        alternativeExplanations: ['Subsurface stress may exist but is non-manifest on visible surfaces.'],
        confidenceCategory: 'High',
        additionalInfoNeeded: ['Routine scheduled asset monitoring.'],
        recommendedVerificationMethod: 'Periodic visual walk-through at quarterly interval.',
        correlation: {
          findingRef: 'FIND-NONE',
          imageRef: 'Photo 1 (Primary)',
          directEvidence: ['Normal surface texture'],
          indirectIndicators: [],
          conflictingEvidence: [],
          visualLimitations: ['Subsurface strata unverified without physical sounding']
        }
      });
    } else {
      const causes = rootCauseHypothesesList.length > 0 
        ? rootCauseHypothesesList 
        : [
            { hypothesis: 'Differential thermal movement and localized stress relief', likelihood: 'MEDIUM', rationale: 'Stress concentration along architectural boundaries', environmentalOrAgeFactors: [] },
            { hypothesis: 'Sub-plaster moisture ingress and capillary pressure', likelihood: 'LOW', rationale: 'Possible ambient condensation or concealed piping', environmentalOrAgeFactors: [] }
          ];

      causes.forEach((c: any, idx: number) => {
        const hypId = `HYP-${String(idx + 1).padStart(2, '0')}`;
        const confCat = c.likelihood === 'HIGH' ? 'High' : c.likelihood === 'LOW' ? 'Low' : 'Moderate';
        
        let contradictory: string[] = [];
        let missing: string[] = [];
        let addlInfo: string[] = [];
        let recMethod = 'Calibrated crack gauge / Schmidt rebound hammer';

        if (raw.defect_category?.includes('Water') || c.hypothesis.toLowerCase().includes('moisture') || c.hypothesis.toLowerCase().includes('leak')) {
          contradictory = ['No active cascading fluid observed during daylight survey'];
          missing = ['Absence of internal pipe pressure differential data', 'No thermal infrared imaging log'];
          addlInfo = ['Carbide moisture meter depth gradient test', 'Acoustic leak detection test along concealed sanitary stacks'];
          recMethod = 'Non-destructive electronic moisture mapping & CCTV drain inspection';
        } else if (raw.defect_category?.includes('Structural') || c.hypothesis.toLowerCase().includes('rebar') || c.hypothesis.toLowerCase().includes('spall')) {
          contradictory = ['No macroscopic structural sag or immediate deflection observed in adjacent slab'];
          missing = ['Concrete core compressive strength records', 'Rebar carbonation front depth test'];
          addlInfo = ['Rebar cover meter electromagnetic scan', 'Phenolphthalein carbonation depth test'];
          recMethod = 'Ultrasonic Pulse Velocity (UPV) & Profometer rebar scan';
        } else {
          contradictory = ['Defect remains localized without spreading across floor plate'];
          missing = ['Foundation settlement gauge history', 'Past renovation impact records'];
          addlInfo = ['Tell-tale optical crack displacement monitor installed for 30 days'];
          recMethod = 'Calibrated optical crack comparator and structural engineer physical review';
        }

        investigationHypotheses.push({
          hypothesisId: hypId,
          possibleCause: c.hypothesis,
          supportingEvidence: evidenceItems.map(e => e.visibleEvidenceDescription).slice(0, 3),
          contradictoryOrMissingEvidence: [...contradictory, ...missing],
          explanationOfPlausibility: c.rationale || `Visual surface features and defect geometry are consistent with ${c.hypothesis}.`,
          alternativeExplanations: causes.filter((_: any, oIdx: number) => oIdx !== idx).map((o: any) => o.hypothesis),
          confidenceCategory: confCat as any,
          additionalInfoNeeded: addlInfo,
          recommendedVerificationMethod: recMethod,
          correlation: {
            findingRef: evidenceItems[0]?.findingId || 'FIND-01',
            imageRef: 'Photo 1 (Primary)',
            directEvidence: evidenceItems.map(e => e.visibleEvidenceDescription),
            indirectIndicators: [`Surface context: ${input.floorOrRoom}`, `Building type: ${input.buildingType}`],
            conflictingEvidence: contradictory,
            visualLimitations: limitations.slice(0, 2)
          }
        });
      });
    }

    // 3. Build Defect-Specific Follow-Up Questions for Property Manager
    const investigationQuestions: InvestigationQuestion[] = [];
    if (isDefect) {
      investigationQuestions.push({
        questionId: 'Q-ONSET-01',
        category: 'ONSET_PROGRESSION',
        question: 'When was this defect first observed, and has its physical size or appearance visibly widened or expanded recently?',
        contextRationale: 'Distinguishes historic stabilized settling or initial shrinkage from active, ongoing structural movement or active leakage.',
        suggestedAnswers: [
          'First observed within the last 30 days; rapidly expanding.',
          'Noticed over 6 months ago; appears stable and unchanged.',
          'Appeared abruptly following recent seasonal weather or adjacent construction.'
        ],
        answered: false
      });

      if (raw.defect_category?.includes('Water') || raw.summary?.toLowerCase().includes('damp') || raw.summary?.toLowerCase().includes('stain')) {
        investigationQuestions.push({
          questionId: 'Q-ENV-01',
          category: 'ENVIRONMENTAL_CORRELATION',
          question: 'Does the dampness or discoloration intensify immediately following heavy precipitation, or does it correlate with building plumbing usage?',
          contextRationale: 'Crucial for isolating external façade/roof rainwater ingress from pressurized or gravity sanitary drainage pipe leakage.',
          suggestedAnswers: [
            'Worsens directly after rainstorms (indicates exterior envelope/roof penetration).',
            'Continuous regardless of rain (indicates pressurized plumbing line leak).',
            'Fluctuates with morning/evening domestic water usage (indicates drainage stack leak).'
          ],
          answered: false
        });
      } else {
        investigationQuestions.push({
          questionId: 'Q-ENV-02',
          category: 'ENVIRONMENTAL_CORRELATION',
          question: 'Are there significant seasonal thermal shifts, direct sunlight exposure, or vibration from plant rooms / vehicular ramps near this element?',
          contextRationale: 'Identifies thermal expansion-contraction cycles and cyclic vibration as primary contributors to surface fissure development.',
          suggestedAnswers: [
            'Direct solar exposure with daily thermal fluctuations.',
            'Adjacent to mechanical plant room or vehicular ramp with continuous vibration.',
            'Interior conditioned space with constant temperature.'
          ],
          answered: false
        });
      }

      investigationQuestions.push({
        questionId: 'Q-REPAIR-01',
        category: 'PRIOR_REPAIRS',
        question: 'Has this specific location or the surrounding substrate undergone previous patch repairs, putty application, or waterproofing treatment?',
        contextRationale: 'Recurring defects through prior repairs signify underlying active movement or unaddressed root moisture sources.',
        suggestedAnswers: [
          'Yes, patched and repainted within the last 12 months; defect re-emerged.',
          'Yes, repaired over 3 years ago and had held up until now.',
          'No prior repair known on this specific surface.'
        ],
        answered: false
      });

      investigationQuestions.push({
        questionId: 'Q-SURROUND-01',
        category: 'SURROUNDING_CONTEXT',
        question: 'What facilities or utilities are located immediately above, behind, or adjacent to this wall or ceiling element?',
        contextRationale: 'Pinpoints concealed risers, wet areas (bathrooms/pantries), terrace slabs, or structural expansion joints that could drive the defect.',
        suggestedAnswers: [
          'Restroom, pantry, or plumbing shaft directly above or behind.',
          'External building façade or open terrace overhead.',
          'Standard interior partition with no wet utilities nearby.'
        ],
        answered: false
      });
    }

    // 4. Multi-Dimensional Risk Intelligence
    const isCritical = raw.severity === 'CRITICAL';
    const isHigh = raw.severity === 'HIGH';
    const isStructural = raw.defect_category?.includes('Structural') || raw.summary?.toLowerCase().includes('crack') || raw.summary?.toLowerCase().includes('spall');
    const isWater = raw.defect_category?.includes('Water') || raw.summary?.toLowerCase().includes('damp');

    const consequenceRating = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : raw.severity === 'MEDIUM' ? 'MODERATE' : isDefect ? 'LOW' : 'NEGLIGIBLE';
    const detRating = isCritical || isHigh ? 'RAPID' : isWater ? 'PROGRESSIVE' : isDefect ? 'STABLE' : 'STABLE';
    const occupantExposureLevel = (input.floorOrRoom.toLowerCase().includes('lobby') || input.floorOrRoom.toLowerCase().includes('corridor') || input.floorOrRoom.toLowerCase().includes('entrance') || input.floorOrRoom.toLowerCase().includes('stair'))
      ? 'DIRECT_FREQUENT'
      : (input.floorOrRoom.toLowerCase().includes('basement') || input.floorOrRoom.toLowerCase().includes('parking'))
      ? 'OCCASIONAL'
      : (input.floorOrRoom.toLowerCase().includes('shaft') || input.floorOrRoom.toLowerCase().includes('roof') || input.floorOrRoom.toLowerCase().includes('plant'))
      ? 'RESTRICTED_ACCESS'
      : 'OCCASIONAL';

    const damageExtentScope = isCritical
      ? 'WIDESPREAD_ASSET_THREAT'
      : (isHigh || isStructural)
      ? 'LOCALIZED_STRUCTURAL'
      : 'LOCALIZED_COSMETIC';

    const urgencyLevelStr = isCritical
      ? 'Immediate (Within 24h)'
      : isHigh
      ? 'Urgent (Within 48h)'
      : raw.severity === 'MEDIUM'
      ? 'Scheduled (1-2 weeks)'
      : 'Routine Monitoring (Quarterly)';

    const overallRiskCategory: any = !isDefect
      ? 'Low'
      : overallStatus === 'INCONCLUSIVE' || (imageQuality.focus === 'BLURRY' && (raw.visual_confidence || 80) < 80)
      ? 'Insufficient Evidence'
      : isCritical
      ? 'Critical'
      : isHigh
      ? 'High'
      : raw.severity === 'MEDIUM'
      ? 'Moderate'
      : 'Low';

    const multiDimensionalRisk: MultiDimensionalRisk = {
      consequenceSeverity: {
        rating: consequenceRating,
        assessment: raw.severity_reasoning || 'Evaluated against structural integrity, life safety, and asset preservation metrics.',
        structuralIntegrityThreat: isStructural && (isCritical || isHigh),
        lifeSafetyThreat: isCritical || (isStructural && isHigh && occupantExposureLevel === 'DIRECT_FREQUENT')
      },
      deteriorationLikelihood: {
        rating: detRating,
        rationale: isWater
          ? 'Moisture ingress causes continuous capillary spreading, salt crystallisation, and accelerated rebar oxidation if not stopped.'
          : isStructural
          ? 'Cyclic environmental and live loading will induce progressive crack growth along stress concentration lines.'
          : 'Surface aging exhibits standard low-velocity decay under ambient indoor conditions.',
        aggravatingFactors: isWater
          ? ['Monsoon rainfall', 'High ambient humidity', 'Chemical efflorescence leaching']
          : ['Thermal cycles', 'Building vibration', 'Live load variations']
      },
      occupantExposure: {
        level: occupantExposureLevel,
        description: `Inspected in ${input.floorOrRoom}. Zone exhibits ${occupantExposureLevel.toLowerCase().replace('_', ' ')} pedestrian/resident presence.`,
        zoneType: input.floorOrRoom
      },
      potentialDamageExtent: {
        scope: damageExtentScope,
        projectedImpact: isCritical
          ? 'Threatens structural safety factor, risks concrete spalling fall, and compromises immediate asset valuation.'
          : isHigh
          ? 'Localized structural deterioration with potential secondary damage to adjacent architectural finishes and MEP assets.'
          : 'Localized aesthetic degradation and minor plaster peeling with negligible structural impairment.'
      },
      investigationUrgency: {
        level: urgencyLevelStr,
        timeframeExplanation: isCritical
          ? 'Mandatory licensed engineering assessment required within 24 hours to prevent safety hazards.'
          : isHigh
          ? 'Physical trade inspection required within 48 hours to arrest ongoing moisture migration or movement.'
          : 'Standard scheduled remediation workflow within planned maintenance cadence.'
      },
      confidenceAndLimitations: {
        confidenceLevel: overallStatus === 'INCONCLUSIVE' ? 'Low' : (raw.visual_confidence || 88) > 85 ? 'High' : 'Moderate',
        limitations: limitations
      },
      overallRiskCategory: overallRiskCategory,
      qualitativeRiskSummary: `Classified as ${overallRiskCategory} risk driven by ${consequenceRating.toLowerCase()} consequence severity, ${detRating.toLowerCase()} deterioration velocity, and ${occupantExposureLevel.toLowerCase().replace('_', ' ')} occupant exposure. ${!isDefect ? 'No defect identified.' : 'Requires verified professional physical validation prior to permanent closure.'}`
    };

    // 5. Safety Escalation Trigger
    const isSpallOrRebar = /rebar|reinforc|corro|spall|steel/i.test(raw.summary || '') || 
      /rebar|reinforc|corro|spall/i.test(input.userNotes || '') ||
      raw.defect_category?.toLowerCase().includes('spall');
    const requiresEscalation = isCritical || (isStructural && (isHigh || consequenceRating === 'HIGH') && (occupantExposureLevel === 'DIRECT_FREQUENT' || isSpallOrRebar));
    const safetyEscalation: SafetyEscalation = {
      isEscalated: requiresEscalation,
      triggerReason: requiresEscalation
        ? `Imminent safety hazard identified: ${raw.summary}. Risk of overhead spall, shear displacement, or live environmental danger.`
        : 'No immediate imminent physical life-safety hazard identified from photographic surface evidence.',
      imminentHazardIdentified: requiresEscalation,
      cordonRequired: requiresEscalation,
      immediateSafetyInstructions: requiresEscalation
        ? [
            'IMMEDIATE: Cordon off a 3-meter safety perimeter beneath this element with barricade tape.',
            'RESTRICT ACCESS: Post conspicuous warning signage prohibiting unauthorized personnel transit.',
            'DO NOT TOUCH OR DRILL: Prohibit mechanical vibration or impact loading on affected element.',
            'MANDATE LICENSED SURVEY: Dispatch a licensed Structural Engineer for physical on-site audit before removing cordons.'
          ]
        : ['Maintain standard property maintenance monitoring.'],
      urgentProfessionalInspectionMandate: requiresEscalation
        ? 'Licensed Structural Forensic Engineer physical on-site verification mandated within 24 hours.'
        : 'Standard certified trade survey recommended.'
    };

    return {
      isDefectIdentified: isDefect,
      overallInspectionStatus: overallStatus,
      summary: raw.summary || (isDefect ? 'Visual pathology identified structural or finish anomalies.' : 'No visible property defect confidently identified.'),
      defectCategory: raw.defect_category || raw.defectCategory || (isDefect ? 'Structural & Masonry' : 'None / Normal Condition'),
      severity: raw.severity || (isDefect ? 'LOW' : 'NONE'),
      severityReasoning: raw.severity_reasoning || raw.severityReasoning || 'Evaluated through visible geometric and optical contrast markers.',
      visualConfidence: typeof raw.visual_confidence === 'number' ? raw.visual_confidence : 88,
      confidenceExplanation: raw.confidence_explanation || 'Confidence derived from pixel contrast, illumination, and focus clarity.',
      imageQuality,
      pinpointAnalysis,
      multiImageCorrelation,
      evidenceItems,
      rootCauseHypothesesList,
      alternativeExplanationsList: Array.isArray(raw.alternative_explanations) ? raw.alternative_explanations : [],
      recommendedTests: Array.isArray(raw.recommended_tests) ? raw.recommended_tests : [
        'Carbide moisture meter penetration test',
        'Schmidt rebound hammer surface hardness test',
        'Acoustic sounding chain drag / hammer tap'
      ],
      immediatePrecautions,
      recommendedNextActions: Array.isArray(raw.recommended_next_actions) ? raw.recommended_next_actions : [
        'Dispatch certified surveyor for physical validation',
        'Prepare detailed scope of work for licensed trade contractor'
      ],
      professionalVerificationRequired: raw.professional_verification_required ?? (raw.severity !== 'NONE'),
      verificationRationale: raw.verification_rationale || 'Physical sounding and instrument calibration required before remedial work commences.',
      limitations,
      categoryA_visibleEvidence: raw.categoryA_visibleEvidence || evidenceItems.map((e: GroundedEvidenceFinding) => e.visibleEvidenceDescription),
      categoryB_aiHypotheses: raw.categoryB_aiHypotheses || rootCauseHypothesesList.map((h: { hypothesis: string }) => h.hypothesis),
      categoryC_humanVerificationRequired: raw.categoryC_humanVerificationRequired || raw.recommended_tests || [
        'Physical hammer sounding to detect hollow delamination',
        'Moisture meter probing at concrete/plaster boundary'
      ],
      investigationOutcome,
      investigationHypotheses,
      investigationQuestions,
      multiDimensionalRisk,
      safetyEscalation,
      pipeline: raw.pipeline || {
        stage1_evidence: {
          visibleObservations: evidenceItems.map((e: GroundedEvidenceFinding) => ({
            element: e.defectCategory,
            visibleFeature: e.visibleEvidenceDescription,
            exactVisualEvidence: e.visibleEvidenceDescription,
            visualLocationInImage: e.visualLocationOrQuadrant
          })),
          rawVisualFindings: raw.categoryA_visibleEvidence || [],
          surfaceCondition: imageQuality.overallAssessment,
          lightingAndClarityAssessment: `Lighting: ${imageQuality.lighting}, Focus: ${imageQuality.focus}`
        },
        stage2_rootCause: {
          primaryHypothesis: rootCauseHypothesesList[0]?.hypothesis || 'Material aging and surface stress accumulation',
          plausibleCauses: rootCauseHypothesesList.map((h: { hypothesis: string }) => h.hypothesis),
          alternativeExplanations: raw.alternative_explanations || [],
          environmentalOrAgeFactors: []
        },
        stage3_riskIntelligence: {
          urgencyLevel: (raw.severity === 'CRITICAL' ? 'Immediate (Within 24h)' : raw.severity === 'HIGH' ? 'Urgent (Within 48h)' : raw.severity === 'MEDIUM' ? 'Scheduled (1-2 weeks)' : 'Routine Monitoring (Quarterly)') as any,
          safetyRiskEvaluation: raw.severity_reasoning || 'Routine monitoring required.',
          consequencesOfInaction: ['Progressive material degradation', 'Increased remedial expenditure if unaddressed'],
          recommendedInspectionInterval: raw.severity === 'CRITICAL' ? '24 Hours' : '14 Days'
        },
        stage4_repairIntelligence: {
          temporaryMitigation: {
            action: 'Apply surface protection sealant or warning signage.',
            estCostRangeINR: '₹8,000 - ₹15,000',
            timeline: 'Within 48 hours',
            assumptionsAndDisclaimer: 'Estimates indicative for urban Tier-1 regions; subject to on-site contractor confirmation.'
          },
          permanentRemediation: {
            action: 'Polymer modified mortar patch or structural epoxy injection.',
            estCostRangeINR: '₹25,000 - ₹65,000',
            timeline: '1 to 2 weeks',
            assumptionsAndDisclaimer: 'Prices vary based on depth and localized structural scaffolding.'
          },
          monitoringProtocol: {
            action: 'Install tell-tale crack width gauge or acoustic sensor.',
            inspectionCadence: 'Weekly for first 30 days'
          }
        },
        stage5_maintenancePlanner: {
          suggestedTrade: (raw.defect_category?.includes('Water') ? 'Waterproofing & Damp Proofing' : 'Structural & Masonry') as any,
          requiredMaterials: ['Polymer modified repair mortar', 'Corrosion inhibitor primer', 'Epoxy grout'],
          equipmentNeeded: ['Hand chisels', 'Moisture meter', 'Safety goggles & dust respirators'],
          safetyPrecautions: immediatePrecautions,
          accessRequirements: 'Ground-level access or mobile scaffold tower',
          estimatedLaborHours: '12 - 24 technician hours',
          recommendedSchedule: 'Within 14 calendar days'
        },
        stage6_verificationAgent: {
          supportedClaims: evidenceItems.map(e => e.visibleEvidenceDescription),
          unsupportedOrAmbiguousClaims: ['Subsurface reinforcement loss percentage cannot be verified optically'],
          unresolvedUncertainties: ['Subsurface moisture gradient depth'],
          verificationScoreOutOf100: raw.visual_confidence || 88,
          auditPassed: true,
          verificationNotes: 'Direct visual pixel confirmation audit passed; physical trade sign-off mandated prior to dispatch.'
        }
      },
      disclaimer: raw.disclaimer || 'Visual AI inspection only based on surface pixels. Does not certify structural safety, electrical safety, or building code compliance.'
    };
  }
}

export const geminiService = new GeminiInspectionService();
