import {
  WorkOrder,
  WorkOrderStatus,
  Contractor,
  WorkOrderStatusHistory,
  WorkOrderChangeRequest,
  WorkOrderNotification,
  WorkOrderExecutionPhoto,
  MaterialUsageRecord,
  LabourHourRecord,
  VerificationChecklistRecord,
  OperationalMetrics,
  PropertyHealthSummary,
  InspectionRecord
} from '../../src/types';
import { supabaseService } from './supabase.service';

/**
 * Valid state transition matrix for the 15-state Work Order Lifecycle
 */
export const VALID_WORK_ORDER_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  DRAFT: ['AWAITING_APPROVAL', 'CANCELLED'],
  AWAITING_APPROVAL: ['APPROVED', 'REJECTED', 'CANCELLED', 'DRAFT'],
  APPROVED: ['READY_FOR_ASSIGNMENT', 'CANCELLED'],
  READY_FOR_ASSIGNMENT: ['ASSIGNED', 'ON_HOLD', 'CANCELLED'],
  ASSIGNED: ['ACKNOWLEDGED', 'READY_FOR_ASSIGNMENT', 'CANCELLED'],
  ACKNOWLEDGED: ['SCHEDULED', 'READY_FOR_ASSIGNMENT', 'CANCELLED'],
  SCHEDULED: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'PENDING_INSPECTION', 'COMPLETED'],
  ON_HOLD: ['IN_PROGRESS', 'SCHEDULED', 'CANCELLED'],
  PENDING_INSPECTION: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: ['VERIFIED', 'IN_PROGRESS'], // Requires authorized verifier review
  VERIFIED: ['CLOSED'],
  CLOSED: [],
  REJECTED: ['DRAFT', 'CANCELLED'],
  CANCELLED: ['DRAFT'],
  // Backward compatibility with legacy records
  PENDING_APPROVAL: ['APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'CANCELLED']
};

export class WorkOrderService {
  // In-memory repositories to guarantee zero downtime and instant resilience
  private inMemoryContractors: Map<string, Contractor> = new Map();
  private inMemoryWorkOrders: Map<string, WorkOrder> = new Map();
  private inMemoryStatusHistory: Map<string, WorkOrderStatusHistory[]> = new Map();
  private inMemoryChangeRequests: Map<string, WorkOrderChangeRequest[]> = new Map();
  private inMemoryNotifications: Map<string, WorkOrderNotification[]> = new Map();

  constructor() {
    this.seedDefaultContractors();
  }

  private seedDefaultContractors() {
    const defaults: Contractor[] = [
      {
        id: 'cont-001',
        name: 'Rajesh Sharma',
        company: 'Premier Structural Masonry Ltd.',
        contactPhone: '+91 98112 34567',
        contactEmail: 'rajesh@premierstructural.in',
        trade: 'Structural & Masonry',
        serviceCoverage: 'National Capital Region (NCR)',
        availability: 'AVAILABLE',
        licenseNumber: 'DL-PWD-SE-2018-0421',
        insuranceRef: 'ICICI-LOMB-ENG-884210',
        notes: 'Specialist in chemical pressure grouting and carbon fiber wrapping.',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cont-002',
        name: 'Vikram Mehta',
        company: 'Apex Waterproofing & Chemical Solutions',
        contactPhone: '+91 98220 54321',
        contactEmail: 'vikram@apexwaterproofing.in',
        trade: 'Waterproofing & Damp Proofing',
        serviceCoverage: 'Delhi, Gurgaon, Noida',
        availability: 'AVAILABLE',
        licenseNumber: 'HR-ENG-WP-2019-9941',
        insuranceRef: 'BAJAJ-ALL-CIVIL-554109',
        notes: 'Certified applicator for Dr. Fixit & Fosroc crystalline barrier systems.',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cont-003',
        name: 'Anil Sengupta',
        company: 'Metro Hydraulic & Drainage Engineering',
        contactPhone: '+91 98450 87654',
        contactEmail: 'anil@metrohydraulics.in',
        trade: 'Plumbing & Drainage',
        serviceCoverage: 'NCR & Northern Zone',
        availability: 'BUSY',
        licenseNumber: 'DL-NDMC-PLUMB-7740',
        insuranceRef: 'TATA-AIG-IND-339812',
        notes: 'Specializes in acoustic leak detection and commercial riser rehabilitation.',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cont-004',
        name: 'Deepak Verma',
        company: 'Zenith Façade Restorations',
        contactPhone: '+91 98710 11223',
        contactEmail: 'deepak@zenithfacade.in',
        trade: 'Façade & Cladding',
        serviceCoverage: 'Gurgaon, Faridabad',
        availability: 'AVAILABLE',
        licenseNumber: 'HR-URB-FAC-2021-3012',
        insuranceRef: 'HDFC-ERGO-COM-440129',
        notes: 'Equipped with suspended cradle platforms and high-rise rope access personnel.',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      }
    ];

    for (const c of defaults) {
      this.inMemoryContractors.set(c.id, c);
    }
  }

  // --------------------------------------------------------------------------
  // 1. Work Order Lifecycle & Transition Engine
  // --------------------------------------------------------------------------

  public canTransition(currentStatus: WorkOrderStatus, targetStatus: WorkOrderStatus): boolean {
    const allowed = VALID_WORK_ORDER_TRANSITIONS[currentStatus];
    if (!allowed) return false;
    return allowed.includes(targetStatus);
  }

  public validateTransition(
    workOrder: WorkOrder,
    targetStatus: WorkOrderStatus,
    transitionData?: {
      userName?: string;
      notes?: string;
      evidenceUrl?: string;
      verificationChecklist?: VerificationChecklistRecord[];
      pausedReason?: string;
    }
  ): { valid: boolean; reason?: string } {
    if (workOrder.status === targetStatus) {
      return { valid: true };
    }

    if (!this.canTransition(workOrder.status, targetStatus)) {
      return {
        valid: false,
        reason: `Invalid status transition from "${workOrder.status}" to "${targetStatus}". Allowed next statuses: ${VALID_WORK_ORDER_TRANSITIONS[workOrder.status]?.join(', ') || 'None'}.`
      };
    }

    // Safeguard 1: Moving to VERIFIED requires verification checklist and authorized reviewer
    if (targetStatus === 'VERIFIED') {
      if (!transitionData?.userName || transitionData.userName.trim().length === 0) {
        return { valid: false, reason: 'Verification requires the authorized reviewer or engineer name.' };
      }
      if (!transitionData?.notes || transitionData.notes.trim().length === 0) {
        return { valid: false, reason: 'Verification requires documented professional verification notes.' };
      }
      if (!transitionData.verificationChecklist || transitionData.verificationChecklist.length === 0) {
        return { valid: false, reason: 'Verification requires at least one completed quality control checklist item.' };
      }
      const allPassed = transitionData.verificationChecklist.every(item => item.passed === true);
      if (!allPassed) {
        return { valid: false, reason: 'All verification checklist items must pass before marking a work order as VERIFIED.' };
      }
    }

    // Safeguard 2: Moving to CLOSED requires VERIFIED state having been reached
    if (targetStatus === 'CLOSED') {
      if (workOrder.status !== 'VERIFIED') {
        return { valid: false, reason: 'A work order must be in "VERIFIED" status with authorized sign-off before it can be marked "CLOSED".' };
      }
      if (!transitionData?.notes || transitionData.notes.trim().length === 0) {
        return { valid: false, reason: 'Closing a work order requires final completion and archival notes.' };
      }
    }

    // Safeguard 3: Moving to ON_HOLD requires a documented reason
    if (targetStatus === 'ON_HOLD') {
      if (!transitionData?.pausedReason && !transitionData?.notes) {
        return { valid: false, reason: 'Placing a work order ON HOLD requires a specific delay or operational reason.' };
      }
    }

    // Safeguard 4: Moving to ASSIGNED requires a contractor assigned
    if (targetStatus === 'ASSIGNED') {
      if (!workOrder.assignedTo && !workOrder.contractorId) {
        return { valid: false, reason: 'Cannot move to ASSIGNED without selecting a contractor from the directory.' };
      }
    }

    return { valid: true };
  }

  // --------------------------------------------------------------------------
  // 2. Pre-populated Work Order Generation from Inspection, Plan & Estimate
  // --------------------------------------------------------------------------

  public generateWorkOrderRecord(
    params: {
      inspection: InspectionRecord;
      repairPlan?: any;
      estimate?: any;
      selectedOptionIndex?: number;
      assignedContractorId?: string;
      customTitle?: string;
      dueDate?: string;
      scheduledDate?: string;
      initialStatus?: WorkOrderStatus;
      userId?: string;
    }
  ): WorkOrder {
    const { inspection, repairPlan, estimate, assignedContractorId } = params;

    const woNumber = `WO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    // Trace approved estimate and budget
    const approvedBudget = estimate?.totalAmount ||
      (repairPlan?.options?.[0]?.estimatedCostINR ? Number(repairPlan.options[0].estimatedCostINR.replace(/[^0-9.]/g, '')) : 25000);

    const contractor = assignedContractorId ? this.inMemoryContractors.get(assignedContractorId) : undefined;

    // Materials from estimate line items or repair plan
    let materials: string[] = [];
    if (estimate?.lineItems && estimate.lineItems.length > 0) {
      materials = estimate.lineItems
        .filter((i: any) => i.category === 'MATERIAL')
        .map((i: any) => `${i.description} (${i.quantity} ${i.unit || 'units'})`);
    }
    if (materials.length === 0 && repairPlan?.requiredMaterials) {
      materials = Array.isArray(repairPlan.requiredMaterials) ? repairPlan.requiredMaterials : [];
    }
    if (materials.length === 0) {
      materials = ['Specialist repair compounds per approved technical specification'];
    }

    // Safety instructions
    const safety = repairPlan?.safetyPrecautions && repairPlan.safetyPrecautions.length > 0
      ? repairPlan.safetyPrecautions
      : ['Wear mandatory site PPE: Hardhat, high-vis vest, safety boots, eye protection'];

    // Verification requirements
    const verificationReqs = repairPlan?.qcCheckpoints && repairPlan.qcCheckpoints.length > 0
      ? repairPlan.qcCheckpoints
      : [
          'Visual inspection of completed substrate remediation',
          'Soundness check with calibrated non-destructive instrument',
          'Clean-up of work area and photographic documentation'
        ];

    const workOrder: WorkOrder = {
      id: woNumber,
      uuid: `wo-uuid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      workOrderNumber: woNumber,
      inspectionId: inspection.id,
      propertyId: (inspection as any).propertyId || undefined,
      propertyName: inspection.propertyName,
      location: inspection.location,
      floorOrRoom: inspection.floorOrRoom,
      defectCategory: inspection.defectCategory,
      title: params.customTitle || `${inspection.defectCategory} Remediation — ${inspection.propertyName}`,
      trade: (repairPlan?.requiredTrade || inspection.pipeline?.stage5_maintenancePlanner?.suggestedTrade || 'Structural & Masonry') as any,
      priority: (inspection.severity === 'CRITICAL' || inspection.severity === 'HIGH' || inspection.severity === 'MEDIUM')
        ? inspection.severity
        : 'MEDIUM',
      status: params.initialStatus || 'AWAITING_APPROVAL',

      // Traceability links
      repairPlanId: repairPlan?.id || undefined,
      estimateId: estimate?.id || undefined,
      approvedRepairScope: repairPlan?.repairObjective || inspection.summary,
      investigationSummary: inspection.summary,
      riskLevel: `${inspection.severity} Severity`,

      // Financials
      approvedBudgetINR: approvedBudget,
      actualCostINR: 0,
      estimatedCostINR: `₹${approvedBudget.toLocaleString('en-IN')}`,

      // Contractor & Schedule
      contractorId: contractor?.id || undefined,
      assignedTo: contractor ? `${contractor.name} (${contractor.company})` : 'Pending Contractor Selection',
      contractorCompany: contractor?.company || undefined,
      contractorContact: contractor ? `${contractor.contactPhone || ''} | ${contractor.contactEmail || ''}`.trim() : undefined,
      scheduledDate: params.scheduledDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueDate: params.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

      // Requirements
      materialsRequired: materials,
      safetyBriefing: safety,
      verificationRequirements: verificationReqs,

      // Execution tracking
      progressPercent: 0,
      executionPhotos: [],
      materialsUsed: [],
      labourHours: [],
      changeRequests: [],
      statusHistory: [
        {
          id: `hist-${Date.now()}`,
          workOrderId: woNumber,
          previousStatus: 'DRAFT',
          newStatus: params.initialStatus || 'AWAITING_APPROVAL',
          notes: `Work order generated from approved inspection ${inspection.id}. Approved budget: ₹${approvedBudget.toLocaleString('en-IN')}.`,
          userName: 'Property Manager',
          createdAt: now
        }
      ],

      createdAt: now,
      updatedAt: now,
      isSampleData: false
    };

    // Cache locally
    this.inMemoryWorkOrders.set(woNumber, workOrder);
    this.inMemoryStatusHistory.set(woNumber, [...workOrder.statusHistory!]);

    return workOrder;
  }

  public getAllWorkOrders(): WorkOrder[] {
    return Array.from(this.inMemoryWorkOrders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getWorkOrderById(id: string): WorkOrder | undefined {
    return this.inMemoryWorkOrders.get(id) || Array.from(this.inMemoryWorkOrders.values()).find(w => w.uuid === id || w.id === id);
  }

  public saveWorkOrder(workOrder: WorkOrder): WorkOrder {
    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    if (workOrder.uuid) {
      this.inMemoryWorkOrders.set(workOrder.uuid, workOrder);
    }
    return workOrder;
  }

  public deleteWorkOrder(id: string): boolean {
    const wo = this.getWorkOrderById(id);
    if (wo) {
      this.inMemoryWorkOrders.delete(wo.id);
      if (wo.uuid) this.inMemoryWorkOrders.delete(wo.uuid);
      return true;
    }
    return this.inMemoryWorkOrders.delete(id);
  }

  public transitionStatus(
    workOrder: WorkOrder,
    targetStatus: WorkOrderStatus,
    userName: string = 'Property Manager',
    notes?: string,
    extra?: {
      pausedReason?: string;
      verificationChecklist?: VerificationChecklistRecord[];
    }
  ): WorkOrder {
    const validation = this.validateTransition(workOrder, targetStatus, {
      userName,
      notes,
      pausedReason: extra?.pausedReason,
      verificationChecklist: extra?.verificationChecklist
    });
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    const previousStatus = workOrder.status;
    const now = new Date().toISOString();
    workOrder.status = targetStatus;
    workOrder.updatedAt = now;
    if (targetStatus === 'ON_HOLD' && extra?.pausedReason) {
      workOrder.pausedReason = extra.pausedReason;
    } else if (targetStatus === 'IN_PROGRESS') {
      workOrder.pausedReason = undefined;
    }
    if (targetStatus === 'COMPLETED' && !workOrder.completedAt) {
      workOrder.completedAt = now;
    }
    if (notes && targetStatus === 'COMPLETED') {
      workOrder.completionNotes = notes;
    }
    const hist: WorkOrderStatusHistory = {
      id: `hist-${Date.now()}`,
      workOrderId: workOrder.id,
      previousStatus,
      newStatus: targetStatus,
      notes: notes || `Status changed from ${previousStatus} to ${targetStatus}`,
      userName,
      createdAt: now
    };
    if (!workOrder.statusHistory) workOrder.statusHistory = [];
    workOrder.statusHistory.push(hist);
    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    return workOrder;
  }

  // --------------------------------------------------------------------------
  // 3. Contractor Management
  // --------------------------------------------------------------------------

  public getContractors(): Contractor[] {
    return Array.from(this.inMemoryContractors.values());
  }

  public getContractorById(id: string): Contractor | undefined {
    return this.inMemoryContractors.get(id);
  }

  public createContractor(data: Partial<Contractor>, userId?: string): Contractor {
    const id = `cont-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const contractor: Contractor = {
      id,
      userId,
      name: data.name || 'Contractor',
      company: data.company || 'Specialist Services',
      contactPhone: data.contactPhone || '',
      contactEmail: data.contactEmail || '',
      trade: data.trade || 'Structural & Masonry',
      serviceCoverage: data.serviceCoverage || 'Local Region',
      availability: data.availability || 'AVAILABLE',
      licenseNumber: data.licenseNumber || '',
      insuranceRef: data.insuranceRef || '',
      notes: data.notes || '',
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.inMemoryContractors.set(id, contractor);
    return contractor;
  }

  public updateContractor(id: string, updates: Partial<Contractor>): Contractor {
    const existing = this.inMemoryContractors.get(id);
    if (!existing) {
      throw new Error(`Contractor with ID ${id} not found.`);
    }
    const updated: Contractor = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.inMemoryContractors.set(id, updated);
    return updated;
  }

  public assignContractor(
    workOrder: WorkOrder,
    contractorId: string,
    scheduledDate?: string,
    dueDate?: string,
    assignerName: string = 'Property Manager'
  ): { workOrder: WorkOrder; historyEntry: WorkOrderStatusHistory } {
    const contractor = this.inMemoryContractors.get(contractorId);
    if (!contractor) {
      throw new Error(`Contractor ${contractorId} does not exist in directory.`);
    }

    const previousStatus = workOrder.status;
    const targetStatus: WorkOrderStatus = 'ASSIGNED';

    const validation = this.validateTransition(
      { ...workOrder, assignedTo: `${contractor.name} (${contractor.company})`, contractorId: contractor.id },
      targetStatus
    );
    if (!validation.valid && previousStatus !== 'READY_FOR_ASSIGNMENT' && previousStatus !== 'APPROVED') {
      throw new Error(validation.reason);
    }

    const now = new Date().toISOString();
    const historyEntry: WorkOrderStatusHistory = {
      id: `hist-${Date.now()}`,
      workOrderId: workOrder.id,
      previousStatus,
      newStatus: targetStatus,
      notes: `Contractor assigned: ${contractor.name} from ${contractor.company}. Trade: ${contractor.trade}. License: ${contractor.licenseNumber || 'Verified'}.`,
      userName: assignerName,
      createdAt: now
    };

    workOrder.contractorId = contractor.id;
    workOrder.assignedTo = `${contractor.name} (${contractor.company})`;
    workOrder.contractorCompany = contractor.company;
    workOrder.contractorContact = `${contractor.contactPhone || ''} | ${contractor.contactEmail || ''}`.trim();
    if (scheduledDate) workOrder.scheduledDate = scheduledDate;
    if (dueDate) workOrder.dueDate = dueDate;
    workOrder.status = targetStatus;
    workOrder.updatedAt = now;

    if (!workOrder.statusHistory) workOrder.statusHistory = [];
    workOrder.statusHistory.push(historyEntry);

    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    this.addNotification(workOrder.id, 'ASSIGNED', 'Contractor Assigned', `Work order ${workOrder.id} has been assigned to ${contractor.company}.`);

    return { workOrder, historyEntry };
  }

  public acknowledgeAssignment(
    workOrder: WorkOrder,
    contractorName: string,
    notes?: string
  ): { workOrder: WorkOrder; historyEntry: WorkOrderStatusHistory } {
    const previousStatus = workOrder.status;
    const targetStatus: WorkOrderStatus = 'ACKNOWLEDGED';

    const validation = this.validateTransition(workOrder, targetStatus);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const now = new Date().toISOString();
    const historyEntry: WorkOrderStatusHistory = {
      id: `hist-${Date.now()}`,
      workOrderId: workOrder.id,
      previousStatus,
      newStatus: targetStatus,
      notes: notes || `Contractor ${contractorName} acknowledged dispatch terms, safety briefing, and scope.`,
      userName: contractorName,
      createdAt: now
    };

    workOrder.status = targetStatus;
    workOrder.updatedAt = now;
    if (!workOrder.statusHistory) workOrder.statusHistory = [];
    workOrder.statusHistory.push(historyEntry);

    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    this.addNotification(workOrder.id, 'ACKNOWLEDGED', 'Assignment Acknowledged', `Contractor acknowledged work order ${workOrder.id}.`);

    return { workOrder, historyEntry };
  }

  // --------------------------------------------------------------------------
  // 4. Execution Tracking: Progress, Photos, Labour, Materials
  // --------------------------------------------------------------------------

  public updateExecutionProgress(
    workOrder: WorkOrder,
    progressPercent: number,
    notes?: string,
    userName: string = 'Site Supervisor'
  ): WorkOrder {
    const clampedProgress = Math.max(0, Math.min(100, Math.round(progressPercent)));
    workOrder.progressPercent = clampedProgress;
    workOrder.updatedAt = new Date().toISOString();

    // Auto-advance to IN_PROGRESS if scheduled/acknowledged
    if (clampedProgress > 0 && clampedProgress < 100 && (workOrder.status === 'SCHEDULED' || workOrder.status === 'ACKNOWLEDGED')) {
      const prev = workOrder.status;
      workOrder.status = 'IN_PROGRESS';
      const historyEntry: WorkOrderStatusHistory = {
        id: `hist-${Date.now()}`,
        workOrderId: workOrder.id,
        previousStatus: prev,
        newStatus: 'IN_PROGRESS',
        notes: `Work initiated. Progress updated to ${clampedProgress}%. ${notes || ''}`.trim(),
        userName,
        createdAt: new Date().toISOString()
      };
      workOrder.statusHistory?.push(historyEntry);
    }

    // Auto-advance to PENDING_INSPECTION or COMPLETED if progress reaches 100%
    if (clampedProgress === 100 && workOrder.status === 'IN_PROGRESS') {
      const prev = workOrder.status;
      workOrder.status = 'COMPLETED';
      workOrder.completedAt = new Date().toISOString();
      if (notes) workOrder.completionNotes = notes;
      const historyEntry: WorkOrderStatusHistory = {
        id: `hist-${Date.now()}`,
        workOrderId: workOrder.id,
        previousStatus: prev,
        newStatus: 'COMPLETED',
        notes: `Physical remediation reported completed at 100% by contractor. Ready for verification audit. Notes: ${notes || 'Remediation completed per scope.'}`,
        userName,
        createdAt: new Date().toISOString()
      };
      workOrder.statusHistory?.push(historyEntry);
      this.addNotification(workOrder.id, 'COMPLETED', 'Work Order Completed', `Contractor reported 100% completion for ${workOrder.id}. Verification required.`);
    }

    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    return workOrder;
  }

  public addExecutionPhoto(
    workOrder: WorkOrder,
    photo: { type: 'BEFORE' | 'DURING' | 'AFTER'; url: string; caption?: string; uploadedBy?: string }
  ): WorkOrderExecutionPhoto {
    const record: WorkOrderExecutionPhoto = {
      id: `photo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: photo.type,
      url: photo.url,
      caption: photo.caption || `${photo.type} execution photograph`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: photo.uploadedBy || 'Field Technician'
    };

    if (!workOrder.executionPhotos) workOrder.executionPhotos = [];
    workOrder.executionPhotos.push(record);
    workOrder.updatedAt = new Date().toISOString();
    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    return record;
  }

  public logMaterialUsage(
    workOrder: WorkOrder,
    item: { materialName: string; quantityUsed: number; unit: string; costPerUnit: number }
  ): MaterialUsageRecord {
    const totalCost = Math.round(item.quantityUsed * item.costPerUnit * 100) / 100;
    const record: MaterialUsageRecord = {
      id: `mat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      materialName: item.materialName,
      quantityUsed: item.quantityUsed,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      totalCost,
      loggedAt: new Date().toISOString()
    };

    if (!workOrder.materialsUsed) workOrder.materialsUsed = [];
    workOrder.materialsUsed.push(record);

    // Increment actual cost
    workOrder.actualCostINR = Math.round((workOrder.actualCostINR + totalCost) * 100) / 100;
    workOrder.updatedAt = new Date().toISOString();
    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    return record;
  }

  public logLabourHours(
    workOrder: WorkOrder,
    recordData: { technicianName: string; trade: string; hoursLogged: number; hourlyRate: number; workDate?: string; notes?: string }
  ): LabourHourRecord {
    const totalCost = Math.round(recordData.hoursLogged * recordData.hourlyRate * 100) / 100;
    const record: LabourHourRecord = {
      id: `lab-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      technicianName: recordData.technicianName,
      trade: recordData.trade,
      hoursLogged: recordData.hoursLogged,
      hourlyRate: recordData.hourlyRate,
      totalCost,
      workDate: recordData.workDate || new Date().toISOString().split('T')[0],
      notes: recordData.notes
    };

    if (!workOrder.labourHours) workOrder.labourHours = [];
    workOrder.labourHours.push(record);

    // Increment actual cost
    workOrder.actualCostINR = Math.round((workOrder.actualCostINR + totalCost) * 100) / 100;
    workOrder.updatedAt = new Date().toISOString();
    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    return record;
  }

  public pauseWork(workOrder: WorkOrder, delayReason: string, userName: string = 'Site Supervisor'): WorkOrder {
    const previousStatus = workOrder.status;
    const validation = this.validateTransition(workOrder, 'ON_HOLD', { pausedReason: delayReason });
    if (!validation.valid) throw new Error(validation.reason);

    const now = new Date().toISOString();
    workOrder.status = 'ON_HOLD';
    workOrder.pausedReason = delayReason;
    workOrder.updatedAt = now;

    const historyEntry: WorkOrderStatusHistory = {
      id: `hist-${Date.now()}`,
      workOrderId: workOrder.id,
      previousStatus,
      newStatus: 'ON_HOLD',
      notes: `Work suspended / paused. Reason: ${delayReason}`,
      userName,
      createdAt: now
    };
    workOrder.statusHistory?.push(historyEntry);
    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    this.addNotification(workOrder.id, 'ON_HOLD', 'Work Order Paused', `Work on ${workOrder.id} paused: ${delayReason}`);
    return workOrder;
  }

  public resumeWork(workOrder: WorkOrder, userName: string = 'Site Supervisor'): WorkOrder {
    const previousStatus = workOrder.status;
    const validation = this.validateTransition(workOrder, 'IN_PROGRESS');
    if (!validation.valid) throw new Error(validation.reason);

    const now = new Date().toISOString();
    workOrder.status = 'IN_PROGRESS';
    workOrder.pausedReason = undefined;
    workOrder.updatedAt = now;

    const historyEntry: WorkOrderStatusHistory = {
      id: `hist-${Date.now()}`,
      workOrderId: workOrder.id,
      previousStatus,
      newStatus: 'IN_PROGRESS',
      notes: 'Work resumed on site after pause.',
      userName,
      createdAt: now
    };
    workOrder.statusHistory?.push(historyEntry);
    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    return workOrder;
  }

  // --------------------------------------------------------------------------
  // 5. Change Requests & Additional Costs (Change Orders)
  // --------------------------------------------------------------------------

  public createChangeRequest(
    workOrder: WorkOrder,
    data: { reason: string; additionalScope: string; proposedCostINR: number; evidenceUrl?: string; submittedBy?: string }
  ): WorkOrderChangeRequest {
    if (data.proposedCostINR <= 0) {
      throw new Error('Proposed additional cost must be a positive number.');
    }
    if (!data.reason || data.reason.trim().length === 0) {
      throw new Error('A detailed reason for the change order is mandatory.');
    }

    const crId = `cr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const cr: WorkOrderChangeRequest = {
      id: crId,
      workOrderId: workOrder.id,
      reason: data.reason,
      additionalScope: data.additionalScope,
      proposedCostINR: Number(data.proposedCostINR),
      status: 'PENDING',
      evidenceUrl: data.evidenceUrl,
      createdAt: new Date().toISOString()
    };

    if (!workOrder.changeRequests) workOrder.changeRequests = [];
    workOrder.changeRequests.push(cr);

    // History record
    const hist: WorkOrderStatusHistory = {
      id: `hist-${Date.now()}`,
      workOrderId: workOrder.id,
      previousStatus: workOrder.status,
      newStatus: workOrder.status,
      notes: `Change Order requested: ₹${data.proposedCostINR.toLocaleString('en-IN')} for "${data.reason}". Awaiting management review.`,
      userName: data.submittedBy || 'Contractor',
      createdAt: new Date().toISOString()
    };
    workOrder.statusHistory?.push(hist);

    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    this.addNotification(workOrder.id, 'CHANGE_REQUEST', 'Change Request Submitted', `Additional ₹${data.proposedCostINR.toLocaleString('en-IN')} requested for ${workOrder.id}.`);
    return cr;
  }

  public reviewChangeRequest(
    workOrder: WorkOrder,
    changeRequestId: string,
    action: 'APPROVED' | 'REJECTED',
    reviewNotes: string,
    reviewerName: string = 'Property Manager'
  ): WorkOrderChangeRequest {
    const cr = workOrder.changeRequests?.find(c => c.id === changeRequestId);
    if (!cr) {
      throw new Error(`Change Request ${changeRequestId} not found on work order ${workOrder.id}.`);
    }
    if (cr.status !== 'PENDING') {
      throw new Error(`Change Request ${changeRequestId} has already been ${cr.status}.`);
    }

    const now = new Date().toISOString();
    cr.status = action;
    cr.reviewedBy = reviewerName;
    cr.reviewedAt = now;
    cr.reviewNotes = reviewNotes;

    // Never silently modify budget; if approved, update budget with audit trail
    if (action === 'APPROVED') {
      const prevBudget = workOrder.approvedBudgetINR;
      workOrder.approvedBudgetINR = Math.round((workOrder.approvedBudgetINR + cr.proposedCostINR) * 100) / 100;
      workOrder.estimatedCostINR = `₹${workOrder.approvedBudgetINR.toLocaleString('en-IN')}`;

      const hist: WorkOrderStatusHistory = {
        id: `hist-${Date.now()}`,
        workOrderId: workOrder.id,
        previousStatus: workOrder.status,
        newStatus: workOrder.status,
        notes: `Change Order APPROVED by ${reviewerName}. Budget revised from ₹${prevBudget.toLocaleString('en-IN')} to ₹${workOrder.approvedBudgetINR.toLocaleString('en-IN')} (+₹${cr.proposedCostINR.toLocaleString('en-IN')}). Notes: ${reviewNotes}`,
        userName: reviewerName,
        createdAt: now
      };
      workOrder.statusHistory?.push(hist);
    } else {
      const hist: WorkOrderStatusHistory = {
        id: `hist-${Date.now()}`,
        workOrderId: workOrder.id,
        previousStatus: workOrder.status,
        newStatus: workOrder.status,
        notes: `Change Order REJECTED by ${reviewerName}. Reason: ${reviewNotes}`,
        userName: reviewerName,
        createdAt: now
      };
      workOrder.statusHistory?.push(hist);
    }

    workOrder.updatedAt = now;
    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    return cr;
  }

  // --------------------------------------------------------------------------
  // 6. Verification and Closure
  // --------------------------------------------------------------------------

  public verifyWorkOrder(
    workOrder: WorkOrder,
    verifierName: string,
    notes: string,
    checklist: VerificationChecklistRecord[]
  ): WorkOrder {
    const validation = this.validateTransition(workOrder, 'VERIFIED', {
      userName: verifierName,
      notes,
      verificationChecklist: checklist
    });
    if (!validation.valid) throw new Error(validation.reason);

    const now = new Date().toISOString();
    const previousStatus = workOrder.status;
    workOrder.status = 'VERIFIED';
    workOrder.verifiedBy = verifierName;
    workOrder.verifiedAt = now;
    workOrder.verificationNotes = notes;
    workOrder.verificationChecklist = checklist;
    workOrder.updatedAt = now;

    const hist: WorkOrderStatusHistory = {
      id: `hist-${Date.now()}`,
      workOrderId: workOrder.id,
      previousStatus,
      newStatus: 'VERIFIED',
      notes: `Quality verification completed and certified by ${verifierName}. All ${checklist.length} QC checkpoints passed. Notes: ${notes}`,
      userName: verifierName,
      createdAt: now
    };
    workOrder.statusHistory?.push(hist);

    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    this.addNotification(workOrder.id, 'VERIFICATION_PENDING', 'Work Order Verified', `Quality verification certified by ${verifierName} for ${workOrder.id}.`);
    return workOrder;
  }

  public closeWorkOrder(
    workOrder: WorkOrder,
    closerName: string,
    notes: string
  ): WorkOrder {
    const validation = this.validateTransition(workOrder, 'CLOSED', {
      userName: closerName,
      notes
    });
    if (!validation.valid) throw new Error(validation.reason);

    const now = new Date().toISOString();
    const previousStatus = workOrder.status;
    workOrder.status = 'CLOSED';
    workOrder.closedBy = closerName;
    workOrder.closedAt = now;
    workOrder.closedNotes = notes;
    workOrder.updatedAt = now;

    const hist: WorkOrderStatusHistory = {
      id: `hist-${Date.now()}`,
      workOrderId: workOrder.id,
      previousStatus,
      newStatus: 'CLOSED',
      notes: `Work order officially closed and archived by ${closerName}. Final actual expenditure: ₹${workOrder.actualCostINR.toLocaleString('en-IN')}. Notes: ${notes}`,
      userName: closerName,
      createdAt: now
    };
    workOrder.statusHistory?.push(hist);

    this.inMemoryWorkOrders.set(workOrder.id, workOrder);
    this.addNotification(workOrder.id, 'CLOSED', 'Work Order Closed', `Work order ${workOrder.id} has been formally closed and archived.`);
    return workOrder;
  }

  // --------------------------------------------------------------------------
  // 7. Notifications
  // --------------------------------------------------------------------------

  public addNotification(workOrderId: string, type: any, title: string, message: string, userId?: string): WorkOrderNotification {
    const notif: WorkOrderNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      workOrderId,
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    const userKey = userId || 'all';
    const list = this.inMemoryNotifications.get(userKey) || [];
    list.unshift(notif);
    this.inMemoryNotifications.set(userKey, list);
    return notif;
  }

  public getNotifications(userId?: string): WorkOrderNotification[] {
    const userKey = userId || 'all';
    return this.inMemoryNotifications.get(userKey) || [];
  }

  public markNotificationAsRead(id: string, userId?: string): boolean {
    const userKey = userId || 'all';
    const list = this.inMemoryNotifications.get(userKey) || [];
    const target = list.find(n => n.id === id);
    if (target) {
      target.isRead = true;
      return true;
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // 8. Operational & Portfolio Analytics Calculations
  // --------------------------------------------------------------------------

  public calculateOperationalAnalytics(
    arg1: any,
    arg2?: InspectionRecord[],
    arg3?: WorkOrder[],
    arg4?: any[]
  ): OperationalMetrics {
    let properties: any[] = [];
    let inspections: InspectionRecord[] = [];
    let workOrders: WorkOrder[] = [];
    let repairPlans: any[] = [];

    if (Array.isArray(arg1)) {
      properties = arg1;
      inspections = arg2 || [];
      workOrders = arg3 || [];
      repairPlans = arg4 || [];
    } else if (arg1 && typeof arg1 === 'object') {
      properties = arg1.properties || [];
      inspections = arg1.inspections || [];
      workOrders = arg1.workOrders || [];
      repairPlans = arg1.repairPlans || arg1.estimates || [];
    }

    const totalProperties = properties.length;
    const totalInspections = inspections.length;
    const activeDefects = inspections.filter(i => i.isDefectIdentified && i.approval?.status !== 'APPROVED').length;
    const criticalHighFindings = inspections.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
    const openInvestigations = inspections.filter(i => i.investigationOutcome && i.investigationOutcome !== 'CAUSE_SUPPORTED_BY_EVIDENCE').length;
    const pendingApprovals = inspections.filter(i => i.approval?.status === 'PENDING').length +
      workOrders.filter(w => w.status === 'AWAITING_APPROVAL' || w.status === 'PENDING_APPROVAL').length;

    const activeWorkOrders = workOrders.filter(w =>
      ['READY_FOR_ASSIGNMENT', 'ASSIGNED', 'ACKNOWLEDGED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'PENDING_INSPECTION'].includes(w.status)
    ).length;

    const overdueWorkOrders = workOrders.filter(w => {
      if (!w.dueDate || ['COMPLETED', 'VERIFIED', 'CLOSED', 'CANCELLED', 'REJECTED'].includes(w.status)) return false;
      return new Date(w.dueDate) < new Date();
    }).length;

    const completedWorkOrders = workOrders.filter(w => w.status === 'COMPLETED').length;
    const verifiedRepairs = workOrders.filter(w => w.status === 'VERIFIED' || w.status === 'CLOSED').length;

    // Actual expenditure vs Approved budget vs Pending estimate value
    let actualExpenditureINR = 0;
    let approvedBudgetINR = 0;
    for (const w of workOrders) {
      actualExpenditureINR += (w.actualCostINR || 0);
      approvedBudgetINR += (w.approvedBudgetINR || 0);
    }

    let pendingEstimateValueINR = 0;
    for (const p of repairPlans) {
      if (p.totalEstimatedCostINR) {
        pendingEstimateValueINR += p.totalEstimatedCostINR;
      }
    }

    return {
      totalProperties,
      totalInspections,
      activeDefects,
      criticalHighFindings,
      openInvestigations,
      pendingApprovals,
      activeWorkOrders,
      overdueWorkOrders,
      completedWorkOrders,
      verifiedRepairs,
      actualExpenditureINR: Math.round(actualExpenditureINR * 100) / 100,
      approvedBudgetINR: Math.round(approvedBudgetINR * 100) / 100,
      pendingEstimateValueINR: Math.round(pendingEstimateValueINR * 100) / 100
    };
  }

  public calculatePropertyHealthSummaries(
    arg1: any,
    arg2?: InspectionRecord[],
    arg3?: WorkOrder[]
  ): PropertyHealthSummary[] {
    let properties: any[] = [];
    let inspections: InspectionRecord[] = [];
    let workOrders: WorkOrder[] = [];

    if (Array.isArray(arg1)) {
      properties = arg1;
      inspections = arg2 || [];
      workOrders = arg3 || [];
    } else if (arg1 && typeof arg1 === 'object') {
      properties = arg1.properties || [];
      inspections = arg1.inspections || [];
      workOrders = arg1.workOrders || [];
    }

    return properties.map(prop => {
      const propInspections = inspections.filter(i => i.propertyName === prop.name || (i as any).propertyId === prop.id);
      const propWorkOrders = workOrders.filter(w => w.propertyName === prop.name || w.propertyId === prop.id);

      const totalInspections = propInspections.length;
      const activeDefectsCount = propInspections.filter(i => i.isDefectIdentified && i.approval?.status !== 'APPROVED').length;
      const openInvestigationsCount = propInspections.filter(i => i.investigationOutcome && i.investigationOutcome !== 'CAUSE_SUPPORTED_BY_EVIDENCE').length;
      const pendingWorkOrdersCount = propWorkOrders.filter(w => !['COMPLETED', 'VERIFIED', 'CLOSED', 'CANCELLED'].includes(w.status)).length;
      const completedRepairsCount = propWorkOrders.filter(w => w.status === 'COMPLETED').length;
      const verifiedRepairsCount = propWorkOrders.filter(w => w.status === 'VERIFIED' || w.status === 'CLOSED').length;

      let approvedBudgetINR = 0;
      let actualExpenditureINR = 0;
      for (const w of propWorkOrders) {
        approvedBudgetINR += (w.approvedBudgetINR || 0);
        actualExpenditureINR += (w.actualCostINR || 0);
      }

      // Transparent, defensible health scoring methodology:
      // Start at 100 baseline.
      // Deduct 25 for each critical defect, 15 for high, 5 for medium.
      // Add 5 points per verified repair (capped at 100).
      let score = 100;
      if (totalInspections === 0) {
        score = 0; // Honest empty state
      } else {
        const crit = propInspections.filter(i => i.severity === 'CRITICAL').length;
        const high = propInspections.filter(i => i.severity === 'HIGH').length;
        const med = propInspections.filter(i => i.severity === 'MEDIUM').length;
        score = Math.max(10, Math.min(100, 100 - (crit * 25 + high * 15 + med * 5) + (verifiedRepairsCount * 8)));
      }

      // Latest assessment date
      const sortedDates = propInspections
        .map(i => i.createdAt)
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      return {
        propertyId: prop.id,
        propertyName: prop.name,
        location: prop.location,
        buildingType: prop.building_type || prop.buildingType || 'Commercial',
        totalInspections,
        activeDefectsCount,
        openInvestigationsCount,
        pendingWorkOrdersCount,
        completedRepairsCount,
        verifiedRepairsCount,
        approvedBudgetINR: Math.round(approvedBudgetINR * 100) / 100,
        actualExpenditureINR: Math.round(actualExpenditureINR * 100) / 100,
        healthScore: score,
        scoringMethodology: 'Operational Maintenance Rating computed from defect severity density and verified remediation. Non-structural indicator under IS 456 / NBC 2016.',
        missingDataNote: totalInspections < 2 ? 'Baseline limited (<2 inspection cycles).' : undefined,
        latestAssessmentDate: sortedDates[0] || undefined
      };
    });
  }
}

export const workOrderService = new WorkOrderService();
