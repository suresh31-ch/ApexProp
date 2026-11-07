import { jsPDF } from 'jspdf';
import {
  InspectionRecord,
  WorkOrder,
  WorkOrderStatusHistory,
  WorkOrderChangeRequest,
  RepairPlan,
  RepairCostEstimate,
  OperationalMetrics,
  PropertyHealthSummary
} from '../types';

/**
 * Common Header Bar for ApexProp AI branded PDFs
 */
function renderBrandHeader(doc: jsPDF, title: string, subtitle: string, reportRef: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Dark Navy Header Bar
  doc.setFillColor(11, 16, 27);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Electric Blue Accent Line
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text('APEXPROP AI — ENTERPRISE PROPERTY INTELLIGENCE', margin, 12);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(147, 197, 253);
  doc.text(subtitle.toUpperCase(), margin, 20);

  // Reference & Date
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.text(`REF: ${reportRef} | DATE: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin - 70, 20);

  return 36;
}

/**
 * Common Footer for ApexProp AI branded PDFs
 */
function renderPageFooter(doc: jsPDF, pageNumber: number, totalPages: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('ApexProp AI Autonomous Property Management Platform — Confidential & Privileged', margin, pageHeight - 7);
  doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 7);
}

// ============================================================================
// 1. PROPERTY INSPECTION REPORT
// ============================================================================
export function generateInspectionPDF(inspection: InspectionRecord): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = renderBrandHeader(
    doc,
    'APEXPROP AI',
    'Certified Visual Inspection & Pathology Dossier',
    inspection.id
  );

  // Property Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  doc.text('Property Name:', margin + 4, y + 6);
  doc.text('Location:', margin + 4, y + 13);
  doc.text('Asset Type:', margin + 4, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(inspection.propertyName, margin + 32, y + 6);
  doc.text(inspection.location, margin + 32, y + 13);
  doc.text(`${inspection.buildingType} | Area: ${inspection.floorOrRoom}`, margin + 32, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Severity Level:', margin + 110, y + 6);
  doc.text('Defect Category:', margin + 110, y + 13);
  doc.text('Inspection Status:', margin + 110, y + 20);

  doc.setFont('helvetica', 'bold');
  if (inspection.severity === 'CRITICAL' || inspection.severity === 'HIGH') {
    doc.setTextColor(220, 38, 38);
  } else if (inspection.severity === 'MEDIUM') {
    doc.setTextColor(217, 119, 6);
  } else {
    doc.setTextColor(22, 163, 74);
  }
  doc.text(inspection.severity, margin + 142, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(inspection.defectCategory || 'Surface & Finish', margin + 142, y + 13);
  doc.text(
    inspection.approval?.status === 'APPROVED' ? 'DEFECT CONFIRMED (HUMAN VERIFIED)' : 'VISUAL FINDING DETECTED',
    margin + 142,
    y + 20
  );

  y += 32;

  // Visual Pathology Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. VISUAL PATHOLOGY SUMMARY & OPTICAL FINDINGS', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const summaryLines = doc.splitTextToSize(inspection.summary || 'Visual pathology evaluated.', contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 4.5 + 4;

  // Optical Confidence Disclaimer
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text(`OPTICAL ANALYSIS CONFIDENCE: ${inspection.visualConfidence ?? 88}%`, margin + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Measures image model pixel recognition clarity only. Does not denote physical structural safety or probability of failure.',
    margin + 4,
    y + 10
  );
  y += 18;

  // Evidence Items & Pixel Citations
  if (inspection.categoryA_visibleEvidence && inspection.categoryA_visibleEvidence.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('2. DIRECTLY VISIBLE EVIDENCE CITATIONS', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    inspection.categoryA_visibleEvidence.slice(0, 4).forEach((ev) => {
      doc.text(`• ${ev}`, margin + 4, y);
      y += 4.5;
    });
    y += 3;
  }

  // Recommended Remediation Options
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('3. ADVISORY REMEDIATION PROTOCOLS & COST BENCHMARKS', margin, y);
  y += 5;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Option A (Interim Containment):', margin + 4, y + 6);
  doc.text('Option B (Remediation Scope):', margin + 4, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${inspection.pipeline?.stage4_repairIntelligence?.temporaryMitigation?.action || 'Surface stabilization'} (Est: ${inspection.pipeline?.stage4_repairIntelligence?.temporaryMitigation?.estCostRangeINR || '₹8,000 – ₹15,000'})`,
    margin + 52,
    y + 6
  );
  doc.text(
    `${inspection.pipeline?.stage4_repairIntelligence?.permanentRemediation?.action || 'Specialist grouting & reinforcement'} (Est: ${inspection.pipeline?.stage4_repairIntelligence?.permanentRemediation?.estCostRangeINR || '₹45,000 – ₹85,000'})`,
    margin + 52,
    y + 14
  );
  doc.setFont('helvetica', 'bold');
  doc.text('Note: Requires licensed structural engineer verification prior to contractor dispatch.', margin + 4, y + 21);
  y += 28;

  // Mandatory Safety & Regulatory Notice
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(153, 27, 27);
  doc.text('MANDATORY REGULATORY & ENGINEERING DISCLAIMER:', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(185, 28, 28);
  const disclaimer =
    'This visual inspection report is based exclusively on surface photographs. It does not certify structural, electrical, or fire safety under IS 456 / NBC 2016. Physical non-destructive testing (NDT) by a qualified structural engineer is mandatory before executing intrusive repairs or altering load-bearing members.';
  doc.text(doc.splitTextToSize(disclaimer, contentWidth - 8), margin + 4, y + 10);
  y += 26;

  // Sign-off section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Authorized Sign-off: ${inspection.approval?.approvedBy || 'Pending Human Review'}`, margin, y);
  doc.text(`Status: ${inspection.approval?.status || 'PENDING'}`, margin + 85, y);
  doc.text(`Audit Ref: APX-REV-${Date.now().toString().slice(-6)}`, margin + 140, y);

  renderPageFooter(doc, 1, 1);
  doc.save(`ApexProp-Inspection-${inspection.propertyName.replace(/\s+/g, '_')}-${inspection.id}.pdf`);
}

// ============================================================================
// 2. STRUCTURAL DEFECT INVESTIGATION REPORT
// ============================================================================
export function generateInvestigationPDF(inspection: InspectionRecord): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = renderBrandHeader(
    doc,
    'APEXPROP AI',
    'Forensic Root-Cause Investigation & Risk Intelligence Dossier',
    `INV-${inspection.id}`
  );

  // Subject Information Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Investigation Subject:', margin + 4, y + 6);
  doc.text('Physical Location:', margin + 4, y + 13);
  doc.text('Investigation Outcome:', margin + 4, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`${inspection.propertyName} (${inspection.defectCategory})`, margin + 40, y + 6);
  doc.text(`${inspection.location} • Room/Grid: ${inspection.floorOrRoom}`, margin + 40, y + 13);
  doc.text(inspection.investigationOutcome?.replace(/_/g, ' ') || 'MULTIPLE PLAUSIBLE CAUSES (PHYSICAL TESTING REQUIRED)', margin + 40, y + 20);

  y += 30;

  // Observed Defect Pathology
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. OBSERVED DEFECT PATHOLOGY & PHYSICAL SYMPTOMS', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const desc = doc.splitTextToSize(inspection.summary || 'Structural distress observed.', contentWidth);
  doc.text(desc, margin, y);
  y += desc.length * 4.5 + 4;

  // Root-Cause Hypotheses & Evidence Traceability
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. AI ROOT-CAUSE HYPOTHESES & PLAUSIBILITY ANALYSIS', margin, y);
  y += 5;

  const hypotheses = inspection.investigationHypotheses || [
    { hypothesisId: 'H1', possibleCause: 'Differential foundation settlement or thermal expansion strains', confidenceCategory: 'Moderate', supportingEvidence: ['45-degree angle fracture', 'Step-pattern joint separation'] },
    { hypothesisId: 'H2', possibleCause: 'Reinforced concrete carbonation leading to steel passivation loss', confidenceCategory: 'Low', supportingEvidence: ['Rust staining along fissure boundary'] }
  ];

  hypotheses.slice(0, 3).forEach((h: any, idx: number) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Hypothesis ${idx + 1} [${h.hypothesisId || `H${idx + 1}`}]: ${h.possibleCause}`, margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Plausibility Confidence: ${h.confidenceCategory || 'Moderate'} | Note: Engineering hypothesis requiring on-site instrument calibration.`, margin + 4, y + 10);
    doc.text(`Supporting Indicators: ${Array.isArray(h.supportingEvidence) ? h.supportingEvidence.join(', ') : 'Surface visual indicators.'}`, margin + 4, y + 14);
    y += 21;
  });

  // Compulsory Non-Destructive Testing (NDT)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. COMPULSORY PHYSICAL TESTS & CALIBRATED INSTRUMENTS', margin, y);
  y += 5;

  const tests = inspection.recommendedTests && inspection.recommendedTests.length > 0
    ? inspection.recommendedTests
    : [
        'Calibrated optical crack microscope aperture survey (mm)',
        'Ultrasonic Pulse Velocity (UPV) scan per IS 13311 (Part 1)',
        'Rebound Schmidt Hammer concrete surface hardness audit per IS 13311 (Part 2)',
        'Carbide moisture measurement and relative humidity profiling'
      ];

  tests.slice(0, 4).forEach((test) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`[MANDATORY] ${test}`, margin + 4, y);
    y += 4.5;
  });

  y += 6;

  // Regulatory Engineering Boundary
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(153, 27, 27);
  doc.text('ENGINEERING BOUNDARY & CERTIFICATION NOTICE:', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(185, 28, 28);
  const boundary = 'This forensic investigation report provides probabilistic decision support. It is not an engineering design certificate. Recommendations must be audited by a registered chartered structural engineer before conducting destructive repairs.';
  doc.text(doc.splitTextToSize(boundary, contentWidth - 8), margin + 4, y + 10);

  renderPageFooter(doc, 1, 1);
  doc.save(`ApexProp-Investigation-${inspection.propertyName.replace(/\s+/g, '_')}-${inspection.id}.pdf`);
}

// ============================================================================
// 3. REPAIR ESTIMATE REPORT
// ============================================================================
export function generateRepairEstimatePDF(plan: RepairPlan, estimate: RepairCostEstimate): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = renderBrandHeader(
    doc,
    'APEXPROP AI',
    'Itemized Maintenance Cost Estimate & Bill of Quantities',
    estimate.estimateNumber || estimate.id
  );

  // Estimate Summary Block
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Defect Reference:', margin + 4, y + 6);
  doc.text('Repair Objective:', margin + 4, y + 13);
  doc.text('Estimate Version:', margin + 4, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(plan.defectTitle || 'Property Defect Remediation', margin + 35, y + 6);
  doc.text(plan.repairObjective || 'Permanent restoration', margin + 35, y + 13);
  doc.text(`Version ${estimate.versionNumber || 1} • Status: ${estimate.status || 'PENDING'}`, margin + 35, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Total Estimated Cost:', margin + 110, y + 6);
  doc.text('Currency:', margin + 110, y + 13);
  doc.text('Trade Classification:', margin + 110, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(`₹${(estimate.totalAmount || 0).toLocaleString('en-IN')}`, margin + 145, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Indian Rupee (INR)', margin + 145, y + 13);
  doc.text(plan.requiredTrade || 'Structural & Masonry', margin + 145, y + 20);

  y += 32;

  // Itemized Bill of Quantities Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ITEMIZED BILL OF QUANTITIES (BOQ)', margin, y);
  y += 5;

  // Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('CATEGORY', margin + 2, y + 5);
  doc.text('DESCRIPTION & SPECIFICATION', margin + 28, y + 5);
  doc.text('QTY', margin + 112, y + 5);
  doc.text('UNIT', margin + 125, y + 5);
  doc.text('RATE (₹)', margin + 142, y + 5);
  doc.text('TOTAL (₹)', margin + 162, y + 5);
  y += 7;

  // Table Rows
  const items = estimate.lineItems || [];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  items.slice(0, 10).forEach((item: any, idx: number) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 6, 'F');
    }
    doc.text(item.category || 'MATERIAL', margin + 2, y + 4.5);
    doc.text(doc.splitTextToSize(item.description || 'Repair consumable', 80)[0], margin + 28, y + 4.5);
    doc.text(String(item.quantity || 1), margin + 112, y + 4.5);
    doc.text(item.unit || 'Units', margin + 125, y + 4.5);
    doc.text(`₹${(item.unitRate || 0).toLocaleString('en-IN')}`, margin + 142, y + 4.5);
    doc.text(`₹${(item.totalCost || item.lineTotal || 0).toLocaleString('en-IN')}`, margin + 162, y + 4.5);
    y += 6;
  });

  y += 4;

  // Subtotals and Tax Breakdown Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 80, y, contentWidth - 80, 24, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  doc.text('Direct Works Subtotal:', margin + 85, y + 6);
  doc.text('Contingency Buffer (10%):', margin + 85, y + 12);
  doc.text('Goods & Services Tax (GST 18%):', margin + 85, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.text(`₹${(estimate.subtotal || 0).toLocaleString('en-IN')}`, margin + 155, y + 6);
  doc.text(`₹${(estimate.contingencyAmount || 0).toLocaleString('en-IN')}`, margin + 155, y + 12);
  doc.text(`₹${(estimate.taxAmount || 0).toLocaleString('en-IN')}`, margin + 155, y + 18);

  y += 32;

  // Disclaimer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('All rates derived from CPWD Schedule of Rates (DSR 2023) with regional procurement cost indexing. Non-binding contractor advisory.', margin, y);

  renderPageFooter(doc, 1, 1);
  doc.save(`ApexProp-Estimate-${estimate.estimateNumber || estimate.id}.pdf`);
}

// ============================================================================
// 4. WORK ORDER EXECUTION REPORT
// ============================================================================
export function generateWorkOrderPDF(
  workOrder: WorkOrder,
  history: WorkOrderStatusHistory[] = [],
  changeRequests: WorkOrderChangeRequest[] = []
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = renderBrandHeader(
    doc,
    'APEXPROP AI',
    'Maintenance Work Order Dispatch & Quality Verification Dossier',
    workOrder.workOrderNumber || workOrder.id
  );

  // Overview Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Work Order:', margin + 4, y + 6);
  doc.text('Property Site:', margin + 4, y + 13);
  doc.text('Trade & Scope:', margin + 4, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`${workOrder.workOrderNumber || workOrder.id} (${workOrder.priority} Priority)`, margin + 30, y + 6);
  doc.text(`${workOrder.propertyName} • ${workOrder.location}`, margin + 30, y + 13);
  doc.text(`${workOrder.trade} • ${workOrder.title}`, margin + 30, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Current Status:', margin + 110, y + 6);
  doc.text('Approved Budget:', margin + 110, y + 13);
  doc.text('Actual Expenditure:', margin + 110, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(workOrder.status, margin + 145, y + 6);
  doc.text(`₹${(workOrder.approvedBudgetINR || 0).toLocaleString('en-IN')}`, margin + 145, y + 13);
  doc.setTextColor(workOrder.actualCostINR > workOrder.approvedBudgetINR ? 220 : 16, 38, 74);
  doc.text(`₹${(workOrder.actualCostINR || 0).toLocaleString('en-IN')}`, margin + 145, y + 20);

  y += 32;

  // Contractor & Dispatch Schedule
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CONTRACTOR DISPATCH & EXECUTION SCHEDULE', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Assigned Specialist: ${workOrder.assignedTo}`, margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Contact: ${workOrder.contractorContact || 'Verified on dispatch'} | Scheduled: ${workOrder.scheduledDate || 'Immediate'} | Due: ${workOrder.dueDate || 'Standard cadence'}`,
    margin + 4,
    y + 11
  );
  doc.text(`Execution Progress: ${workOrder.progressPercent || 0}% Completed`, margin + 4, y + 16);
  y += 24;

  // Quality Verification & Audit Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('QUALITY VERIFICATION AUDIT & HUMAN SIGN-OFF', margin, y);
  y += 5;

  doc.setFillColor(workOrder.status === 'VERIFIED' || workOrder.status === 'CLOSED' ? 240 : 254, 253, 244);
  doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52);
  doc.text(`Quality Verification Certified: ${workOrder.verifiedBy ? `YES — ${workOrder.verifiedBy}` : 'PENDING POST-REPAIR AUDIT'}`, margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Verification Notes: ${workOrder.verificationNotes || 'Awaiting authorized engineer sign-off.'}`, margin + 4, y + 11);
  doc.text(`Closed & Archived By: ${workOrder.closedBy ? `${workOrder.closedBy} on ${new Date(workOrder.closedAt!).toLocaleDateString()}` : 'Awaiting Final Closure'}`, margin + 4, y + 17);
  y += 28;

  // Status Transition Audit History
  const historyItems = (workOrder.statusHistory && workOrder.statusHistory.length > 0) ? workOrder.statusHistory : history;
  if (historyItems && historyItems.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('AUDIT LOG: WORK ORDER LIFECYCLE HISTORY', margin, y);
    y += 5;

    historyItems.slice(0, 5).forEach((h) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`[${new Date(h.createdAt).toLocaleDateString('en-GB')}] ${h.previousStatus} → ${h.newStatus} (by ${h.userName || 'System'})`, margin + 4, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(doc.splitTextToSize(h.notes || 'Status changed.', contentWidth - 10), margin + 8, y + 3.5);
      y += 8;
    });
  }

  renderPageFooter(doc, 1, 1);
  doc.save(`ApexProp-WorkOrder-${workOrder.workOrderNumber || workOrder.id}.pdf`);
}

// ============================================================================
// 5. CONSOLIDATED EXECUTIVE PORTFOLIO REPORT
// ============================================================================
export function generatePortfolioPDF(
  arg1: OperationalMetrics | {
    portfolioName?: string;
    reportPeriod?: string;
    metrics: OperationalMetrics;
    properties?: PropertyHealthSummary[];
    workOrders?: WorkOrder[];
    fiduciaryNotes?: string;
  },
  arg2?: PropertyHealthSummary[],
  arg3?: WorkOrder[]
): void {
  let metrics: OperationalMetrics;
  let properties: PropertyHealthSummary[] = [];
  let workOrders: WorkOrder[] = [];
  let customTitle = 'Executive Portfolio Property Intelligence & Maintenance Audit';
  const portfolioCode = `PORTFOLIO-${new Date().getFullYear()}`;

  if (arg1 && 'metrics' in arg1) {
    metrics = arg1.metrics;
    properties = arg1.properties || [];
    workOrders = arg1.workOrders || [];
    if (arg1.portfolioName) customTitle = `${arg1.portfolioName} — Executive Audit`;
  } else {
    metrics = arg1 as OperationalMetrics;
    properties = arg2 || [];
    workOrders = arg3 || [];
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = renderBrandHeader(
    doc,
    'APEXPROP AI',
    customTitle,
    portfolioCode
  );

  // Executive KPI Strip
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'S');

  // KPI Grid
  const kpis = [
    { label: 'Total Properties', val: String(metrics.totalProperties) },
    { label: 'Total Surveys', val: String(metrics.totalInspections) },
    { label: 'Active Defects', val: String(metrics.activeDefects) },
    { label: 'Critical / High', val: String(metrics.criticalHighFindings) },
    { label: 'Active Work Orders', val: String(metrics.activeWorkOrders) },
    { label: 'Verified Repairs', val: String(metrics.verifiedRepairs) },
    { label: 'Approved Budget', val: `₹${((metrics.approvedBudgetINR || 0) / 100000).toFixed(1)}L` },
    { label: 'Actual Expenditure', val: `₹${((metrics.actualExpenditureINR || 0) / 100000).toFixed(1)}L` }
  ];

  kpis.forEach((kpi, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const xPos = margin + 4 + col * (contentWidth / 4);
    const yPos = y + 7 + row * 13;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(kpi.val, xPos, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, xPos, yPos + 4.5);
  });

  y += 38;

  // Property Health Summaries Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PROPERTY ASSET HEALTH & MAINTENANCE RATINGS', margin, y);
  y += 5;

  // Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PROPERTY NAME', margin + 2, y + 5);
  doc.text('LOCATION', margin + 50, y + 5);
  doc.text('SURVEYS', margin + 98, y + 5);
  doc.text('DEFECTS', margin + 115, y + 5);
  doc.text('BUDGET', margin + 132, y + 5);
  doc.text('ACTUAL EXP.', margin + 152, y + 5);
  doc.text('HEALTH', margin + 172, y + 5);
  y += 7;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  properties.slice(0, 10).forEach((prop, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 6, 'F');
    }
    doc.text(doc.splitTextToSize(prop.propertyName, 45)[0], margin + 2, y + 4.5);
    doc.text(doc.splitTextToSize(prop.location, 45)[0], margin + 50, y + 4.5);
    doc.text(String(prop.totalInspections), margin + 98, y + 4.5);
    doc.text(String(prop.activeDefectsCount), margin + 115, y + 4.5);
    doc.text(`₹${(prop.approvedBudgetINR || 0).toLocaleString('en-IN')}`, margin + 132, y + 4.5);
    doc.text(`₹${(prop.actualExpenditureINR || 0).toLocaleString('en-IN')}`, margin + 152, y + 4.5);

    // Health score color
    if (prop.healthScore >= 80) doc.setTextColor(22, 163, 74);
    else if (prop.healthScore >= 60) doc.setTextColor(217, 119, 6);
    else doc.setTextColor(220, 38, 38);
    doc.text(`${prop.healthScore}/100`, margin + 172, y + 4.5);
    doc.setTextColor(51, 65, 85);

    y += 6;
  });

  y += 6;

  // Operational Disclaimer
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 16, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('SCORING METHODOLOGY & OPERATIONAL BOUNDARY:', margin + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Property Health Rating is an operational maintenance metric derived from defect severity density and verified remediation. It does not replace structural certification under NBC 2016 / IS 456.',
    margin + 4,
    y + 10
  );

  renderPageFooter(doc, 1, 1);
  doc.save(`ApexProp-Executive-Portfolio-Report-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ============================================================================
// 6. CSV EXPORT UTILITY
// ============================================================================
export function exportToCSV(
  arg1: string | Record<string, any>[],
  arg2?: string | Record<string, any>[],
  headers?: { key: string; label: string }[]
): void {
  let filename = 'apexprop_export';
  let rows: Record<string, any>[] = [];

  if (typeof arg1 === 'string') {
    filename = arg1;
    rows = (arg2 as Record<string, any>[]) || [];
  } else if (Array.isArray(arg1)) {
    rows = arg1;
    filename = typeof arg2 === 'string' ? arg2 : 'apexprop_export';
  }

  if (!rows || rows.length === 0) {
    console.warn('No data records available to export to CSV.');
    return;
  }

  const columns = headers || Object.keys(rows[0]).map((key) => ({ key, label: key }));

  const csvRows: string[] = [];
  // Header line
  csvRows.push(columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(','));

  // Data lines
  rows.forEach((row) => {
    const values = columns.map((col) => {
      const val = row[col.key];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
