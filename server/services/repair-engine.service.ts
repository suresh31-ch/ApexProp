/**
 * ApexProp AI — Repair Intelligence & Cost Estimation Engine Service
 * Implements deterministic calculations, defect-specific repair intelligence,
 * Gemini-assisted repair recommendation generation, versioning, and rate catalog.
 */

import {
  RepairPlan,
  RepairOption,
  RepairCostEstimate,
  RepairEstimateLineItem,
  RepairMeasurements,
  RepairRateCatalogItem,
  RepairApprovalHistoryItem,
  EstimateStatus,
  LineItemCategory,
  MeasurementUnit,
  InspectionRecord
} from '../../src/types';
import { geminiService } from './gemini.service';

export class RepairEngineService {
  /**
   * Deterministic Standard Regional Rate Catalog (CPWD / DSR / IS Standard Base Rates in INR)
   */
  private readonly defaultCatalog: RepairRateCatalogItem[] = [
    // LABOUR
    { id: 'cat-lab-01', category: 'LABOUR', itemName: 'Skilled Structural Mason / Repair Specialist', unit: 'Day', defaultRateINR: 1100, description: 'Skilled mason with structural repair experience', region: 'India-National' },
    { id: 'cat-lab-02', category: 'LABOUR', itemName: 'Waterproofing Technician', unit: 'Day', defaultRateINR: 1200, description: 'Certified chemical and membrane applicator', region: 'India-National' },
    { id: 'cat-lab-03', category: 'LABOUR', itemName: 'Painter & Surface Finisher', unit: 'Day', defaultRateINR: 900, description: 'Professional brush and spray plaster finisher', region: 'India-National' },
    { id: 'cat-lab-04', category: 'LABOUR', itemName: 'General Laborer / Helper', unit: 'Day', defaultRateINR: 650, description: 'Material handling and surface preparation assistant', region: 'India-National' },
    { id: 'cat-lab-05', category: 'LABOUR', itemName: 'Licensed Structural Engineer (Inspection / Sign-off)', unit: 'Lump sum', defaultRateINR: 7500, description: 'Forensic site assessment and compliance certificate', region: 'India-National' },

    // MATERIALS
    { id: 'cat-mat-01', category: 'MATERIAL', itemName: 'Polymer-Modified Mortar (PMM) 25kg bag', unit: 'kg', defaultRateINR: 48, description: 'High-strength structural repair mortar', region: 'India-National' },
    { id: 'cat-mat-02', category: 'MATERIAL', itemName: 'Low-Viscosity Epoxy Crack Injection Resin (1L)', unit: 'kg', defaultRateINR: 680, description: 'High-modulus epoxy for structural crack healing', region: 'India-National' },
    { id: 'cat-mat-03', category: 'MATERIAL', itemName: 'Zinc-Rich Anti-Corrosion Rebar Primer (1L)', unit: 'kg', defaultRateINR: 520, description: 'Cathodic protection primer for exposed reinforcement', region: 'India-National' },
    { id: 'cat-mat-04', category: 'MATERIAL', itemName: 'Crystalline Waterproofing Slurry (20kg)', unit: 'kg', defaultRateINR: 75, description: 'Hydrophilic in-depth crystalline barrier', region: 'India-National' },
    { id: 'cat-mat-05', category: 'MATERIAL', itemName: 'Elastomeric Breathable Waterproof Exterior Paint (20L)', unit: 'Lump sum', defaultRateINR: 4800, description: 'Vapor-permeable anti-carbonation coating', region: 'India-National' },
    { id: 'cat-mat-06', category: 'MATERIAL', itemName: 'Surface Crack Filler / Acrylic Paste (5kg)', unit: 'kg', defaultRateINR: 120, description: 'Non-shrink flexible surface filler', region: 'India-National' },
    { id: 'cat-mat-07', category: 'MATERIAL', itemName: 'Packers & Injection Ports (Pack of 20)', unit: 'No.', defaultRateINR: 45, description: 'Surface-mount pressure injection nipples', region: 'India-National' },

    // EQUIPMENT
    { id: 'cat-eq-01', category: 'EQUIPMENT', itemName: 'High-Pressure Epoxy Injection Pump (Daily Rental)', unit: 'Day', defaultRateINR: 1500, description: 'Airless or dual-component electric injection machine', region: 'India-National' },
    { id: 'cat-eq-02', category: 'EQUIPMENT', itemName: 'Electric Concrete Chipping Hammer & Grinder', unit: 'Day', defaultRateINR: 600, description: 'Substrate breakout and rust de-scaling tools', region: 'India-National' },
    { id: 'cat-eq-03', category: 'EQUIPMENT', itemName: 'Industrial Moisture Meter & Calibrated Crack Gauge', unit: 'Lump sum', defaultRateINR: 1200, description: 'Diagnostic measurement equipment for post-repair check', region: 'India-National' },

    // ACCESS & SCAFFOLDING
    { id: 'cat-acc-01', category: 'ACCESS_SCAFFOLDING', itemName: 'Mobile Tubular Steel Scaffolding Tower (3m - 6m)', unit: 'Day', defaultRateINR: 1200, description: 'Safety-compliant mobile scaffolding with guardrails', region: 'India-National' },
    { id: 'cat-acc-02', category: 'ACCESS_SCAFFOLDING', itemName: 'Safety Cordon Barricade & Warning Signage Kit', unit: 'Lump sum', defaultRateINR: 1500, description: 'Perimeter restriction tape, bollards, and hazard boards', region: 'India-National' },

    // TRANSPORT & DISPOSAL
    { id: 'cat-trans-01', category: 'TRANSPORT_DISPOSAL', itemName: 'Debris Removal & Environmental Waste Disposal', unit: 'Lump sum', defaultRateINR: 1800, description: 'Safe hauling of concrete spall debris to authorized depot', region: 'India-National' }
  ];

  public getRateCatalog(): RepairRateCatalogItem[] {
    return [...this.defaultCatalog];
  }

  /**
   * Deterministic Quantity Math
   */
  public calculateQuantities(measurements: Partial<RepairMeasurements>): RepairMeasurements {
    const missing: string[] = [];
    const length = measurements.lengthM != null && measurements.lengthM > 0 ? Number(measurements.lengthM) : undefined;
    const width = measurements.widthM != null && measurements.widthM > 0 ? Number(measurements.widthM) : undefined;
    const depth = measurements.depthM != null && measurements.depthM > 0 ? Number(measurements.depthM) : undefined;

    let areaM2 = measurements.areaM2;
    if (areaM2 == null || areaM2 <= 0) {
      if (length != null && width != null) {
        areaM2 = Math.round(length * width * 1000) / 1000;
      }
    }

    let volumeM3 = measurements.volumeM3;
    if (volumeM3 == null || volumeM3 <= 0) {
      if (length != null && width != null && depth != null) {
        volumeM3 = Math.round(length * width * depth * 10000) / 10000;
      } else if (areaM2 != null && depth != null) {
        volumeM3 = Math.round(areaM2 * depth * 10000) / 10000;
      }
    }

    if (length == null) missing.push('Length (m)');
    if (width == null) missing.push('Width (m)');
    if (measurements.unitCount == null || measurements.unitCount <= 0) {
      if (areaM2 == null && volumeM3 == null) {
        missing.push('Area (m²) or Unit Count');
      }
    }

    return {
      lengthM: length,
      widthM: width,
      depthM: depth,
      areaM2,
      volumeM3,
      unitCount: measurements.unitCount,
      labourHours: measurements.labourHours,
      labourDays: measurements.labourDays,
      notes: measurements.notes,
      isMeasuredOnSite: measurements.isMeasuredOnSite ?? false,
      measurementEvidenceUrl: measurements.measurementEvidenceUrl,
      missingMeasurements: missing
    };
  }

  /**
   * Deterministic Cost Arithmetic with Decimal Safety
   * Line item total = Quantity × Unit rate
   * Subtotal = Sum of all line item totals
   * Contingency = Configured contingency percentage × eligible subtotal
   * Tax = Configured tax rate × applicable taxable amount
   * Estimated total = Subtotal + Contingency + Tax
   */
  public calculateEstimateTotals(
    lineItems: RepairEstimateLineItem[],
    contingencyPercent?: number | null,
    taxPercent?: number | null,
    currency: 'INR' | 'USD' | 'EUR' | 'GBP' = 'INR'
  ): {
    recalculatedLineItems: RepairEstimateLineItem[];
    subtotal: number;
    contingencyPercent: number | null;
    contingencyAmount: number;
    taxPercent: number | null;
    taxAmount: number;
    totalAmount: number;
    missingInformationWarnings: string[];
    currencySymbol: string;
  } {
    const symbolMap: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£'
    };
    const currencySymbol = symbolMap[currency] || '₹';

    const warnings: string[] = [];
    let subtotal = 0;

    const recalculatedLineItems = lineItems.map((item, index) => {
      const qty = Math.max(0, Number(item.quantity) || 0);
      const rate = Math.max(0, Number(item.unitRate) || 0);

      if (qty <= 0) {
        warnings.push(`Line item #${index + 1} ("${item.description || 'Untitled'}") has 0 or missing quantity.`);
      }
      if (rate <= 0) {
        warnings.push(`Line item #${index + 1} ("${item.description || 'Untitled'}") has unconfigured unit rate.`);
      }

      // Safe 2-decimal arithmetic
      const lineTotal = Math.round(qty * rate * 100) / 100;
      subtotal = Math.round((subtotal + lineTotal) * 100) / 100;

      return {
        ...item,
        quantity: qty,
        unitRate: rate,
        lineTotal
      };
    });

    if (recalculatedLineItems.length === 0) {
      warnings.push('No cost line items added to this estimate.');
    }

    // Only compute contingency when explicitly configured
    let contingencyAmount = 0;
    const cleanContingencyPercent =
      contingencyPercent != null && contingencyPercent > 0 ? Number(contingencyPercent) : null;
    if (cleanContingencyPercent != null) {
      contingencyAmount = Math.round(((subtotal * cleanContingencyPercent) / 100) * 100) / 100;
    }

    // Only compute tax when explicitly configured
    let taxAmount = 0;
    const cleanTaxPercent = taxPercent != null && taxPercent > 0 ? Number(taxPercent) : null;
    if (cleanTaxPercent != null) {
      const taxableBase = subtotal + contingencyAmount;
      taxAmount = Math.round(((taxableBase * cleanTaxPercent) / 100) * 100) / 100;
    }

    const totalAmount = Math.round((subtotal + contingencyAmount + taxAmount) * 100) / 100;

    return {
      recalculatedLineItems,
      subtotal,
      contingencyPercent: cleanContingencyPercent,
      contingencyAmount,
      taxPercent: cleanTaxPercent,
      taxAmount,
      totalAmount,
      missingInformationWarnings: warnings,
      currencySymbol
    };
  }

  /**
   * Generates a fully-structured, defect-specific Repair Plan and 3 distinct Options
   * from real inspection findings, investigations, and risk data.
   */
  public generateRepairPlan(
    inspection: InspectionRecord,
    optionsOverride?: Partial<RepairPlan>
  ): { repairPlan: RepairPlan; initialEstimate: RepairCostEstimate } {
    const category = inspection.defectCategory || 'General Defect';
    const combinedText = `${category} ${inspection.summary || ''} ${inspection.categoryA_visibleEvidence?.join(' ') || ''} ${inspection.userNotes || ''}`;
    const isCrack = /crack|fracture|shear|fissure/i.test(combinedText);
    const isSpalling = /spall|delaminat|exposed|rebar|corro/i.test(combinedText);
    const isWater = /water|leak|damp|moisture|efflor|seep/i.test(combinedText);
    const isDampness = /damp|moisture|efflor/i.test(combinedText);
    const isCritical = inspection.severity === 'CRITICAL' || inspection.safetyEscalation?.isEscalated;

    // A. Observed condition from direct visual findings
    const observedCondition =
      inspection.summary ||
      inspection.categoryA_visibleEvidence?.[0] ||
      `Visible indications of ${category} identified on ${inspection.propertyName}.`;

    // B. Possible underlying causes from investigations
    const possibleCauses =
      inspection.investigationHypotheses && inspection.investigationHypotheses.length > 0
        ? inspection.investigationHypotheses.map(h => h.possibleCause)
        : inspection.pipeline?.stage2_rootCause?.plausibleCauses?.length > 0
        ? inspection.pipeline.stage2_rootCause.plausibleCauses
        : [
            isCrack ? 'Structural differential settlement or thermal strain' :
            isSpalling ? 'Concrete carbonation and chloride-induced reinforcement corrosion' :
            isWater ? 'Active plumbing pipe breach or external waterproofing failure' :
            'Substrate fatigue and environmental weathering'
          ];

    // C. Recommended diagnostic tests before repair
    const diagnosticTests: string[] = [];
    if (isWater || isDampness) {
      diagnosticTests.push('Electronic moisture meter profiling (deep pinless RF scan)');
      diagnosticTests.push('Plumbing line pressure test to rule out pressurized pipe breaches');
      diagnosticTests.push('Thermal infrared thermography to trace moisture source ingress paths');
    }
    if (isCrack) {
      diagnosticTests.push('Calibrated optical crack microscope aperture measurement (mm)');
      diagnosticTests.push('Demec mechanical strain gauge or tell-tale monitoring across 14-day cycle');
      diagnosticTests.push('Ultrasonic pulse velocity (UPV) or rebound hammer structural test');
    }
    if (isSpalling) {
      diagnosticTests.push('Half-cell potential electrical survey to map active corrosion zones');
      diagnosticTests.push('Phenolphthalein carbonation depth indicator testing');
      diagnosticTests.push('Rebar residual diameter caliper measurement');
    }
    if (diagnosticTests.length === 0) {
      diagnosticTests.push('Visual acoustic hammer tapping to check delamination');
    }

    // Prohibit cosmetic only when underlying cause may be active
    const isCosmeticProhibited = isWater || isDampness || isCrack || isSpalling;

    // Safety and stop-work conditions
    const stopWorkConditions: string[] = [
      'Stop work immediately if fresh active water leakage or pressurized seepage appears.',
      'Stop work immediately if unexpected crack propagation or acoustic popping/settlement occurs.',
      'Stop work if loose overhead concrete fragments exceeding 0.5 kg threaten technician safety.',
      'Stop work and escalate to Structural Engineer if rebar cross-section loss exceeds 20%.'
    ];

    const safetyPrecautions: string[] = [
      'Full personal protective equipment (PPE) mandatory: Hard hat, safety goggles, dust respirator, cut-resistant gloves, steel-toe boots.',
      'Ensure adequate cross-ventilation when applying chemical primers or solvent-based resins.',
      'Cordon off 3-meter safety boundary with warning barricade tape beneath elevated work zones.'
    ];

    if (isCritical) {
      safetyPrecautions.unshift('URGENT: Verify site structural safety clearance before erecting scaffolding.');
    }

    // Step-by-step sequence based on defect
    let stepSequence: string[] = [];
    let requiredMaterials: string[] = [];
    let requiredTools: string[] = [];
    let recommendedTrade = inspection.pipeline?.stage5_maintenancePlanner?.suggestedTrade || 'Structural & Masonry';

    if (isCrack) {
      stepSequence = [
        'Phase 1: Surface cleaning and removal of friable paint along fissure margin.',
        'Phase 2: Install calibrated tell-tale crack gauge and establish baseline measurement.',
        'Phase 3: Structural engineer reviews 14-day movement log to classify active vs. dormant.',
        'Phase 4: Drill and install mechanical injection packers at 150mm centers along crack line.',
        'Phase 5: Low-pressure injection of structural epoxy resin until refusal.',
        'Phase 6: Cut packers flush, patch ports with polymer mortar, and apply protective coating.'
      ];
      requiredMaterials = [
        'Low-Viscosity Epoxy Crack Injection Resin (1L)',
        'Packers & Injection Ports (Pack of 20)',
        'Polymer-Modified Mortar (PMM) 25kg bag',
        'Vapor-permeable anti-carbonation coating'
      ];
      requiredTools = ['High-Pressure Epoxy Injection Pump', 'Electric rotary hammer drill', 'Putty knives', 'Wire brushes'];
    } else if (isWater || isDampness) {
      recommendedTrade = 'Waterproofing & Damp Proofing';
      stepSequence = [
        'Phase 1: Perform pressure test and IR moisture mapping to identify and isolate water source.',
        'Phase 2: Eliminate active water source (repair pipe, regrout coping, or flash exterior joint).',
        'Phase 3: Allow substrate to dry until moisture content falls below 5% (verified by meter).',
        'Phase 4: Remove efflorescence salts mechanically using dry wire brushes (do not wash inward).',
        'Phase 5: Apply two coats of crystalline hydrophilic waterproofing slurry.',
        'Phase 6: Final breathable finish coating after 7-day cure.'
      ];
      requiredMaterials = [
        'Crystalline Waterproofing Slurry (20kg)',
        'Surface Crack Filler / Acrylic Paste (5kg)',
        'Elastomeric Breathable Waterproof Exterior Paint (20L)'
      ];
      requiredTools = ['Industrial Moisture Meter', 'Thermal infrared camera', 'Stiff wire brushes', 'Slurry application brush'];
    } else {
      stepSequence = [
        'Phase 1: Sounding and perimeter delineation with chalk mark.',
        'Phase 2: Chipping unsound concrete back 20mm behind corroded reinforcement.',
        'Phase 3: Mechanical wire-wheel de-rusting of steel to SA 2.5 bright finish.',
        'Phase 4: Apply zinc-rich anti-corrosion primer to steel within 4 hours of cleaning.',
        'Phase 5: Apply bonding agent and build up polymer-modified repair mortar in 20mm lifts.',
        'Phase 6: Water curing for 72 hours followed by anti-carbonation protective paint.'
      ];
      requiredMaterials = [
        'Zinc-Rich Anti-Corrosion Rebar Primer (1L)',
        'Polymer-Modified Mortar (PMM) 25kg bag',
        'Bonding slurry and curing compound',
        'Anti-carbonation protective paint'
      ];
      requiredTools = ['Electric Concrete Chipping Hammer & Grinder', 'Wire wheel brushes', 'Trowels and floats', 'Cordon barricade kit'];
    }

    // Build the 3 distinct Repair Options (Option A, Option B, Option C)
    const options: RepairOption[] = [
      {
        id: `opt-a-${inspection.id.slice(0, 8)}`,
        optionKey: 'OPTION_A',
        title: 'Localized Precision Remediation',
        approachType: 'LOCALIZED',
        scopeOfWork: `Targeted repair strictly confined to the visible ${category} zone (${inspection.floorOrRoom || 'Inspection location'}). Focuses on eliminating the immediate surface defect while monitoring underlying performance.`,
        requiredMaterials: requiredMaterials.slice(0, 2),
        requiredSpecialist: 'Certified Trade Repair Technician',
        estimatedDuration: '1 to 2 Working Days',
        advantages: ['Minimal operational disruption', 'Lowest immediate mobilization cost', 'Rapid completion'],
        limitations: ['Does not address potential adjacent concealed distress', 'Requires regular follow-up monitoring'],
        risks: ['Defect may re-manifest if unaddressed adjacent substrate is weak'],
        preconditions: ['Pre-repair moisture / crack movement test confirms defect is localized and dormant'],
        verificationRequirements: ['Visual inspection at 14 days and acoustic tap sounding'],
        isStructurallyAdequate: false,
        requiresPEValidation: isCrack || isSpalling,
        suggestedLineItems: [
          { category: 'LABOUR', description: 'Skilled Structural Mason / Repair Specialist (2 days)', quantity: 2, unit: 'Day', unitRate: 1100 },
          { category: 'LABOUR', description: 'General Laborer / Helper (2 days)', quantity: 2, unit: 'Day', unitRate: 650 },
          { category: 'MATERIAL', description: requiredMaterials[0] || 'Polymer-Modified Mortar (PMM) 25kg bag', quantity: 2, unit: 'kg', unitRate: 48 },
          { category: 'EQUIPMENT', description: 'Electric Concrete Chipping Hammer & Grinder', quantity: 1, unit: 'Day', unitRate: 600 }
        ]
      },
      {
        id: `opt-b-${inspection.id.slice(0, 8)}`,
        optionKey: 'OPTION_B',
        title: 'Comprehensive Substrate Remediation & Barrier',
        approachType: 'EXTENSIVE',
        scopeOfWork: `Full-bay remedial overhaul extending 1 meter beyond the visible boundaries of ${category}. Includes complete substrate preparation, mechanical anchoring, dual-barrier waterproofing or structural mortar build-up, and full protective coating.`,
        requiredMaterials: requiredMaterials,
        requiredSpecialist: 'Specialist Remedial Contractor',
        estimatedDuration: '4 to 6 Working Days',
        advantages: ['Comprehensive long-term durability', 'Includes multi-year warranty provision', 'Significantly lowers repeat maintenance costs'],
        limitations: ['Moderate operational disruption in adjacent zones', 'Higher initial investment'],
        risks: ['Dust and noise during substrate breakout phases'],
        preconditions: ['Access clearances and temporary dust containment partitioning in place'],
        verificationRequirements: ['Pull-off adhesion bond strength testing', 'Electronic moisture meter verification < 5%'],
        isStructurallyAdequate: true,
        requiresPEValidation: true,
        suggestedLineItems: [
          { category: 'LABOUR', description: 'Skilled Structural Mason / Repair Specialist (5 days)', quantity: 5, unit: 'Day', unitRate: 1100 },
          { category: 'LABOUR', description: 'General Laborer / Helper (5 days)', quantity: 5, unit: 'Day', unitRate: 650 },
          { category: 'MATERIAL', description: requiredMaterials[0] || 'Polymer-Modified Mortar (PMM) 25kg bag', quantity: 6, unit: 'kg', unitRate: 48 },
          { category: 'MATERIAL', description: requiredMaterials[1] || 'Zinc-Rich Anti-Corrosion Rebar Primer (1L)', quantity: 2, unit: 'kg', unitRate: 520 },
          { category: 'ACCESS_SCAFFOLDING', description: 'Mobile Tubular Steel Scaffolding Tower', quantity: 4, unit: 'Day', unitRate: 1200 },
          { category: 'TRANSPORT_DISPOSAL', description: 'Debris Removal & Environmental Waste Disposal', quantity: 1, unit: 'Lump sum', unitRate: 1800 }
        ]
      },
      {
        id: `opt-c-${inspection.id.slice(0, 8)}`,
        optionKey: 'OPTION_C',
        title: 'Specialist-Led Forensic Intervention & Engineering Sign-Off',
        approachType: 'SPECIALIST_LED',
        scopeOfWork: `Forensic engineering investigation with non-destructive testing (UPV / core testing), high-pressure structural stabilization, and PE compliance certification. Required when life safety or structural load-bearing capacity may be compromised.`,
        requiredMaterials: [...requiredMaterials, 'Zinc-Rich Anti-Corrosion Rebar Primer (1L)'],
        requiredSpecialist: 'Chartered Structural Engineer & Forensic Specialist',
        estimatedDuration: '7 to 10 Working Days',
        advantages: ['Certified legal & structural compliance', 'Complete structural load assurance', 'Insurable engineering sign-off'],
        limitations: ['Highest investment tier', 'Requires formal engineering submittals and test lead time'],
        risks: ['Potential discovery of wider structural deficiencies during core testing'],
        preconditions: ['Structural drawings review and formal permit clearance'],
        verificationRequirements: ['Structural compliance certificate issued by licensed PE', 'Ultrasonic core verification'],
        isStructurallyAdequate: true,
        requiresPEValidation: true,
        suggestedLineItems: [
          { category: 'LABOUR', description: 'Licensed Structural Engineer (Inspection & Sign-off)', quantity: 1, unit: 'Lump sum', unitRate: 7500 },
          { category: 'LABOUR', description: 'Skilled Structural Mason / Repair Specialist', quantity: 6, unit: 'Day', unitRate: 1100 },
          { category: 'LABOUR', description: 'General Laborer / Helper', quantity: 6, unit: 'Day', unitRate: 650 },
          { category: 'MATERIAL', description: requiredMaterials[0] || 'Low-Viscosity Epoxy Crack Injection Resin (1L)', quantity: 4, unit: 'kg', unitRate: 680 },
          { category: 'EQUIPMENT', description: 'High-Pressure Epoxy Injection Pump (Daily Rental)', quantity: 3, unit: 'Day', unitRate: 1500 },
          { category: 'ACCESS_SCAFFOLDING', description: 'Mobile Tubular Steel Scaffolding Tower', quantity: 6, unit: 'Day', unitRate: 1200 },
          { category: 'ACCESS_SCAFFOLDING', description: 'Safety Cordon Barricade & Warning Signage Kit', quantity: 1, unit: 'Lump sum', unitRate: 1500 }
        ]
      }
    ];

    const repairPlan: RepairPlan = {
      id: `plan-${inspection.id}`,
      inspectionId: inspection.id,
      userId: (inspection as any).userId,
      propertyId: inspection.propertyId,
      propertyName: inspection.propertyName,
      location: `${inspection.location} • ${inspection.floorOrRoom}`,
      defectCategory: category,
      defectTitle: `${category} Remediation & Maintenance Plan`,
      observedCondition,
      possibleCauses,
      diagnosticTests,
      requiresDiagnosticCheckBeforeRepair: isCosmeticProhibited,
      isCosmeticProhibited,
      repairObjective: `Restore substrate durability, eliminate active degradation factors, and ensure compliance with NBC 2016 and IS 456 engineering standards.`,
      recommendedApproach: isCritical
        ? 'Urgent structural stabilization preceded by licensed engineer site review.'
        : 'Diagnostic-first remediation addressing root moisture/structural cause before cosmetic reinstatement.',
      requiredTrade: recommendedTrade as any,
      requiredMaterials,
      requiredTools,
      estimatedWorkforce: '1 Lead Specialist Technician + 1 Assistant Helper',
      estimatedDurationDays: isCritical ? 4.0 : 2.0,
      estimatedDurationHours: isCritical ? 32.0 : 16.0,
      preparationRequirements: [
        'Secure clean water and 230V electrical power access.',
        'Erect safety cordon and protective dust drop-sheets.',
        'Notify building occupants of scheduled noisy works.'
      ],
      stepSequence,
      qcCheckpoints: [
        'Substrate Soundness Check: Ensure 100% sound concrete free of friable dust.',
        'Moisture Content Check: Verify substrate moisture level < 5% before sealing.',
        'Primer Coverage: Verify 100% pinhole-free coverage of rebar primer.',
        'Aperture Verification: Ensure zero hollow sound on light hammer tapping.'
      ],
      postRepairVerification: [
        'Post-repair inspection at 24 hours, 7 days, and 30 days.',
        'Crack microscope or tell-tale re-reading to verify zero further displacement.',
        'Signed contractor remediation quality warranty.'
      ],
      safetyPrecautions,
      stopWorkConditions,
      permitsAndApprovals: isCritical
        ? ['Building Management Hot Work & Structural Alteration Permit', 'Structural Engineer Sign-off']
        : ['Building Management Access Clearance'],
      limitations: [
        'Assessment based on non-destructive visual and optical inspection evidence.',
        'Hidden internal reinforcement or concealed plumbing routes require destructive core sampling to confirm 100% integrity.'
      ],
      professionalConfirmationRequired: isCritical || isCrack || isSpalling,
      professionalConfirmationRationale:
        'Structural fractures and concrete spalling require licensed structural engineer validation under IS 456 standards to guarantee load-bearing safety.',
      options,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...optionsOverride
    };

    // Build the initial draft estimate based on Option A
    const defaultOption = options[0];
    const initialLineItems: RepairEstimateLineItem[] = (defaultOption.suggestedLineItems || []).map((s, idx) => ({
      id: `item-init-${idx + 1}`,
      category: s.category || 'MATERIAL',
      description: s.description || 'Repair Material / Labor Item',
      quantity: s.quantity || 1,
      unit: (s.unit as any) || 'No.',
      unitRate: s.unitRate || 100,
      lineTotal: Math.round((s.quantity || 1) * (s.unitRate || 100) * 100) / 100,
      rateSource: 'Standard Indian Schedule of Rates (DSR / CPWD Base)',
      isManual: false
    }));

    const totals = this.calculateEstimateTotals(initialLineItems, null, null, 'INR');

    const initialEstimate: RepairCostEstimate = {
      id: `est-${inspection.id}-v1`,
      inspectionId: inspection.id,
      userId: (inspection as any).userId,
      propertyId: inspection.propertyId,
      repairPlanId: repairPlan.id,
      repairOptionId: defaultOption.id,
      selectedOptionKey: 'OPTION_A',
      version: 1,
      status: 'DRAFT',
      currency: 'INR',
      currencySymbol: '₹',
      measurements: {
        lengthM: undefined,
        widthM: undefined,
        areaM2: undefined,
        missingMeasurements: ['Length (m)', 'Width (m)', 'Area (m²) or Unit Count']
      },
      lineItems: totals.recalculatedLineItems,
      subtotal: totals.subtotal,
      contingencyPercent: null,
      contingencyAmount: 0,
      taxPercent: null,
      taxAmount: 0,
      totalAmount: totals.totalAmount,
      missingInformationWarnings: [
        'Measurement required before a reliable estimate can be calculated.',
        ...totals.missingInformationWarnings
      ],
      assumptions: [
        'Rates derived from standard regional maintenance catalog (DSR 2023 / CPWD reference).',
        'Subject to on-site physical measurement verification by the Property Manager.',
        'Contingency and GST taxes not applied until configured by the property administrator.'
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { repairPlan, initialEstimate };
  }

  /**
   * Versioning Safeguard:
   * When an approved or submitted estimate is modified, supersedes the previous
   * version and creates a brand-new revision version (e.g. v2) so historical
   * records remain immutable and auditable.
   */
  public createRevisedVersion(
    currentEstimate: RepairCostEstimate,
    newMeasurements: RepairMeasurements,
    newLineItems: RepairEstimateLineItem[],
    contingencyPercent?: number | null,
    taxPercent?: number | null,
    modifierName?: string
  ): {
    supersededEstimate: RepairCostEstimate;
    newRevisionEstimate: RepairCostEstimate;
    approvalAuditItem: RepairApprovalHistoryItem;
  } {
    const newVersionNumber = currentEstimate.version + 1;
    const newEstimateId = `est-${currentEstimate.inspectionId}-v${newVersionNumber}`;

    const totals = this.calculateEstimateTotals(newLineItems, contingencyPercent, taxPercent, currentEstimate.currency);

    const supersededEstimate: RepairCostEstimate = {
      ...currentEstimate,
      status: 'SUPERSEDED',
      supersededBy: newEstimateId,
      updatedAt: new Date().toISOString()
    };

    const newRevisionEstimate: RepairCostEstimate = {
      id: newEstimateId,
      inspectionId: currentEstimate.inspectionId,
      userId: currentEstimate.userId,
      propertyId: currentEstimate.propertyId,
      repairPlanId: currentEstimate.repairPlanId,
      repairOptionId: currentEstimate.repairOptionId,
      selectedOptionKey: currentEstimate.selectedOptionKey,
      version: newVersionNumber,
      status: 'DRAFT',
      currency: currentEstimate.currency,
      currencySymbol: totals.currencySymbol,
      measurements: newMeasurements,
      lineItems: totals.recalculatedLineItems,
      subtotal: totals.subtotal,
      contingencyPercent: totals.contingencyPercent,
      contingencyAmount: totals.contingencyAmount,
      taxPercent: totals.taxPercent,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      missingInformationWarnings: totals.missingInformationWarnings,
      assumptions: [
        ...currentEstimate.assumptions,
        `Revision v${newVersionNumber} created from superseded v${currentEstimate.version} on ${new Date().toLocaleDateString()}.`
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const approvalAuditItem: RepairApprovalHistoryItem = {
      id: `audit-${Date.now()}`,
      estimateId: currentEstimate.id,
      userId: currentEstimate.userId || 'current-user',
      userName: modifierName || 'Property Manager',
      action: 'REVISION_REQUESTED',
      comments: `Estimate v${currentEstimate.version} modified; created revision v${newVersionNumber} as draft.`,
      timestamp: new Date().toISOString()
    };

    return {
      supersededEstimate,
      newRevisionEstimate,
      approvalAuditItem
    };
  }
}

export const repairEngineService = new RepairEngineService();
