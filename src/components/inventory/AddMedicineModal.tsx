import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Pill,
  Calendar,
  Layers,
  Thermometer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Barcode,
  Share2,
  Tag,
  Store,
} from 'lucide-react';
import { useMediGuard } from '../../context/MediGuardContext';
import { MedicineBarcodeSVG } from './BarcodeModal';
import { calculateExpiry } from '../../engines/expiry';
import { formatPaiseINR } from '../../engines/reorder';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (batchId?: string) => void;
  initialStoreLocationId?: string;
}

const SAMPLE_PRESETS = [
  {
    brandName: 'Dolo 650',
    genericName: 'Paracetamol 650mg',
    category: 'Analgesic',
    batchCode: 'DOLO-2026-X4',
    expiresOn: '2026-11-20',
    quantity: 60,
    unit: 'strip',
    costINR: 32,
    storageRequirement: 'AMBIENT' as const,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
  },
  {
    brandName: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin + Clavulanic Acid 625mg',
    category: 'Antibiotic',
    batchCode: 'AUG-2026-R8',
    expiresOn: '2026-12-05',
    quantity: 40,
    unit: 'strip',
    costINR: 195,
    storageRequirement: 'AMBIENT' as const,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&auto=format&fit=crop&q=80',
  },
  {
    brandName: 'Pan 40 Gastro',
    genericName: 'Pantoprazole 40mg Gastro-Resistant',
    category: 'Gastroenterology',
    batchCode: 'PAN-2027-A1',
    expiresOn: '2027-04-15',
    quantity: 80,
    unit: 'strip',
    costINR: 145,
    storageRequirement: 'AMBIENT' as const,
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop&q=80',
  },
  {
    brandName: 'Ceftriaxone 1g Vial',
    genericName: 'Ceftriaxone Sodium Sterile 1000mg',
    category: 'Antibiotic',
    batchCode: 'CTX-COLD-99',
    expiresOn: '2026-11-12',
    quantity: 35,
    unit: 'vial',
    costINR: 85,
    storageRequirement: 'COLD_CHAIN' as const,
    image: 'https://images.unsplash.com/photo-1579165466791-788226ab77b6?w=300&auto=format&fit=crop&q=80',
  },
];

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStoreLocationId,
}) => {
  const { addNewMedicineWithBatch, postSharedListing, rules, currentUser, locations } = useMediGuard();

  const [brandName, setBrandName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState('Antibiotic');
  const [batchCode, setBatchCode] = useState('');
  const [expiresOn, setExpiresOn] = useState('2026-12-15');
  const [quantity, setQuantity] = useState<number>(30);
  const [unit, setUnit] = useState('strip');
  const [costINR, setCostINR] = useState<number>(120);
  const [storageRequirement, setStorageRequirement] = useState<'AMBIENT' | 'COLD_CHAIN'>('AMBIENT');
  const [alsoShareInExchange, setAlsoShareInExchange] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number>(25);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Computed expiry & preview
  const expiryPreview = useMemo(() => {
    if (!expiresOn || isNaN(Date.parse(expiresOn))) return null;
    return calculateExpiry(expiresOn, rules.demoFixedDate, rules);
  }, [expiresOn, rules]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setBrandName(preset.brandName);
    setGenericName(preset.genericName);
    setCategory(preset.category);
    setBatchCode(preset.batchCode);
    setExpiresOn(preset.expiresOn);
    setQuantity(preset.quantity);
    setUnit(preset.unit);
    setCostINR(preset.costINR);
    setStorageRequirement(preset.storageRequirement);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!brandName.trim() && !genericName.trim()) {
      setErrorMsg('Please specify either the Medicine Brand Name or Generic Formula.');
      return;
    }
    if (!batchCode.trim()) {
      setErrorMsg('Batch code / lot number is required for FEFO tracking.');
      return;
    }
    if (!expiresOn || isNaN(Date.parse(expiresOn))) {
      setErrorMsg('Please provide a valid Expiry Date.');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }

    const unitCostPaise = Math.round(costINR * 100);

    const result = addNewMedicineWithBatch({
      brandName: brandName.trim(),
      genericName: genericName.trim() || brandName.trim(),
      category,
      batchCode: batchCode.trim().toUpperCase(),
      expiresOn,
      quantity,
      unitCostPaise,
      storageRequirement,
      unit,
      locationId: initialStoreLocationId || currentUser.assignedLocationId || 'LOC-CENTRAL',
    });

    if (!result.success) {
      setErrorMsg(result.message);
      return;
    }

    // Optional peer chemist surplus listing
    if (alsoShareInExchange) {
      const unitsToShare = Math.max(1, Math.floor(quantity * 0.4));
      postSharedListing({
        medicineName: brandName ? `${brandName} (${genericName || brandName})` : genericName,
        medicineSku: `MED-${batchCode.toUpperCase().slice(0, 10)}`,
        batchCode: batchCode.trim().toUpperCase(),
        expiresOn,
        availableUnits: unitsToShare,
        unitPricePaise: unitCostPaise,
        discountPercent,
        notes: `Surplus stock from ${currentUser.facilityName || currentUser.name}. Available for neighboring medical stores.`,
      });
    }

    setSuccessMsg(result.message);
    setTimeout(() => {
      setSuccessMsg(null);
      if (onSuccess) onSuccess(result.batchId);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-[#1C1917]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E7E5E4] flex items-center justify-between bg-[#FAFAF9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] flex items-center justify-center text-[#C2410C] font-bold shrink-0">
              <Plus className="w-5 h-5 text-[#C2410C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-[#1C1917]">
                  Add Medicine to Store Inventory
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5] font-semibold">
                  FEFO Tracked
                </span>
              </div>
              <p className="text-xs text-[#78716C] mt-0.5">
                Register a new medicine batch with exact expiry date, GS1 barcode, and real-time shelf-life alerts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F5F4] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Quick Demo Presets */}
          <div className="bg-[#FFF7ED] border border-[#FFEDD5] p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#C2410C]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C2410C]" />
                <span>Quick-Fill Sample Medicines:</span>
              </span>
              <span className="text-[11px] font-normal text-[#C2410C]/80">Click any pill to populate form</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PRESETS.map((p) => (
                <button
                  key={p.brandName}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#FFEDD5] hover:border-[#C2410C] text-xs font-medium text-[#1C1917] hover:text-[#C2410C] transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Pill className="w-3 h-3 text-[#C2410C]" />
                  <span>{p.brandName}</span>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-xs text-[#B91C1C] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl text-xs text-[#15803D] flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form id="add-med-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Brand Name & Generic Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Brand / Trade Name <span className="text-[#C2410C]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Augmentin 625 Duo, Dolo 650"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Generic Salt / Composition
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amoxicillin + Potassium Clavulanate"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                />
              </div>
            </div>

            {/* Row 2: Category & Storage Requirement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Therapeutic Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2410C] cursor-pointer"
                >
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Analgesic">Analgesic & Antipyretic</option>
                  <option value="Antidiabetic">Antidiabetic</option>
                  <option value="Cardiology">Cardiology / Antihypertensive</option>
                  <option value="Gastroenterology">Gastroenterology (Antacid / PPI)</option>
                  <option value="Respiratory">Respiratory & Antiallergic</option>
                  <option value="Critical Care">Critical Care / Biologics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Storage Requirement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStorageRequirement('AMBIENT')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-left flex items-center gap-2 transition-all ${
                      storageRequirement === 'AMBIENT'
                        ? 'bg-[#FFF7ED] border-[#C2410C] text-[#C2410C] font-semibold'
                        : 'bg-white border-[#E7E5E4] text-[#78716C] hover:border-[#C2410C]'
                    }`}
                  >
                    <span>🌡️ Ambient (15–25°C)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStorageRequirement('COLD_CHAIN')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-left flex items-center gap-2 transition-all ${
                      storageRequirement === 'COLD_CHAIN'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                        : 'bg-white border-[#E7E5E4] text-[#78716C] hover:border-blue-400'
                    }`}
                  >
                    <span>🧊 Cold Chain (2–8°C)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 3: Batch Number & Expiry Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Batch Code / Lot Number <span className="text-[#C2410C]">*</span>
                </label>
                <div className="relative">
                  <Barcode className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. AUG-2026-B1"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono uppercase bg-white border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#1C1917]">
                    Expiry Date <span className="text-[#C2410C]">*</span>
                  </label>
                  {expiryPreview && (
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        expiryPreview.daysToExpiry <= 30
                          ? 'text-[#B91C1C]'
                          : expiryPreview.daysToExpiry <= 60
                          ? 'text-[#C2410C]'
                          : 'text-[#15803D]'
                      }`}
                    >
                      {expiryPreview.daysToExpiry} days left ({expiryPreview.label})
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={expiresOn}
                    onChange={(e) => setExpiresOn(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Quantity, Unit & Purchase Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Stock Quantity <span className="text-[#C2410C]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Packaging Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2410C] cursor-pointer"
                >
                  <option value="strip">Strip (10 Tablets)</option>
                  <option value="vial">Sterile Vial (Injection)</option>
                  <option value="bottle">Syrup / Suspension Bottle</option>
                  <option value="box">Box</option>
                  <option value="tablet">Single Unit / Tablet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Unit Cost Price (₹)
                </label>
                <div className="relative">
                  <span className="text-xs text-[#78716C] font-mono absolute left-3 top-2">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={costINR}
                    onChange={(e) => setCostINR(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono bg-white border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  />
                </div>
              </div>
            </div>

            {/* Live Barcode & FEFO Expiry Preview Card */}
            <div className="p-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Real-Time Barcode & Shelf-Life Card Preview:</span>
                </span>
                <span className="text-[11px] font-mono text-[#78716C]">
                  Total Batch Value: <strong>₹{(quantity * costINR).toLocaleString('en-IN')}</strong>
                </span>
              </div>

              <div className="bg-white border border-[#E7E5E4] p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-sm text-[#1C1917]">
                    {brandName || 'Medicine Name'}
                  </div>
                  <div className="text-[11px] text-[#78716C]">
                    {genericName || 'Active Generic Salt'} &bull; {category}
                  </div>
                  <div className="text-[11px] font-mono text-[#C2410C] flex items-center gap-2 pt-0.5">
                    <span>Batch: <strong>{batchCode || 'LOT-PREVIEW'}</strong></span>
                    <span>&bull;</span>
                    <span>Expiry: <strong>{expiresOn}</strong></span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center">
                  <MedicineBarcodeSVG code={batchCode || 'MED-SAMPLE'} width={130} height={36} />
                  <span className="text-[9px] font-mono text-[#78716C] mt-0.5">GS1 Barcode Compatible</span>
                </div>
              </div>
            </div>

            {/* Optional: Peer Chemist Exchange Listing Checkbox */}
            <div className="p-3.5 bg-white border border-[#E7E5E4] rounded-xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoShareInExchange}
                  onChange={(e) => setAlsoShareInExchange(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#C2410C] rounded border-[#E7E5E4] focus:ring-[#C2410C]"
                />
                <div className="text-xs">
                  <div className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-[#C2410C]" />
                    <span>Also list surplus units in Peer Chemist Exchange Network</span>
                  </div>
                  <p className="text-[#78716C] text-[11px] mt-0.5">
                    Make 40% of this batch immediately discoverable by neighboring chemists at a discounted rate before expiry.
                  </p>
                </div>
              </label>

              {alsoShareInExchange && (
                <div className="pl-6 pt-2 flex items-center gap-3 text-xs">
                  <span className="text-[#78716C]">Discount for peer chemists:</span>
                  <div className="inline-flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      min="5"
                      max="70"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 25)}
                      className="w-16 px-2 py-1 text-xs font-mono border border-[#E7E5E4] rounded"
                    />
                    <span>% Off MRP</span>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E7E5E4] bg-[#FAFAF9] flex items-center justify-between gap-3">
          <div className="text-xs text-[#78716C]">
            <span>Store: <strong>{currentUser.facilityName || currentUser.name}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] bg-white border border-[#E7E5E4] hover:border-[#C2410C] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-med-form"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Save & Track Medicine</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
