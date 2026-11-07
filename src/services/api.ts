import {
  InspectionRecord,
  WorkOrder,
  WorkOrderStatus,
  ActivityItem,
  DashboardMetrics,
  Contractor,
  WorkOrderNotification,
  OperationalMetrics,
  PropertyHealthSummary,
  WorkOrderChangeRequest,
  MaterialUsageRecord,
  LabourHourRecord,
  VerificationChecklistRecord
} from '../types';
import { getAuthHeader } from './supabaseClient';

async function getHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    ...customHeaders
  };
  const authHeader = await getAuthHeader();
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }
  return headers;
}

export async function fetchHealth() {
  const headers = await getHeaders();
  const res = await fetch('/api/health', { headers });
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchSupabaseStatus() {
  const headers = await getHeaders();
  const res = await fetch('/api/supabase/status', { headers });
  if (!res.ok) throw new Error('Failed to retrieve Supabase status');
  return res.json();
}

export async function updateSupabaseConfig(supabaseUrl: string, supabaseAnonKey: string) {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/supabase/config', {
    method: 'POST',
    headers,
    body: JSON.stringify({ supabaseUrl, supabaseAnonKey })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update Supabase configuration');
  return data;
}

export async function seedSupabaseData() {
  const headers = await getHeaders();
  const res = await fetch('/api/supabase/seed', {
    method: 'POST',
    headers
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to seed baseline data in Supabase');
  return data;
}

export async function fetchMetrics(): Promise<DashboardMetrics> {
  const headers = await getHeaders();
  const res = await fetch('/api/metrics', { headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch dashboard metrics');
  }
  return data;
}

export async function fetchInspections(): Promise<InspectionRecord[]> {
  const headers = await getHeaders();
  const res = await fetch('/api/inspections', { headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch inspections');
  }
  return data;
}

export async function fetchInspectionById(id: string): Promise<InspectionRecord> {
  const headers = await getHeaders();
  const res = await fetch(`/api/inspections/${id}`, { headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Inspection not found');
  }
  return data;
}

export async function inspectPropertyImage(payload: {
  imageBase64: string;
  mimeType: string;
  propertyName: string;
  location: string;
  buildingType: string;
  floorOrRoom: string;
  userNotes?: string;
  pinpointCoordinate?: any;
  additionalImages?: any[];
}): Promise<InspectionRecord> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/inspect', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to inspect property image');
  }
  return data;
}

export async function approveInspection(id: string, notes?: string, approvedBy?: string): Promise<InspectionRecord> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/inspections/${id}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ notes, approvedBy })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to approve inspection');
  }
  return data;
}

export async function fetchWorkOrders(): Promise<WorkOrder[]> {
  const headers = await getHeaders();
  const res = await fetch('/api/work-orders', { headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch work orders');
  }
  return data;
}

export async function createWorkOrder(payload: Partial<WorkOrder>): Promise<WorkOrder> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/work-orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create work order');
  }
  return data;
}

export async function updateWorkOrder(id: string, updates: Partial<WorkOrder>): Promise<WorkOrder> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update work order');
  }
  return data;
}

export async function fetchActivity(): Promise<ActivityItem[]> {
  const headers = await getHeaders();
  const res = await fetch('/api/activity', { headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch recent activity');
  }
  return data;
}

export async function fetchSqlMigration(): Promise<string> {
  const res = await fetch('/api/schema/sql');
  if (!res.ok) throw new Error('Failed to fetch SQL migration schema');
  return res.text();
}

export async function fetchSettings(): Promise<any> {
  const saved = localStorage.getItem('apexprop_settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return {
    organizationName: 'ApexProp Assets Group',
    inspectorName: 'Suresh Chandragiri',
    inspectorTitle: 'Property Manager',
    alertEmail: 'sureshsmart669@gmail.com',
    emergencyHotline: '+91 98765 43210',
    currency: 'INR (₹)'
  };
}

export async function updateSettings(newSettings: any): Promise<any> {
  localStorage.setItem('apexprop_settings', JSON.stringify(newSettings));
  return newSettings;
}

// --- Repair Intelligence & Cost Estimation API Methods ---

export async function fetchRateCatalog() {
  const headers = await getHeaders();
  const res = await fetch('/api/rate-catalog', { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch rate catalog');
  return data;
}

export async function fetchMaintenancePlannerOverview() {
  const headers = await getHeaders();
  const res = await fetch('/api/maintenance-planner/overview', { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch maintenance planner overview');
  return data;
}

export async function fetchRepairPlan(inspectionId: string) {
  const headers = await getHeaders();
  const res = await fetch(`/api/repair-plans/${inspectionId}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch repair plan');
  return data;
}

export async function saveRepairPlan(inspectionId: string, plan: any) {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/repair-plans/${inspectionId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(plan)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save repair plan');
  return data;
}

export async function fetchRepairEstimates(inspectionId: string) {
  const headers = await getHeaders();
  const res = await fetch(`/api/repair-estimates/${inspectionId}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch repair estimates');
  return data;
}

export async function calculateEstimatePreview(payload: any) {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/repair-estimates/calculate-preview', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to calculate preview');
  return data;
}

export async function saveRepairEstimate(inspectionId: string, estimate: any) {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/repair-estimates/${inspectionId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(estimate)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save repair estimate');
  return data;
}

export async function updateEstimateStatus(estimateId: string, action: string, notes?: string, actorName?: string) {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/repair-estimates/${estimateId}/status`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, notes, actorName })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update estimate status');
  return data;
}

export async function reviseRepairEstimate(estimateId: string, payload: any) {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/repair-estimates/${estimateId}/revise`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to revise repair estimate');
  return data;
}

// ============================================================================
// WORK ORDER LIFECYCLE, EXECUTION & APPROVALS (PROMPT 9)
// ============================================================================

export async function generateWorkOrder(payload: {
  inspection: InspectionRecord;
  repairPlan?: any;
  estimate?: any;
  assignedContractorId?: string;
  customTitle?: string;
  dueDate?: string;
  scheduledDate?: string;
  initialStatus?: WorkOrderStatus;
}): Promise<WorkOrder> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/work-orders/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate work order');
  return data;
}

export async function transitionWorkOrderStatus(
  id: string,
  targetStatus: WorkOrderStatus,
  userName: string = 'Property Manager',
  notes?: string,
  extra?: { pausedReason?: string; verificationChecklist?: VerificationChecklistRecord[] }
): Promise<WorkOrder> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}/transition`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ targetStatus, userName, notes, extra })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to transition work order status');
  return data;
}

export async function assignContractorToWorkOrder(
  id: string,
  contractorId: string,
  scheduledDate?: string,
  dueDate?: string,
  assignerName: string = 'Property Manager'
): Promise<{ workOrder: WorkOrder }> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}/assign`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ contractorId, scheduledDate, dueDate, assignerName })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to assign contractor');
  return data;
}

export async function acknowledgeWorkOrderAssignment(
  id: string,
  contractorName: string,
  notes?: string
): Promise<{ workOrder: WorkOrder }> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}/acknowledge`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ contractorName, notes })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to acknowledge assignment');
  return data;
}

export async function updateWorkOrderProgress(
  id: string,
  progressPercent: number,
  notes?: string,
  userName: string = 'Site Supervisor'
): Promise<WorkOrder> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}/progress`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ progressPercent, notes, userName })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update progress');
  return data;
}

export async function pauseWorkOrder(
  id: string,
  delayReason: string,
  userName: string = 'Site Supervisor'
): Promise<WorkOrder> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}/pause`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ delayReason, userName })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to pause work order');
  return data;
}

export async function resumeWorkOrder(
  id: string,
  userName: string = 'Site Supervisor'
): Promise<WorkOrder> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}/resume`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userName })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to resume work order');
  return data;
}

export async function addWorkOrderPhoto(
  id: string,
  photo: { type: 'BEFORE' | 'DURING' | 'AFTER'; url: string; caption?: string; uploadedBy?: string }
) {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}/photos`, {
    method: 'POST',
    headers,
    body: JSON.stringify(photo)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload execution photo');
  return data;
}

export async function logWorkOrderMaterial(
  id: string,
  material: { materialName: string; quantityUsed: number; unit: string; costPerUnit: number }
): Promise<MaterialUsageRecord> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}/materials`, {
    method: 'POST',
    headers,
    body: JSON.stringify(material)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to log material usage');
  return data;
}

export async function logWorkOrderLabour(
  id: string,
  labour: { technicianName: string; trade: string; hoursLogged: number; hourlyRate: number; workDate?: string; notes?: string }
): Promise<LabourHourRecord> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}/labour`, {
    method: 'POST',
    headers,
    body: JSON.stringify(labour)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to log labour hours');
  return data;
}

export async function createWorkOrderChangeRequest(
  id: string,
  changeData: { reason: string; additionalScope: string; proposedCostINR: number; evidenceUrl?: string; submittedBy?: string }
): Promise<WorkOrderChangeRequest> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}/change-requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify(changeData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit change request');
  return data;
}

export async function reviewWorkOrderChangeRequest(
  id: string,
  crId: string,
  action: 'APPROVED' | 'REJECTED',
  reviewNotes: string,
  reviewerName: string = 'Property Manager'
): Promise<{ changeRequest: WorkOrderChangeRequest; workOrder: WorkOrder }> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}/change-requests/${crId}/review`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, reviewNotes, reviewerName })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to review change request');
  return data;
}

export async function verifyWorkOrderQuality(
  id: string,
  verifierName: string,
  notes: string,
  checklist: VerificationChecklistRecord[]
): Promise<WorkOrder> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ verifierName, notes, checklist })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Quality verification sign-off rejected');
  return data;
}

export async function closeWorkOrderSafely(
  id: string,
  closerName: string,
  notes: string
): Promise<WorkOrder> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/work-orders/${id}/close`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ closerName, notes })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to close work order');
  return data;
}

// ============================================================================
// CONTRACTORS & NOTIFICATIONS
// ============================================================================

export async function fetchContractors(): Promise<Contractor[]> {
  const headers = await getHeaders();
  const res = await fetch('/api/contractors', { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch contractors');
  return data;
}

export async function createContractor(payload: Partial<Contractor>): Promise<Contractor> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch('/api/contractors', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create contractor');
  return data;
}

export async function updateContractor(id: string, updates: Partial<Contractor>): Promise<Contractor> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/contractors/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update contractor');
  return data;
}

export async function fetchNotifications(): Promise<WorkOrderNotification[]> {
  const headers = await getHeaders();
  const res = await fetch('/api/notifications', { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch notifications');
  return data;
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`/api/notifications/${id}/read`, {
    method: 'POST',
    headers
  });
  const data = await res.json();
  return !!data.success;
}

// ============================================================================
// OPERATIONAL ANALYTICS & PROPERTY HEALTH (PROMPT 10)
// ============================================================================

export async function fetchOperationalAnalytics(): Promise<OperationalMetrics> {
  const headers = await getHeaders();
  const res = await fetch('/api/analytics/operational', { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch operational analytics');
  return data;
}

export async function fetchPropertyHealthSummaries(): Promise<PropertyHealthSummary[]> {
  const headers = await getHeaders();
  const res = await fetch('/api/analytics/property-health', { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch property health summaries');
  return data;
}


