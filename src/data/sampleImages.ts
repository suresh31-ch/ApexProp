/**
 * High-fidelity test images for the Inspection Engine
 * Includes both Defect Scenarios and a Clean Normal Wall scenario for the Critical Acceptance Test.
 */

// Helper to convert SVG to data URL
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// 1. Concrete Beam Shear Crack SVG (45-degree angled structural distress)
const shearCrackSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#78716c"/>
      <stop offset="50%" stop-color="#57534e"/>
      <stop offset="100%" stop-color="#44403c"/>
    </linearGradient>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise"/>
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.15 0" in="noise" result="coloredNoise"/>
      <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="composite"/>
      <feBlend mode="multiply" in="SourceGraphic" in2="composite"/>
    </filter>
  </defs>
  <rect width="800" height="600" fill="url(#beamGrad)" filter="url(#noise)"/>
  <!-- Concrete Texture Formwork Marks -->
  <line x1="0" y1="180" x2="800" y2="180" stroke="#292524" stroke-width="2" stroke-opacity="0.3"/>
  <line x1="0" y1="420" x2="800" y2="420" stroke="#292524" stroke-width="2" stroke-opacity="0.3"/>
  <!-- 45-degree prominent structural crack line -->
  <path d="M 180 520 Q 240 460 310 410 T 420 310 T 520 210 Q 560 170 610 110" 
        fill="none" stroke="#0c0a09" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Subsidiary micro-cracks radiating -->
  <path d="M 310 410 Q 360 420 400 450" fill="none" stroke="#1c1917" stroke-width="3" stroke-linecap="round"/>
  <path d="M 420 310 Q 400 260 380 230" fill="none" stroke="#1c1917" stroke-width="3" stroke-linecap="round"/>
  <path d="M 520 210 Q 580 220 620 240" fill="none" stroke="#1c1917" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Spalling / chipped concrete lip near crack -->
  <polygon points="415,315 435,305 440,320 425,328" fill="#292524"/>
  <polygon points="305,415 320,405 325,420 312,425" fill="#292524"/>
  <!-- Dimension scale reference annotation -->
  <rect x="50" y="520" width="120" height="30" fill="#1e293b" rx="4" opacity="0.8"/>
  <text x="65" y="540" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">SCALE: 100mm</text>
  <line x1="60" y1="545" x2="160" y2="545" stroke="#f8fafc" stroke-width="2"/>
</svg>`;

// 2. Moisture Seepage & Salt Efflorescence SVG
const moistureEfflorescenceSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="wallBase" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="60%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <radialGradient id="dampSpot" cx="50%" cy="60%" r="50%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.85"/>
      <stop offset="50%" stop-color="#334155" stop-opacity="0.6"/>
      <stop offset="85%" stop-color="#475569" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#64748b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#wallBase)"/>
  <!-- Basement cold joint horizontal seam -->
  <line x1="0" y1="360" x2="800" y2="360" stroke="#334155" stroke-width="4"/>
  <!-- Moisture ingress dark damp shadow spreading -->
  <ellipse cx="400" cy="380" rx="320" ry="180" fill="url(#dampSpot)"/>
  <!-- White crystalline efflorescence salt encrustation bands -->
  <path d="M 120 370 Q 240 330 380 365 T 600 340 T 740 375" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" opacity="0.85"/>
  <path d="M 180 390 Q 280 355 420 385 T 640 360" fill="none" stroke="#f1f5f9" stroke-width="12" stroke-linecap="round" opacity="0.9"/>
  <!-- Salt crystallization clusters -->
  <circle cx="280" cy="350" r="14" fill="#ffffff" opacity="0.9"/>
  <circle cx="450" cy="370" r="18" fill="#ffffff" opacity="0.95"/>
  <circle cx="340" cy="390" r="12" fill="#f8fafc" opacity="0.85"/>
  <circle cx="530" cy="355" r="15" fill="#ffffff" opacity="0.9"/>
  <!-- Water drip run marks -->
  <path d="M 280 365 L 280 480" stroke="#1e293b" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
  <path d="M 450 388 L 450 510" stroke="#1e293b" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
  <path d="M 530 370 L 530 460" stroke="#1e293b" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
</svg>`;

// 3. Normal Clean Intact Room (NO DEFECT — Critical Acceptance Test)
const cleanNormalRoomSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="cleanWall" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="floorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b45309"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
  </defs>
  <!-- Pristine smooth painted wall -->
  <rect x="0" y="0" width="800" height="420" fill="url(#cleanWall)"/>
  <!-- Clean skirting board / baseboard -->
  <rect x="0" y="414" width="800" height="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
  <!-- Polished timber floor -->
  <rect x="0" y="432" width="800" height="168" fill="url(#floorGrad)"/>
  <line x1="160" y1="432" x2="160" y2="600" stroke="#92400e" stroke-width="1"/>
  <line x1="380" y1="432" x2="380" y2="600" stroke="#92400e" stroke-width="1"/>
  <line x1="620" y1="432" x2="620" y2="600" stroke="#92400e" stroke-width="1"/>
  <!-- Clean framed art hanging perfectly -->
  <rect x="280" y="80" width="240" height="180" fill="#ffffff" stroke="#334155" stroke-width="6" rx="2"/>
  <rect x="296" y="96" width="208" height="148" fill="#e0f2fe"/>
  <circle cx="400" cy="170" r="35" fill="#38bdf8"/>
  <!-- Perfectly clean, unblemished smooth surface with soft light -->
  <ellipse cx="400" cy="60" rx="250" ry="40" fill="#ffffff" opacity="0.6"/>
</svg>`;

// 4. Obstructed / Blurry Dim Image (INCONCLUSIVE TEST)
const obstructedDimSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <filter id="heavyBlur">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
  </defs>
  <rect width="800" height="600" fill="#18181b"/>
  <!-- Blurry dark corner -->
  <rect x="100" y="80" width="600" height="440" fill="#27272a" filter="url(#heavyBlur)"/>
  <!-- Heavy foreground shadow obstruction -->
  <path d="M 0 0 L 450 0 L 250 600 L 0 600 Z" fill="#09090b" opacity="0.94"/>
  <circle cx="580" cy="320" r="140" fill="#3f3f46" opacity="0.4" filter="url(#heavyBlur)"/>
  <text x="320" y="560" fill="#71717a" font-family="sans-serif" font-size="14">OBSTRUCTED FOREGROUND & LOW LIGHT TEST</text>
</svg>`;

// 5. Macro Close-Up with Precision Millimeter Scale Reference
const macroRulerCrackSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#57534e"/>
  <!-- High magnification concrete aggregate texture -->
  <circle cx="180" cy="150" r="45" fill="#44403c"/>
  <circle cx="340" cy="220" r="30" fill="#78716c"/>
  <circle cx="280" cy="460" r="55" fill="#44403c"/>
  <circle cx="560" cy="420" r="40" fill="#78716c"/>
  <!-- High resolution crack with distinct 2.5mm aperture -->
  <path d="M 400 0 Q 380 180 410 320 T 390 600" fill="none" stroke="#09090b" stroke-width="14" stroke-linecap="round"/>
  <path d="M 410 320 Q 460 360 520 390" fill="none" stroke="#1c1917" stroke-width="6" stroke-linecap="round"/>
  <!-- Calibrated steel engineer's ruler placed adjacent -->
  <rect x="460" y="120" width="160" height="380" fill="#e2e8f0" stroke="#0f172a" stroke-width="3" rx="4"/>
  <rect x="470" y="130" width="30" height="360" fill="#cbd5e1"/>
  <!-- Ruler tick marks -->
  <line x1="500" y1="160" x2="540" y2="160" stroke="#0f172a" stroke-width="3"/>
  <text x="550" y="165" font-family="monospace" font-size="14" font-weight="bold" fill="#0f172a">0 mm</text>
  <line x1="500" y1="210" x2="530" y2="210" stroke="#0f172a" stroke-width="2"/>
  <line x1="500" y1="260" x2="540" y2="260" stroke="#0f172a" stroke-width="3"/>
  <text x="550" y="265" font-family="monospace" font-size="14" font-weight="bold" fill="#0f172a">10 mm</text>
  <line x1="500" y1="310" x2="530" y2="310" stroke="#0f172a" stroke-width="2"/>
  <line x1="500" y1="360" x2="540" y2="360" stroke="#0f172a" stroke-width="3"/>
  <text x="550" y="365" font-family="monospace" font-size="14" font-weight="bold" fill="#0f172a">20 mm</text>
  <line x1="500" y1="410" x2="530" y2="410" stroke="#0f172a" stroke-width="2"/>
  <line x1="500" y1="460" x2="540" y2="460" stroke="#0f172a" stroke-width="3"/>
  <text x="550" y="465" font-family="monospace" font-size="14" font-weight="bold" fill="#0f172a">30 mm</text>
</svg>`;

// 6. Concrete Spalling with Exposed Corroded Rebar (Safety Hazard Test)
const spallingRebarSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="concSlab" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#78716c"/>
      <stop offset="100%" stop-color="#57534e"/>
    </linearGradient>
    <radialGradient id="spallCavity" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="70%" stop-color="#292524"/>
      <stop offset="100%" stop-color="#44403c"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#concSlab)"/>
  <!-- Concrete spalling fracture cavity (delaminated cover concrete) -->
  <path d="M 180 240 Q 240 180 400 190 T 620 230 Q 660 340 590 420 T 360 440 Q 200 420 180 240 Z" fill="url(#spallCavity)"/>
  <!-- Fractured concrete edge lips -->
  <path d="M 180 240 Q 240 180 400 190 T 620 230" fill="none" stroke="#0c0a09" stroke-width="6"/>
  <!-- Corroded steel rebar exposed inside spall cavity -->
  <line x1="220" y1="310" x2="580" y2="310" stroke="#7c2d12" stroke-width="18" stroke-linecap="round"/>
  <line x1="220" y1="310" x2="580" y2="310" stroke="#c2410c" stroke-width="12" stroke-linecap="round"/>
  <!-- Rust staining bleeding downward -->
  <path d="M 280 310 L 280 500" stroke="#9a3412" stroke-width="8" stroke-linecap="round" opacity="0.7"/>
  <path d="M 380 310 L 380 530" stroke="#c2410c" stroke-width="12" stroke-linecap="round" opacity="0.8"/>
  <path d="M 480 310 L 480 490" stroke="#7c2d12" stroke-width="7" stroke-linecap="round" opacity="0.6"/>
  <!-- Second transverse rebar tie wire -->
  <line x1="340" y1="210" x2="340" y2="420" stroke="#9a3412" stroke-width="10" stroke-linecap="round"/>
  <line x1="460" y1="210" x2="460" y2="420" stroke="#7c2d12" stroke-width="10" stroke-linecap="round"/>
</svg>`;

export interface SampleInspectionScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  propertyName: string;
  location: string;
  buildingType: string;
  floorOrRoom: string;
  expectedResult: 'CRITICAL_DEFECT' | 'MODERATE_DEFECT' | 'CLEAN_NO_DEFECT' | 'INCONCLUSIVE';
  dataUrl: string;
  notes: string;
  secondaryDataUrl?: string;
  secondaryLabel?: string;
  pinpointCoordinate?: { xPercent: number; yPercent: number; label: string };
}

export const SAMPLE_SCENARIOS: SampleInspectionScenario[] = [
  {
    id: 'sample-crack',
    name: 'Structural Beam Diagonal Crack',
    category: 'Structural Concrete',
    description: 'Prominent 45-degree diagonal shear fracture on load-bearing reinforced concrete beam.',
    propertyName: 'Cyber Gateway Office Complex',
    location: 'HITEC City, Hyderabad',
    buildingType: 'Commercial',
    floorOrRoom: 'Podium Level 2, Beam C-4',
    expectedResult: 'CRITICAL_DEFECT',
    dataUrl: svgToDataUrl(shearCrackSvg),
    notes: 'Visible inclined fracture line with chipped edge lips.',
    secondaryDataUrl: svgToDataUrl(macroRulerCrackSvg),
    secondaryLabel: 'Close-Up Macro with Millimeter Scale Ruler',
    pinpointCoordinate: { xPercent: 52.5, yPercent: 41.0, label: 'Shear crack origin & lip chipping' }
  },
  {
    id: 'sample-moisture',
    name: 'Basement Wall Efflorescence & Damp',
    category: 'Water Ingress',
    description: 'White mineral salt efflorescence crystals and capillary moisture spread along cold joint.',
    propertyName: 'Riverside Towers',
    location: 'Sector 42, Gurgaon',
    buildingType: 'Residential',
    floorOrRoom: 'Basement Parking Column B-14',
    expectedResult: 'MODERATE_DEFECT',
    dataUrl: svgToDataUrl(moistureEfflorescenceSvg),
    notes: 'Efflorescence banding and moisture shadow near cold joint.',
    pinpointCoordinate: { xPercent: 50.0, yPercent: 62.0, label: 'Efflorescence crystal cluster' }
  },
  {
    id: 'sample-spalling',
    name: 'Concrete Spalling with Corroded Rebar',
    category: 'Structural Spalling',
    description: 'Delaminated cover concrete exposing heavily corroded reinforcement with rust bleed.',
    propertyName: 'Riverside Towers',
    location: 'Sector 42, Gurgaon',
    buildingType: 'Residential',
    floorOrRoom: 'Basement Parking Driveway Ceiling',
    expectedResult: 'CRITICAL_DEFECT',
    dataUrl: svgToDataUrl(spallingRebarSvg),
    notes: 'Concrete spall cavity exposing primary longitudinal and stirrup rebar. Rust staining evident.',
    pinpointCoordinate: { xPercent: 48.0, yPercent: 52.0, label: 'Exposed corroded steel bar' }
  },
  {
    id: 'sample-clean',
    name: 'Normal Clean Wall (Zero-Defect Test)',
    category: 'Acceptance Verification',
    description: 'Pristine smooth painted interior wall with timber flooring and framed artwork. No defect present.',
    propertyName: 'Green Valley Residences',
    location: 'Whitefield, Bengaluru',
    buildingType: 'Residential',
    floorOrRoom: 'Master Bedroom Wall A',
    expectedResult: 'CLEAN_NO_DEFECT',
    dataUrl: svgToDataUrl(cleanNormalRoomSvg),
    notes: 'Verify AI returns "No visible property defect confidently identified" and does not invent any fake cracks.'
  },
  {
    id: 'sample-clean-pinpoint',
    name: 'Clean Wall with False Pinpoint Test',
    category: 'Zero Hallucination Test',
    description: 'Pinpoint placed intentionally on an unblemished clean wall section to ensure AI does not hallucinate.',
    propertyName: 'Prestige Meridian Tower',
    location: 'MG Road, Bengaluru',
    buildingType: 'Commercial',
    floorOrRoom: 'Executive Lounge, Wall East',
    expectedResult: 'CLEAN_NO_DEFECT',
    dataUrl: svgToDataUrl(cleanNormalRoomSvg),
    notes: 'Target pin placed on clean paint. AI must report defect_confirmed_at_target: false.',
    pinpointCoordinate: { xPercent: 32.0, yPercent: 28.0, label: 'Inspector test pinpoint on sound wall' }
  },
  {
    id: 'sample-obstructed',
    name: 'Obstructed / Dim Photo (Inconclusive Test)',
    category: 'Diagnostic Boundaries',
    description: 'Heavily shadowed and blurry view testing AI recognition of low image quality and reporting inconclusive status.',
    propertyName: 'Old Cantonment Warehouse',
    location: 'Secunderabad',
    buildingType: 'Warehouse / Logistics',
    floorOrRoom: 'Rear Storage Bay 4',
    expectedResult: 'INCONCLUSIVE',
    dataUrl: svgToDataUrl(obstructedDimSvg),
    notes: 'Testing low optical resolution and obstruction handling.'
  }
];

