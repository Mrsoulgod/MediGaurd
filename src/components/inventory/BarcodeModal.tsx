import React, { useState } from 'react';
import {
  QrCode,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  Package,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useMediGuard } from '../../context/MediGuardContext';
import { calculateExpiry } from '../../engines/expiry';
import { Batch, Medicine } from '../../schemas';

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBatch?: (batchId: string) => void;
}

// Lightweight realistic SVG Barcode component
export const MedicineBarcodeSVG: React.FC<{ code: string; width?: number; height?: number }> = ({
  code,
  width = 180,
  height = 50,
}) => {
  // Generate deterministic bar widths based on char codes
  const bars = Array.from(code).flatMap((char, i) => {
    const val = char.charCodeAt(0);
    return [
      (val % 3) + 1,
      ((val >> 1) % 2) + 1,
      ((val >> 2) % 3) + 1,
      1,
    ];
  });

  const totalUnits = bars.reduce((a, b) => a + b, 0);
  const scale = width / (totalUnits + 10);

  let currentX = 5;
  const rects: { x: number; w: number }[] = [];

  bars.forEach((barWidth, idx) => {
    if (idx % 2 === 0) {
      rects.push({ x: currentX * scale, w: barWidth * scale });
    }
    currentX += barWidth;
  });

  return (
    <div className="inline-flex flex-col items-center bg-white p-2 rounded border border-[#E7E5E4] shadow-2xs">
      <svg width={width} height={height} className="overflow-visible">
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={2} width={Math.max(1, r.w)} height={height - 12} fill="#1C1917" />
        ))}
      </svg>
      <span className="font-mono text-[10px] tracking-widest text-[#1C1917] mt-0.5">
        *{code.toUpperCase()}*
      </span>
    </div>
  );
};

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  isOpen,
  onClose,
  onSelectBatch,
}) => {
  const { batches, medicines, rules, locations } = useMediGuard();

  const [inputCode, setInputCode] = useState('');
  const [scannedBatch, setScannedBatch] = useState<Batch | null>(null);
  const [scannedMedicine, setScannedMedicine] = useState<Medicine | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(true);

  if (!isOpen) return null;

  const handleResolveCode = (code: string) => {
    const clean = code.trim().toLowerCase();
    if (!clean) return;

    // Search by batchCode, batchId, qrCode, or medicine SKU
    const foundBatch = batches.find(
      (b) =>
        b.batchCode.toLowerCase() === clean ||
        b.id.toLowerCase() === clean ||
        (b.qrCode && b.qrCode.toLowerCase() === clean) ||
        clean.includes(b.batchCode.toLowerCase())
    );

    if (foundBatch) {
      const med = medicines.find((m) => m.id === foundBatch.medicineId) || null;
      setScannedBatch(foundBatch);
      setScannedMedicine(med);
      setErrorMsg(null);
    } else {
      // Maybe user scanned a medicine SKU
      const foundMed = medicines.find(
        (m) => m.sku.toLowerCase() === clean || m.id.toLowerCase() === clean
      );
      if (foundMed) {
        const medBatch = batches.find((b) => b.medicineId === foundMed.id);
        if (medBatch) {
          setScannedBatch(medBatch);
          setScannedMedicine(foundMed);
          setErrorMsg(null);
          return;
        }
      }
      setErrorMsg(`Barcode "${code}" could not be resolved in the hospital formulary.`);
      setScannedBatch(null);
      setScannedMedicine(null);
    }
  };

  const presetHeroBarcodes = [
    { label: 'Ceftriaxone 1g (Central Surplus)', code: 'CTX-2026-HERO' },
    { label: 'Meropenem 1g (Emergency)', code: 'MERO-2026-STALE' },
    { label: 'Insulin Glargine (Cold-Chain)', code: 'INS-2026-COLD' },
    { label: 'Enoxaparin 40mg (ICU Syringe)', code: 'ENOX-2025-01' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#E7E5E4] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#C2410C]" />
            <h3 className="font-bold text-sm sm:text-base text-[#1C1917]">
              GS1 Barcode & 2D DataMatrix Scanner
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#78716C] hover:text-[#1C1917]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-xs">
          {/* Simulated Scanner Viewport */}
          <div className="relative rounded-xl overflow-hidden bg-stone-900 border border-[#E7E5E4] p-8 text-center flex flex-col items-center justify-center min-h-[170px]">
            {/* Viewfinder Target */}
            <div className="w-48 h-24 border-2 border-dashed border-[#EA580C] rounded-lg flex items-center justify-center relative">
              <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white" />
              <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white" />
              <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white" />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white" />

              <div className="h-0.5 w-full bg-[#EA580C] animate-pulse" />
            </div>

            <div className="text-[11px] text-stone-300 mt-3 font-mono flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Align 1D Barcode (EAN-13/GS1) or 2D DataMatrix</span>
            </div>
          </div>

          {/* Manual Input / Code Paste */}
          <div className="space-y-2">
            <label className="block font-semibold text-[#1C1917]">
              Enter Code or Paste GS1 Barcode String:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. CTX-2026-HERO, MERO-2026-STALE, or 8901148250012"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="flex-1 bg-white border border-[#E7E5E4] rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleResolveCode(inputCode)}
                className="px-4 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                Scan Code
              </button>
            </div>
          </div>

          {/* Quick Demo Barcode Chips */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-[#78716C]">
              Quick Demo Barcodes:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presetHeroBarcodes.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setInputCode(item.code);
                    handleResolveCode(item.code);
                  }}
                  className="px-2.5 py-1 rounded bg-[#FAFAF9] hover:bg-[#FFF7ED] border border-[#E7E5E4] hover:border-[#C2410C] text-[11px] font-mono text-[#1C1917] hover:text-[#C2410C] transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-[#B91C1C]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Successfully Decoded Batch Details */}
          {scannedBatch && scannedMedicine && (
            <div className="p-4 bg-[#FAFAF9] border border-[#C2410C]/30 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#C2410C] tracking-wide">
                    Barcode Decoded Successfully
                  </div>
                  <h4 className="font-bold text-sm text-[#1C1917]">
                    {scannedMedicine.brandName || scannedMedicine.genericName}
                  </h4>
                  <div className="text-[11px] text-[#78716C]">{scannedMedicine.genericName}</div>
                </div>

                {/* Render Authentic SVG Barcode Graphic */}
                <MedicineBarcodeSVG code={scannedBatch.batchCode} width={150} height={40} />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E7E5E4] text-[11px]">
                <div>
                  <span className="text-[#78716C]">Batch Code: </span>
                  <strong className="font-mono text-[#1C1917]">{scannedBatch.batchCode}</strong>
                </div>
                <div>
                  <span className="text-[#78716C]">Shelf Expiry: </span>
                  <strong className="font-mono text-[#C2410C]">{scannedBatch.expiresOn}</strong>
                </div>
                <div>
                  <span className="text-[#78716C]">Storage: </span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-[#E7E5E4] text-[10px]">
                    {scannedMedicine.storageRequirement}
                  </span>
                </div>
                <div>
                  <span className="text-[#78716C]">SKU: </span>
                  <span className="font-mono">{scannedMedicine.sku}</span>
                </div>
              </div>

              {onSelectBatch && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectBatch(scannedBatch.id);
                    onClose();
                  }}
                  className="w-full py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <span>Select & Record Ward Movement</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
