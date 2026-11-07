/**
 * ApexProp AI — Autonomous Property Intelligence
 * Database-Ready Domain Models & Schemas (PostgreSQL / Supabase Ready)
 */

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export type BuildingType = 
  | 'Residential' 
  | 'Commercial' 
  | 'Industrial' 
  | 'Mixed Use' 
  | 'Hospitality' 
  | 'Healthcare / Institutional' 
  | 'Warehouse / Logistics';

export type WorkOrderStatus =
  | 'DRAFT'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'READY_FOR_ASSIGNMENT'
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'PENDING_INSPECTION'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PENDING_APPROVAL';

export type TradeCategory = 
  | 'Structural & Masonry'
  | 'Waterproofing & Damp Proofing'
  | 'Plumbing & Drainage'
  | 'Façade & Cladding'
  | 'Roofing & Guttering'
  | 'Electrical & Systems'
  | 'Painting & Surface Restoration'
  | 'General Carpentry'
  | 'HVAC & Ventilation'
  | 'Civil Inspection / Geotechnical';

// --- 1. Property Model ---
export interface Property {
  id: string; // UUID
  name: string;
  location: string;
  buildingType: BuildingType;
  totalFloors?: number;
  yearBuilt?: number;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

// --- 2. InspectionImage Model ---
export interface InspectionImage {
  id: string;
  inspectionId: string;
  imageUrl: string;
  mimeType: string;
  byteSize?: number;
  hashSha256?: string;
  uploadedAt: string;
  isProcessed: boolean;
}

// --- 3. Observation Model ---
export interface Observation {
  id: string;
  inspectionId: string;
  element: string; // e.g. Column B-14, Cantilever Beam
  visibleFeature: string;
  exactVisualEvidence: string;
  visualLocationInImage?: string;
  confidenceNotes?: string;
}

// --- 4. Investigation Model ---
export interface Investigation {
  id: string;
  inspectionId: string;
  primaryHypothesis: string;
  plausibleCauses: string[];
  alternativeExplanations: string[];
  environmentalFactors: string[];
  isVerifiedByHuman: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

// --- 5. RiskAssessment Model ---
export interface RiskAssessment {
  id: string;
  inspectionId: string;
  severity: SeverityLevel;
  severityReasoning: string;
  urgencyLevel: 'Immediate (Within 24h)' | 'Urgent (Within 48h)' | 'Scheduled (1-2 weeks)' | 'Routine Monitoring (Quarterly)' | 'No Action Required';
  safetyRiskEvaluation: string;
  consequencesOfInaction: string[];
  recommendedInterval: string;
  requiresLicensedEngineer: boolean;
}

// --- 6. RepairRecommendation Model ---
export interface RepairRecommendation {
  id: string;
  inspectionId: string;
  temporaryMitigationAction: string;
  temporaryCostRangeINR: string;
  temporaryTimeline: string;
  permanentRemediationAction: string;
  permanentCostRangeINR: string;
  permanentTimeline: string;
  suggestedTrade: TradeCategory;
  costAssumptionsAndDisclaimer: string;
  monitoringProtocol: string;
  monitoringCadence: string;
}

export type OverallInspectionStatus = 'DEFECT_CONFIRMED' | 'VISUAL_FINDING_DETECTED' | 'POTENTIAL_DEFECT' | 'NO_VISIBLE_DEFECT' | 'INCONCLUSIVE';

export interface ImageQualityAssessment {
  resolution: 'HIGH' | 'MEDIUM' | 'LOW';
  lighting: 'OPTIMAL' | 'ADEQUATE' | 'DIM' | 'OVEREXPOSED';
  focus: 'SHARP' | 'MODERATE' | 'BLURRY';
  obstructions: string;
  overallAssessment: string;
}

export interface EvidenceItem {
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
  severity: SeverityLevel;
  severityReasoning: string;
  visualConfidence: number;
  confidenceExplanation: string;
  alternativeExplanations: string[];
  recommendedNextAction: string;
}

export interface PinpointTargetAnalysis {
  targetProvided: boolean;
  defectConfirmedAtTarget: boolean | null;
  targetObservations: string;
  comparisonWithSurroundings: string;
  inconclusive: boolean;
}

// --- 4b. Advanced Root-Cause & Risk Intelligence Domain Models ---
export type InvestigationOutcome = 
  | 'INVESTIGATION_REQUIRED' 
  | 'EVIDENCE_INSUFFICIENT' 
  | 'MULTIPLE_PLAUSIBLE_CAUSES' 
  | 'PROFESSIONAL_ASSESSMENT_REQUIRED' 
  | 'CAUSE_SUPPORTED_BY_EVIDENCE' 
  | 'COMPLETED_WITH_LIMITATIONS';

export type QualitativeConfidence = 'Low' | 'Moderate' | 'High';

export interface EvidenceCorrelationLink {
  findingRef: string;
  imageRef: string;
  coordinates?: {
    yMin?: number;
    xMin?: number;
    yMax?: number;
    xMax?: number;
  };
  directEvidence: string[];
  indirectIndicators: string[];
  conflictingEvidence: string[];
  visualLimitations: string[];
}

export interface InvestigationHypothesis {
  hypothesisId: string;
  possibleCause: string;
  supportingEvidence: string[];
  contradictoryOrMissingEvidence: string[];
  explanationOfPlausibility: string;
  alternativeExplanations: string[];
  confidenceCategory: QualitativeConfidence;
  additionalInfoNeeded: string[];
  recommendedVerificationMethod: string;
  correlation?: EvidenceCorrelationLink;
  humanDecision?: 'ACCEPTED' | 'REJECTED' | 'MODIFIED' | 'PENDING';
  humanNotes?: string;
  isHumanAccepted?: boolean;
}

export type QuestionCategory = 
  | 'ONSET_PROGRESSION' 
  | 'ENVIRONMENTAL_CORRELATION' 
  | 'PRIOR_REPAIRS' 
  | 'SURROUNDING_CONTEXT' 
  | 'MATERIAL_USAGE';

export interface InvestigationQuestion {
  questionId: string;
  question: string;
  category: QuestionCategory;
  contextRationale: string;
  suggestedAnswers?: string[];
  answered: boolean;
  answer?: string;
  answeredAt?: string;
  answeredBy?: string;
  supportingEvidenceUrls?: string[];
}

export type OverallRiskCategory = 'Critical' | 'High' | 'Moderate' | 'Low' | 'Insufficient Evidence';

export interface MultiDimensionalRisk {
  consequenceSeverity: {
    rating: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'NEGLIGIBLE';
    assessment: string;
    structuralIntegrityThreat: boolean;
    lifeSafetyThreat: boolean;
  };
  deteriorationLikelihood: {
    rating: 'RAPID' | 'PROGRESSIVE' | 'STABLE' | 'UNCERTAIN';
    rationale: string;
    aggravatingFactors: string[];
  };
  occupantExposure: {
    level: 'DIRECT_FREQUENT' | 'OCCASIONAL' | 'RESTRICTED_ACCESS' | 'NONE';
    description: string;
    zoneType: string;
  };
  potentialDamageExtent: {
    scope: 'LOCALIZED_COSMETIC' | 'LOCALIZED_STRUCTURAL' | 'WIDESPREAD_ASSET_THREAT';
    projectedImpact: string;
  };
  investigationUrgency: {
    level: 'Immediate (Within 24h)' | 'Urgent (Within 48h)' | 'Scheduled (1-2 weeks)' | 'Routine Monitoring (Quarterly)';
    timeframeExplanation: string;
  };
  confidenceAndLimitations: {
    confidenceLevel: QualitativeConfidence;
    limitations: string[];
  };
  overallRiskCategory: OverallRiskCategory;
  qualitativeRiskSummary: string;
}

export interface SafetyEscalation {
  isEscalated: boolean;
  triggerReason: string;
  imminentHazardIdentified: boolean;
  cordonRequired: boolean;
  immediateSafetyInstructions: string[];
  urgentProfessionalInspectionMandate: string;
}

export interface HumanReviewRecord {
  id: string;
  inspectionId: string;
  reviewerId: string;
  reviewerName: string;
  reviewDate: string;
  action: 'ACCEPT' | 'REJECT' | 'AMEND' | 'REQUEST_INSPECTION' | 'MARK_INSUFFICIENT';
  professionalNotes: string;
  amendedPrimaryCause?: string;
  escalationAcknowledged?: boolean;
}

export interface PortfolioRiskPriorityItem {
  inspectionId: string;
  propertyId?: string;
  propertyName: string;
  location: string;
  defectCategory: string;
  overallRiskCategory: OverallRiskCategory;
  consequenceRating: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'NEGLIGIBLE';
  occupantExposure: string;
  urgency: string;
  unresolvedStatus: boolean;
  priorityRank: number;
  prioritizationReason: string;
  createdAt: string;
  safetyEscalated: boolean;
}

export interface RepeatedDefectAlert {
  defectCategory: string;
  occurrences: number;
  firstSeen: string;
  latestSeen: string;
  trend: 'WORSENING' | 'PERSISTENT' | 'RESOLVING';
  notes: string;
}

export interface PropertyRiskTrend {
  propertyId: string;
  propertyName: string;
  totalInspections: number;
  repeatedDefectAlerts: RepeatedDefectAlert[];
  recurringDampnessDetected: boolean;
  priorRepairsFailing: boolean;
  unresolvedHighPriorityCount: number;
  hasSufficientHistoricalData: boolean;
}

// --- 7. Inspection Model (Aggregate) ---
export interface Inspection {
  id: string;
  propertyId?: string;
  propertyName: string;
  location: string;
  buildingType: BuildingType;
  floorOrRoom: string;
  userNotes?: string;
  imageUrl: string;
  imageMimeType?: string;
  isSampleData: boolean;

  isDefectIdentified: boolean;
  overallInspectionStatus?: OverallInspectionStatus;
  summary: string;
  defectCategory: string;
  severity: SeverityLevel;
  severityReasoning: string;
  visualConfidence?: number;
  confidenceExplanation?: string;

  // Tripartite categories
  categoryA_visibleEvidence: string[];
  categoryB_aiHypotheses: string[];
  categoryC_humanVerificationRequired: string[];

  // Grounded Multi-modal details
  imageQuality?: ImageQualityAssessment;
  evidenceItems?: EvidenceItem[];
  rootCauseHypothesesList?: Array<{
    hypothesis: string;
    likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
    rationale: string;
    environmentalOrAgeFactors?: string[];
  }>;
  alternativeExplanationsList?: string[];
  recommendedTests?: string[];
  immediatePrecautions?: string[];
  recommendedNextActions?: string[];
  professionalVerificationRequired?: boolean;
  verificationRationale?: string;
  limitations?: string[];
  pinpointAnalysis?: PinpointTargetAnalysis;
  multiImageCorrelation?: {
    imagesAnalyzedCount: number;
    crossCorroborationSummary: string;
    perspectiveNotes: string[];
  };

  // Advanced Root-Cause & Risk Engine fields
  investigationOutcome?: InvestigationOutcome;
  investigationHypotheses?: InvestigationHypothesis[];
  investigationQuestions?: InvestigationQuestion[];
  multiDimensionalRisk?: MultiDimensionalRisk;
  safetyEscalation?: SafetyEscalation;
  humanReviews?: HumanReviewRecord[];

  // Investigation Pipeline data
  pipeline: PipelineStageData;

  disclaimer: string;

  approval: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedBy?: string;
    approvedAt?: string;
    approvalNotes?: string;
  };

  // Repair Intelligence & Cost Estimation Engine
  repairPlan?: RepairPlan;
  costEstimates?: RepairCostEstimate[];

  workOrderId?: string;
  createdAt: string;
  updatedAt?: string;
}

// Keep alias for components expecting InspectionRecord
export type InspectionRecord = Inspection;

// --- Contractor Directory Model ---
export interface Contractor {
  id: string;
  userId?: string;
  name: string;
  company: string;
  contactPhone?: string;
  contactEmail?: string;
  trade: TradeCategory;
  serviceCoverage: string;
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  licenseNumber?: string;
  insuranceRef?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt?: string;
}

// --- Execution & Evidence Tracking Models ---
export interface WorkOrderExecutionPhoto {
  id: string;
  type: 'BEFORE' | 'DURING' | 'AFTER';
  url: string;
  caption?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface MaterialUsageRecord {
  id: string;
  materialName: string;
  quantityUsed: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  loggedAt: string;
}

export interface LabourHourRecord {
  id: string;
  technicianName: string;
  trade: string;
  hoursLogged: number;
  hourlyRate: number;
  totalCost: number;
  workDate: string;
  notes?: string;
}

export interface VerificationChecklistRecord {
  id: string;
  item?: string;
  checkpoint?: string;
  passed: boolean;
  notes?: string;
  verifierNotes?: string;
}

// --- Work Order Status Transition History ---
export interface WorkOrderStatusHistory {
  id: string;
  workOrderId: string;
  previousStatus: WorkOrderStatus;
  newStatus: WorkOrderStatus;
  notes?: string;
  evidenceUrl?: string;
  userName?: string;
  createdAt: string;
}

// --- Work Order Change Request (Change Order) ---
export interface WorkOrderChangeRequest {
  id: string;
  workOrderId: string;
  reason: string;
  additionalScope: string;
  proposedCostINR: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  evidenceUrl?: string;
  createdAt: string;
}

// --- In-App Work Order Notification ---
export interface WorkOrderNotification {
  id: string;
  userId?: string;
  workOrderId?: string;
  type: 'APPROVAL_NEEDED' | 'ASSIGNED' | 'ACKNOWLEDGED' | 'SCHEDULED' | 'IN_PROGRESS' | 'ON_HOLD' | 'CHANGE_REQUEST' | 'COMPLETED' | 'VERIFICATION_PENDING' | 'CLOSED';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// --- 8. WorkOrder Model ---
export interface WorkOrder {
  id: string;
  uuid?: string;
  workOrderNumber?: string;
  inspectionId: string;
  propertyId?: string;
  propertyName: string;
  location: string;
  floorOrRoom?: string;
  defectCategory: string;
  title: string;
  trade: TradeCategory;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: WorkOrderStatus;

  // Traceability & Scope links
  repairPlanId?: string;
  estimateId?: string;
  approvedRepairScope?: string;
  investigationSummary?: string;
  riskLevel?: string;

  // Financials (Estimated != Approved != Actual)
  approvedBudgetINR: number;
  actualCostINR: number;
  estimatedCostINR: string;

  // Contractor & Schedule
  contractorId?: string;
  assignedTo: string;
  contractorCompany?: string;
  contractorContact?: string;
  scheduledDate?: string;
  dueDate?: string;

  // Requirements & Scope
  materialsRequired: string[];
  safetyBriefing: string[];
  verificationRequirements?: string[];

  // Execution tracking
  progressPercent: number;
  pausedReason?: string;
  executionPhotos?: WorkOrderExecutionPhoto[];
  materialsUsed?: MaterialUsageRecord[];
  labourHours?: LabourHourRecord[];
  changeRequests?: WorkOrderChangeRequest[];
  statusHistory?: WorkOrderStatusHistory[];

  // Sign-off & Verification
  completionNotes?: string;
  completedAt?: string;
  verificationChecklist?: VerificationChecklistRecord[];
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  closedBy?: string;
  closedAt?: string;
  closedNotes?: string;

  createdAt: string;
  updatedAt: string;
  isSampleData: boolean;
}

// --- 9. WorkOrderUpdate Model (Legacy compatibility) ---
export interface WorkOrderUpdate {
  id: string;
  workOrderId: string;
  previousStatus: WorkOrderStatus;
  newStatus: WorkOrderStatus;
  notes: string;
  updatedBy: string;
  updatedAt: string;
}

// --- Operational & Portfolio Analytics Models ---
export interface OperationalMetrics {
  totalProperties: number;
  totalInspections: number;
  activeDefects: number;
  criticalHighFindings: number;
  openInvestigations: number;
  pendingApprovals: number;
  activeWorkOrders: number;
  overdueWorkOrders: number;
  completedWorkOrders: number;
  verifiedRepairs: number;
  actualExpenditureINR: number;
  approvedBudgetINR: number;
  pendingEstimateValueINR: number;
}

export interface PropertyHealthSummary {
  propertyId: string;
  propertyName: string;
  location: string;
  buildingType: string;
  totalInspections: number;
  activeDefectsCount: number;
  openInvestigationsCount: number;
  pendingWorkOrdersCount: number;
  completedRepairsCount: number;
  verifiedRepairsCount: number;
  approvedBudgetINR: number;
  actualExpenditureINR: number;
  healthScore: number;
  scoringMethodology: string;
  missingDataNote?: string;
  latestAssessmentDate?: string;
}

// --- 10. Report Model ---
export interface Report {
  id: string;
  inspectionId: string;
  propertyName: string;
  reportRef: string;
  generatedBy: string;
  pdfUrl?: string;
  auditScore: number;
  approvalStatus: string;
  createdAt: string;
}

// --- 11. AuditLog Model ---
export interface AuditLog {
  id: string;
  entityType: 'INSPECTION' | 'WORK_ORDER' | 'APPROVAL' | 'SETTINGS';
  entityId: string;
  action: string;
  performedBy: string;
  details: Record<string, any>;
  timestamp: string;
}

// --- Detailed Pipeline Interfaces ---
export interface DefectObservation {
  element: string;
  visibleFeature: string;
  exactVisualEvidence: string;
  visualLocationInImage?: string;
}

export interface PipelineStageData {
  stage1_evidence: {
    visibleObservations: DefectObservation[];
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
    suggestedTrade: TradeCategory;
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
}

// --- Activity & Dashboard Metrics ---
export interface ActivityItem {
  id: string;
  type: 'inspection_completed' | 'defect_detected' | 'report_generated' | 'work_order_updated' | 'work_order_approved';
  title: string;
  propertyName: string;
  timestamp: string;
  severity?: SeverityLevel;
  imageUrl?: string;
  refId: string;
  isSampleData: boolean;
}

export interface DashboardMetrics {
  totalProperties: number;
  openInspections: number;
  issuesDetected: number;
  resolvedWorkOrders: number;
  pendingActions: number;
  healthBreakdown: {
    healthyPercent: number;
    attentionPercent: number;
    criticalPercent: number;
  };
  monthlyDefectTrends: Array<{
    month: string;
    defectsCount: number;
  }>;
  maintenanceCostEstimateINR: {
    totalFormatted: string;
    changePercent: number;
    monthlyBreakdown: Array<{
      month: string;
      amountLakhs: number;
    }>;
  };
  hasSampleData: boolean;
}

// ============================================================================
// Repair Intelligence & Cost Estimation Engine Domain Models
// ============================================================================

export type LineItemCategory =
  | 'MATERIAL'
  | 'LABOUR'
  | 'EQUIPMENT'
  | 'ACCESS_SCAFFOLDING'
  | 'TRANSPORT_DISPOSAL'
  | 'OTHER';

export type MeasurementUnit = 'm²' | 'm³' | 'm' | 'kg' | 'No.' | 'Hour' | 'Day' | 'Lump sum';

export type EstimateStatus =
  | 'DRAFT'
  | 'AWAITING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISION_REQUESTED'
  | 'SUPERSEDED';

export interface RepairMeasurements {
  lengthM?: number;
  widthM?: number;
  depthM?: number;
  areaM2?: number;
  volumeM3?: number;
  unitCount?: number;
  labourHours?: number;
  labourDays?: number;
  notes?: string;
  isMeasuredOnSite?: boolean;
  measurementEvidenceUrl?: string;
  missingMeasurements: string[];
}

export interface RepairEstimateLineItem {
  id: string;
  estimateId?: string;
  category: LineItemCategory;
  description: string;
  quantity: number;
  unit: MeasurementUnit;
  unitRate: number;
  lineTotal: number;
  rateSource: string;
  rateReference?: string;
  isManual: boolean;
  notes?: string;
}

export interface RepairOption {
  id: string;
  repairPlanId?: string;
  optionKey: 'OPTION_A' | 'OPTION_B' | 'OPTION_C';
  title: string;
  approachType: 'LOCALIZED' | 'EXTENSIVE' | 'SPECIALIST_LED';
  scopeOfWork: string;
  requiredMaterials: string[];
  requiredSpecialist: string;
  estimatedDuration: string;
  advantages: string[];
  limitations: string[];
  risks: string[];
  preconditions: string[];
  verificationRequirements: string[];
  isStructurallyAdequate: boolean;
  requiresPEValidation: boolean;
  suggestedLineItems?: Partial<RepairEstimateLineItem>[];
  estimatedCostINR?: string;
  timeline?: string;
  durabilityRating?: string;
  requiresPermits?: boolean;
  notes?: string;
}

export interface RepairPlan {
  id: string;
  inspectionId: string;
  userId?: string;
  propertyId?: string;
  propertyName: string;
  location: string;
  defectCategory: string;
  defectTitle: string;
  observedCondition: string;
  possibleCauses: string[];
  diagnosticTests: string[];
  requiresDiagnosticCheckBeforeRepair: boolean;
  isCosmeticProhibited: boolean;
  repairObjective: string;
  recommendedApproach: string;
  requiredTrade: TradeCategory;
  requiredMaterials: string[];
  requiredTools: string[];
  estimatedWorkforce: string;
  estimatedDurationDays: number;
  estimatedDurationHours: number;
  preparationRequirements: string[];
  stepSequence: string[];
  qcCheckpoints: string[];
  postRepairVerification: string[];
  safetyPrecautions: string[];
  stopWorkConditions: string[];
  permitsAndApprovals: string[];
  limitations: string[];
  professionalConfirmationRequired: boolean;
  professionalConfirmationRationale?: string;
  options: RepairOption[];
  createdAt: string;
  updatedAt: string;
}

export interface RepairCostEstimate {
  id: string;
  estimateNumber?: string;
  versionNumber?: number;
  inspectionId: string;
  userId?: string;
  propertyId?: string;
  repairPlanId?: string;
  repairOptionId?: string;
  selectedOptionKey: 'OPTION_A' | 'OPTION_B' | 'OPTION_C';
  version: number;
  status: EstimateStatus;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  currencySymbol: string;
  measurements: RepairMeasurements;
  lineItems: RepairEstimateLineItem[];
  subtotal: number;
  contingencyPercent?: number | null;
  contingencyAmount: number;
  taxPercent?: number | null;
  taxAmount: number;
  totalAmount: number;
  missingInformationWarnings: string[];
  assumptions: string[];
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  supersededBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepairRateCatalogItem {
  id: string;
  category: LineItemCategory;
  itemName: string;
  unit: MeasurementUnit;
  defaultRateINR: number;
  description?: string;
  region?: string;
}

export interface RepairApprovalHistoryItem {
  id: string;
  estimateId: string;
  userId: string;
  userName: string;
  action: 'DRAFT_CREATED' | 'SUBMITTED_FOR_REVIEW' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED' | 'SUPERSEDED';
  comments?: string;
  timestamp: string;
}

export interface MaintenancePlannerOverview {
  totalRepairRecommendations: number;
  openRepairProposals: number;
  estimatesAwaitingReview: number;
  approvedRepairBudgetsTotalINR: number;
  upcomingPlannedRepairsCount: number;
}
