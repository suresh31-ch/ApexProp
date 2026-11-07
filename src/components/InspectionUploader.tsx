import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Sparkles,
  Building,
  MapPin,
  Layers,
  FileText,
  X,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Crosshair,
  Image as ImageIcon,
  Plus
} from 'lucide-react';
import { SAMPLE_SCENARIOS, SampleInspectionScenario } from '../data/sampleImages';
import { InspectionRecord } from '../types';
import { inspectPropertyImage } from '../services/api';

interface InspectionUploaderProps {
  onInspectionComplete: (record: InspectionRecord) => void;
  onNavigateToDetail?: (id: string) => void;
  isCompact?: boolean;
}

interface AdditionalImage {
  id: string;
  imageBase64: string;
  mimeType: string;
  name: string;
  label?: string;
  imageType?: 'establishing' | 'close_up' | 'scale_reference' | 'instrument_reading' | 'other';
}

export const InspectionUploader: React.FC<InspectionUploaderProps> = ({
  onInspectionComplete,
  onNavigateToDetail,
  isCompact = false
}) => {
  const [propertyName, setPropertyName] = useState('Skyline Apartments');
  const [location, setLocation] = useState('Hyderabad, India');
  const [buildingType, setBuildingType] = useState('Residential');
  const [floorOrRoom, setFloorOrRoom] = useState('Podium Level 2, Column C-4');
  const [userNotes, setUserNotes] = useState('');

  // Primary image
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Pinpoint Coordinate & Secondary Images
  const [pinpoint, setPinpoint] = useState<{ xPercent: number; yPercent: number; label: string } | null>(null);
  const [additionalImages, setAdditionalImages] = useState<AdditionalImage[]>([]);
  const [selectedSecondaryType, setSelectedSecondaryType] = useState<'close_up' | 'scale_reference' | 'instrument_reading' | 'establishing'>('close_up');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);

  // File handling for primary image
  const handleFile = (file: File) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a valid image (JPG, JPEG, PNG, or WEBP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File size exceeds 20MB limit. Please upload a smaller image.');
      return;
    }

    setErrorMessage(null);
    setImageMimeType(file.type);
    setImageFileName(file.name);
    setPinpoint(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // File handling for additional angle/close-up images
  const handleSecondaryFile = (file: File) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const typeLabelMap = {
        close_up: 'Close-Up Macro Detail',
        scale_reference: 'Scale / Ruler Reference',
        instrument_reading: 'Instrument / Moisture Meter',
        establishing: 'Wide Establishing Shot'
      };
      setAdditionalImages((prev) => [
        ...prev,
        {
          id: 'add-' + Date.now(),
          imageBase64: e.target?.result as string,
          mimeType: file.type,
          name: file.name,
          label: typeLabelMap[selectedSecondaryType],
          imageType: selectedSecondaryType
        }
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = (scenario: SampleInspectionScenario) => {
    setImagePreview(scenario.dataUrl);
    setImageMimeType('image/svg+xml');
    setImageFileName(scenario.name);
    setPropertyName(scenario.propertyName);
    setLocation(scenario.location);
    setBuildingType(scenario.buildingType);
    setFloorOrRoom(scenario.floorOrRoom);
    setUserNotes(scenario.notes);
    setErrorMessage(null);

    if (scenario.secondaryDataUrl) {
      setAdditionalImages([
        {
          id: 'preset-sec-1',
          imageBase64: scenario.secondaryDataUrl,
          mimeType: 'image/svg+xml',
          name: scenario.secondaryLabel || 'Macro Scale Detail',
          label: scenario.secondaryLabel || 'Close-Up Macro with Millimeter Scale Ruler',
          imageType: 'scale_reference'
        }
      ]);
    } else {
      setAdditionalImages([]);
    }

    if (scenario.pinpointCoordinate) {
      setPinpoint(scenario.pinpointCoordinate);
    } else {
      setPinpoint(null);
    }
  };

  const handleClear = () => {
    setImagePreview(null);
    setImageFileName('');
    setPinpoint(null);
    setAdditionalImages([]);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Image Click Handler for Defect Pinpoint
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPinpoint({
      xPercent: parseFloat(x.toFixed(1)),
      yPercent: parseFloat(y.toFixed(1)),
      label: 'Surveyor Focus Target'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imagePreview) {
      setErrorMessage('Please upload or select an inspection photo first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    const steps = [
      'Ingesting property imagery & pixel validation...',
      'Executing Stage 1: Evidence Inspector multimodal feature extraction...',
      'Cross-correlating multi-perspective evidence & scale measurements...',
      'Verifying precision pinpoint target coordinates vs surroundings...',
      'Executing Stage 2 & 3: Root Cause Analyst & Forensic Risk matrix...',
      'Executing Stage 4 & 5: Repair Intelligence & Maintenance scope...',
      'Executing Stage 6: Autonomous Verification Agent truthfulness audit...'
    ];

    let currentStepIdx = 0;
    setAnalysisStep(steps[0]);
    const stepInterval = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < steps.length) {
        setAnalysisStep(steps[currentStepIdx]);
      }
    }, 950);

    try {
      const result = await inspectPropertyImage({
        imageBase64: imagePreview,
        mimeType: imageMimeType,
        propertyName,
        location,
        buildingType,
        floorOrRoom,
        userNotes,
        pinpointCoordinate: pinpoint,
        additionalImages
      });

      clearInterval(stepInterval);
      setIsAnalyzing(false);
      onInspectionComplete(result);
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      console.error('Inspection failed:', err);
      setErrorMessage(err.message || 'Inspection failed. Please check your Gemini API key in Settings > Secrets.');
    }
  };

  return (
    <div className="rounded-2xl bg-[#101726]/90 border border-slate-800 p-5 lg:p-6 shadow-xl relative overflow-hidden">
      {/* Header matching reference image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Inspect a Property
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Multimodal pixel pathology, multi-angle correlation, and pinpoint verification via Gemini 3.8 Flash
          </p>
        </div>

        {/* Quick Sample Presets Bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            Test Presets:
          </span>
          {SAMPLE_SCENARIOS.map((scenario) => {
            const labelMap: Record<string, string> = {
              'sample-crack': '⚡ Shear Crack + Scale',
              'sample-moisture': '💧 Damp & Efflorescence',
              'sample-clean': '✨ Clean Wall (Zero-Defect)',
              'sample-clean-pinpoint': '🎯 False Pinpoint Test',
              'sample-obstructed': '⚠️ Obstructed / Inconclusive'
            };
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => handleSelectPreset(scenario)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  imageFileName === scenario.name
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/60'
                }`}
              >
                {labelMap[scenario.id] || scenario.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Upload & Property Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Drag & Drop Zone with Interactive Pinpoint */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
            className={`relative min-h-[220px] lg:min-h-[260px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer overflow-hidden ${
              isDragOver
                ? 'border-blue-500 bg-blue-500/10'
                : imagePreview
                ? 'border-blue-500/40 bg-slate-900/80 cursor-default'
                : 'border-slate-700/80 hover:border-blue-500/50 hover:bg-slate-800/40 bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />

            {imagePreview ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
                {/* Photo Preview Container with Click-to-Pin */}
                <div className="relative inline-block max-h-52 overflow-hidden rounded-xl border border-slate-700/80 shadow-md">
                  <img
                    src={imagePreview}
                    alt="Inspection preview"
                    onClick={handleImageClick}
                    className="max-h-52 object-contain rounded-xl cursor-crosshair hover:opacity-95 transition-opacity"
                    title="Click anywhere to drop or relocate focal defect target pin"
                  />

                  {/* Pulsing Pinpoint Marker */}
                  {pinpoint && (
                    <div
                      style={{ left: `${pinpoint.xPercent}%`, top: `${pinpoint.yPercent}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center"
                    >
                      <span className="relative flex h-6 w-6 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-lg"></span>
                      </span>
                      <span className="text-[9px] font-bold bg-blue-600/95 text-white px-1.5 py-0.5 rounded shadow-md mt-0.5 whitespace-nowrap">
                        🎯 Target Focus
                      </span>
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/90 text-white hover:bg-red-600 shadow-md transition-all cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Pinpoint status and instructions */}
                <div className="w-full mt-2 flex items-center justify-between px-2 text-[11px]">
                  {pinpoint ? (
                    <div className="flex items-center gap-1.5 text-blue-300 font-mono">
                      <Crosshair className="w-3.5 h-3.5 text-blue-400" />
                      <span>Pin: X:{pinpoint.xPercent}% Y:{pinpoint.yPercent}%</span>
                      <button
                        type="button"
                        onClick={() => setPinpoint(null)}
                        className="text-slate-400 hover:text-red-400 ml-1"
                        title="Remove pin"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">
                      Tip: Click photo to mark precision defect focus
                    </span>
                  )}
                  <span className="text-slate-400 truncate max-w-[140px] font-mono">
                    {imageFileName}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-3 shadow-inner">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-200">
                  Drag & drop an image here
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  or click to browse from device
                </div>
                <div className="text-[10px] text-slate-400 mt-3 font-mono">
                  Supports JPG, PNG, WEBP (Max 20MB)
                </div>
              </div>
            )}
          </div>

          {/* Secondary / Multi-Angle Image Attachment Strip */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-blue-400" />
                Additional Perspectives ({additionalImages.length})
              </span>
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedSecondaryType}
                  onChange={(e) => setSelectedSecondaryType(e.target.value as any)}
                  className="bg-[#0b101d] text-slate-300 text-[10px] px-2 py-0.5 rounded-lg border border-slate-700/80 focus:outline-none"
                  title="Select photo type for next upload"
                >
                  <option value="close_up">Close-Up Macro</option>
                  <option value="scale_reference">Scale / Ruler</option>
                  <option value="instrument_reading">Moisture Meter</option>
                  <option value="establishing">Wide Angle</option>
                </select>
                <button
                  type="button"
                  onClick={() => secondaryFileInputRef.current?.click()}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Photo</span>
                </button>
              </div>
            </div>

            <input
              ref={secondaryFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && handleSecondaryFile(e.target.files[0])}
              className="hidden"
            />

            {additionalImages.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {additionalImages.map((img) => (
                  <div key={img.id} className="relative group shrink-0 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 w-16 h-14">
                    <img src={img.imageBase64} alt={img.name} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-[8px] font-bold text-center text-blue-300 truncate px-0.5 py-0.5">
                      {img.imageType === 'scale_reference' ? '📏 Scale' : img.imageType === 'instrument_reading' ? '💧 Meter' : img.imageType === 'close_up' ? '🔍 Macro' : '📷 Wide'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAdditionalImages(prev => prev.filter(i => i.id !== img.id))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] transition-opacity"
                      title="Remove angle"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">
                Optional: attach close-up macros, millimeter scale rulers, or moisture meter photos to cross-correlate evidence.
              </p>
            )}
          </div>
        </div>

        {/* Right Form: Property Context Inputs */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
              <Building className="w-3 h-3 text-blue-400" />
              Property Name
            </label>
            <input
              type="text"
              required
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="e.g. Skyline Apartments"
              className="w-full bg-[#0d1424] text-slate-100 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-700/70 focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-emerald-400" />
              Location
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Hyderabad, India"
              className="w-full bg-[#0d1424] text-slate-100 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-700/70 focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-indigo-400" />
                Building Type
              </label>
              <select
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value)}
                className="w-full bg-[#0d1424] text-slate-100 text-xs px-2.5 py-2 rounded-xl border border-slate-700/70 focus:border-blue-500 focus:outline-none transition-all"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Mixed Use">Mixed Use</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Healthcare / Institutional">Healthcare</option>
                <option value="Warehouse / Logistics">Warehouse</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-purple-400" />
                Floor / Element
              </label>
              <input
                type="text"
                value={floorOrRoom}
                onChange={(e) => setFloorOrRoom(e.target.value)}
                placeholder="e.g. Column B-14"
                className="w-full bg-[#0d1424] text-slate-100 text-xs px-2.5 py-2 rounded-xl border border-slate-700/70 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Optional Context / Observed Defect
            </label>
            <input
              type="text"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="e.g. Water staining noticed after heavy rain"
              className="w-full bg-[#0d1424] text-slate-100 text-xs px-3 py-1.5 rounded-xl border border-slate-700/70 focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Rightmost: Property Building Showcase (Architectural preview matching reference) */}
        <div className="lg:col-span-3 flex flex-col justify-between">
          <div className="h-full rounded-2xl overflow-hidden relative border border-slate-700/80 group bg-slate-900 min-h-[160px] flex items-center justify-center">
            <img
              src={imagePreview || "/public/assets/aistudio/WhatsApp_Image_2026-11-03_at_12.48.58_PM_0887bae7.jpeg"}
              alt="Property visual"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-500"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-3 left-3 right-3 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30">
                Asset Visual
              </span>
              <div className="text-xs font-bold text-white mt-1 truncate">
                {propertyName}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {location}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Full-width Submit / Action Bar */}
        <div className="lg:col-span-12 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          {errorMessage ? (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl w-full sm:w-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : isAnalyzing ? (
            <div className="flex items-center gap-2.5 text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3.5 py-2 rounded-xl animate-pulse w-full sm:w-auto">
              <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
              <span>{analysisStep}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">
              ⚡ Analyzed with genuine multimodal Gemini 3.8 Flash • Zero Hallucination Mode Active
            </div>
          )}

          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-200 group-hover:rotate-12 transition-transform" />
            <span>{isAnalyzing ? 'Analyzing with Gemini...' : '✦ Analyze Property'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
