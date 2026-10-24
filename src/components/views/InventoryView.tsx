import React, { useState, useMemo } from 'react';
import {
  Package,
  Layers,
  ArrowRightLeft,
  QrCode,
  Plus,
  Search,
  CheckCircle2,
  X,
  Camera,
  UploadCloud,
} from 'lucide-react';
import { useMediGuard } from '../../context/MediGuardContext';
import { StatusBadge, StatusBadgeVariant } from '../common/StatusBadge';
import { calculateExpiry } from '../../engines/expiry';
import { formatPaiseINR } from '../../engines/reorder';
import { MovementType } from '../../schemas';
import { BatchCsvUploadModal } from '../inventory/BatchCsvUploadModal';
import { BarcodeModal, MedicineBarcodeSVG } from '../inventory/BarcodeModal';

export const InventoryView: React.FC = () => {
  const {
    locations,
    medicines,
    batches,
    balances,
    movements,
    physicalCounts,
    rules,
    currentUser,
    selectedLocationId,
    postMovement,
    submitPhysicalCount,
    decidePhysicalCount,
  } = useMediGuard();

  const [activeTab, setActiveTab] = useState<'stock' | 'counts' | 'movements'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedMedicineId, setExpandedMedicineId] = useState<string | null>(null);

  // Movement Modal State
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>('ISSUE');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [fromLocId, setFromLocId] = useState<string>('LOC-CENTRAL');
  const [toLocId, setToLocId] = useState<string>('LOC-ICU');
  const [movementQty, setMovementQty] = useState<number>(10);
  const [movementReason, setMovementReason] = useState<string>('Standard ward requisition');
  const [movementSuccess, setMovementSuccess] = useState<string | null>(null);

  // CSV Import Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');

  // Count Modal State
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [countBatchId, setCountBatchId] = useState<string>('');
  const [countLocId, setCountLocId] = useState<string>('LOC-CENTRAL');
  const [physicalQuantity, setPhysicalQuantity] = useState<number>(0);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      const name = med.brandName || med.genericName;
      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || med.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [medicines, searchTerm, selectedCategory]);

  // Map batches with balances and expiry
  const getMedicineBatches = (medId: string) => {
    return batches
      .filter((b) => b.medicineId === medId)
      .map((b) => {
        const expiry = calculateExpiry(b.expiresOn, rules.demoFixedDate, rules);
        const batchBalances = balances.filter(
          (bal) => bal.batchId === b.id && (selectedLocationId === 'ALL' || bal.locationId === selectedLocationId)
        );
        const totalOnHand = batchBalances.reduce((acc, curr) => acc + curr.quantity, 0);
        return {
          ...b,
          expiry,
          totalOnHand,
          locationBalances: batchBalances,
        };
      });
  };

  const mapExpiryBandToVariant = (band: string): StatusBadgeVariant => {
    switch (band) {
      case 'EXPIRED':
        return 'EXPIRED';
      case 'LE_7D':
      case 'LE_15D':
        return 'EXPIRED';
      case 'LE_30D':
        return 'WARNING_30D';
      default:
        return 'NEUTRAL';
    }
  };

  // Handle Record Movement Submit
  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || movementQty <= 0) return;

    try {
      const sourceLocation = movementType === 'RECEIPT' ? null : fromLocId;
      const targetLocation =
        movementType === 'ISSUE' || movementType === 'DISPOSAL' || movementType === 'RETURN'
          ? null
          : toLocId;

      const idempotencyKey = `MOV-KEY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      postMovement({
        idempotencyKey,
        batchId: selectedBatchId,
        type: movementType,
        fromLocationId: sourceLocation,
        toLocationId: targetLocation,
        quantity: movementQty,
        reason: movementReason,
      });

      setMovementSuccess(`Successfully recorded ${movementType} for ${movementQty} units.`);
      setTimeout(() => {
        setMovementSuccess(null);
        setIsMovementModalOpen(false);
      }, 1400);
    } catch (err: any) {
      alert(`Movement failed: ${err.message}`);
    }
  };

  // Handle Physical Count Submit
  const handleSubmitCount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countBatchId) return;

    submitPhysicalCount(countBatchId, countLocId, physicalQuantity);
    setIsCountModalOpen(false);
  };

  // Preview before -> after balance
  const previewBalance = useMemo(() => {
    if (!selectedBatchId) return null;
    const targetLoc = movementType === 'RECEIPT' ? toLocId : fromLocId;
    const currentBal = balances.find((b) => b.batchId === selectedBatchId && b.locationId === targetLoc);
    const before = currentBal ? currentBal.quantity : 0;
    let after = before;
    if (movementType === 'RECEIPT') after += movementQty;
    else after -= movementQty;
    return { before, after, locationName: locations.find((l) => l.id === targetLoc)?.name || targetLoc };
  }, [selectedBatchId, movementType, fromLocId, toLocId, movementQty, balances, locations]);

  return (
    <div className="space-y-6">
      {/* View Header with Exactly One Primary Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E4]">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">Inventory Management</h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            Verified medicine ledger with FEFO tracking, physical reconciliation, and atomic movements.
          </p>
        </div>

        {/* Action Buttons: Exactly ONE primary filled orange button per DESIGN.md */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#1C1917] bg-white border border-[#E7E5E4] hover:border-[#C2410C] rounded-lg transition-colors shadow-2xs"
          >
            <UploadCloud className="w-4 h-4 text-[#C2410C]" />
            <span>Upload Batches (CSV)</span>
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#C2410C] bg-white border border-[#C2410C] rounded-lg hover:bg-[#FFF7ED] transition-colors shadow-2xs"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Barcode / 2D</span>
          </button>

          <button
            onClick={() => {
              setSelectedBatchId(batches[0]?.id || '');
              setIsMovementModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record Movement</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E7E5E4]">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'stock'
              ? 'border-[#C2410C] text-[#C2410C]'
              : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stock Balances</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-[#FAFAF9] text-[#78716C] border border-[#E7E5E4]">
            {filteredMedicines.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('counts')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'counts'
              ? 'border-[#C2410C] text-[#C2410C]'
              : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Physical Reconciliation</span>
          {physicalCounts.filter((c) => c.status === 'PENDING_REVIEW').length > 0 && (
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-[#FEF9C3] text-[#A16207] font-semibold border border-[#FEF08A]">
              {physicalCounts.filter((c) => c.status === 'PENDING_REVIEW').length} Discrepancy
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'border-[#C2410C] text-[#C2410C]'
              : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Movement Ledger</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-[#FAFAF9] text-[#78716C] border border-[#E7E5E4]">
            {movements.length}
          </span>
        </button>
      </div>

      {/* TAB 1: STOCK BALANCES */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-[#E7E5E4] p-3.5 card-hover-lift">
              <div className="text-xs text-[#78716C] flex items-center justify-between">
                <span>Formulations</span>
                <Package className="w-4 h-4 text-[#C2410C]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#1C1917] mt-1">{medicines.length}</div>
              <div className="text-[10px] text-[#78716C] mt-0.5">Active catalog SKUs</div>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5E4] p-3.5 card-hover-lift">
              <div className="text-xs text-[#78716C] flex items-center justify-between">
                <span>Total Batches</span>
                <Layers className="w-4 h-4 text-[#C2410C]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#1C1917] mt-1">{batches.length}</div>
              <div className="text-[10px] text-[#78716C] mt-0.5">FEFO tracked batches</div>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5E4] p-3.5 card-hover-lift">
              <div className="text-xs text-[#78716C] flex items-center justify-between">
                <span>Cold-Chain (2-8°C)</span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <div className="text-xl font-bold font-mono text-blue-700 mt-1">
                {medicines.filter((m) => m.storageRequirement === 'COLD_CHAIN').length}
              </div>
              <div className="text-[10px] text-blue-600 mt-0.5">Temp-monitored drugs</div>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5E4] p-3.5 card-hover-lift">
              <div className="text-xs text-[#78716C] flex items-center justify-between">
                <span>At-Risk (≤60d)</span>
                <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse" />
              </div>
              <div className="text-xl font-bold font-mono text-[#C2410C] mt-1">
                {
                  batches.filter((b) => {
                    const exp = calculateExpiry(b.expiresOn, rules.demoFixedDate, rules);
                    return exp.daysToExpiry <= 60;
                  }).length
                }
              </div>
              <div className="text-[10px] text-[#C2410C] mt-0.5">Priority burn window</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E7E5E4]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search medicine, generic, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#78716C] whitespace-nowrap">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg px-2.5 py-1.5 text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#C2410C]"
              >
                <option value="ALL">All Categories</option>
                <option value="Antibiotic">Antibiotics</option>
                <option value="Analgesic">Analgesics</option>
                <option value="Antidiabetic">Antidiabetic</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Respiratory">Respiratory</option>
              </select>
            </div>
          </div>

          {/* Medicines & Batches Table */}
          <div className="bg-white border border-[#E7E5E4] rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFAF9] border-b border-[#E7E5E4] text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
                    <th className="py-3 px-4">Medicine & Form</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Storage</th>
                    <th className="py-3 px-3 text-right">Active Batches</th>
                    <th className="py-3 px-3 text-right">On-Hand Stock</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E5E4] text-sm">
                  {filteredMedicines.map((med) => {
                    const medBatches = getMedicineBatches(med.id);
                    const totalMedStock = medBatches.reduce((acc, curr) => acc + curr.totalOnHand, 0);
                    const isExpanded = expandedMedicineId === med.id;
                    const displayName = med.brandName || med.genericName;

                    return (
                      <React.Fragment key={med.id}>
                        <tr
                          onClick={() => setExpandedMedicineId(isExpanded ? null : med.id)}
                          className={`hover:bg-[#FAFAF9] cursor-pointer transition-colors ${
                            isExpanded ? 'bg-[#FFF7ED]' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={med.image}
                                alt={displayName}
                                className="w-10 h-10 rounded-lg object-cover border border-[#E7E5E4]"
                              />
                              <div>
                                <div className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                                  <span>{displayName}</span>
                                  {med.storageRequirement === 'COLD_CHAIN' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                      Cold Chain
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[#78716C]">
                                  {med.genericName} &bull; {med.unit} &bull; SKU: {med.sku}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAFAF9] border border-[#E7E5E4] text-[#78716C]">
                              {med.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-xs text-[#78716C]">
                            {med.storageRequirement}
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono text-xs text-[#1C1917]">
                            {medBatches.length} batches
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <span
                              className={`font-semibold font-mono tabular-nums ${
                                totalMedStock <= 30 ? 'text-[#B91C1C]' : 'text-[#1C1917]'
                              }`}
                            >
                              {totalMedStock} {med.unit}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono text-xs text-[#1C1917]">
                            {formatPaiseINR(med.unitCostPaise)}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              className="text-xs text-[#C2410C] hover:text-[#9A3412] font-medium"
                            >
                              {isExpanded ? 'Hide Batches' : 'View Batches'}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Batches Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-0 bg-[#FAFAF9]">
                              <div className="p-4 pl-14 border-y border-[#E7E5E4] space-y-3">
                                <div className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                                  Batch Breakdown (FEFO Order — Earliest Expiry First)
                                </div>

                                <div className="bg-white rounded-lg border border-[#E7E5E4] overflow-hidden">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-[#F5F5F4] border-b border-[#E7E5E4] text-[10px] text-[#78716C] uppercase">
                                        <th className="py-2 px-3">Batch Code</th>
                                        <th className="py-2 px-3">Barcode (GS1)</th>
                                        <th className="py-2 px-3">Expiry Date</th>
                                        <th className="py-2 px-3">Expiry Band</th>
                                        <th className="py-2 px-3">Days Left</th>
                                        <th className="py-2 px-3">Location Balances</th>
                                        <th className="py-2 px-3 text-right">Total Qty</th>
                                        <th className="py-2 px-3 text-right">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E7E5E4]">
                                      {medBatches.map((b) => (
                                        <tr key={b.id} className="hover:bg-[#FFF7ED]/50 transition-colors">
                                          <td className="py-2.5 px-3 font-mono font-medium text-[#1C1917]">
                                            {b.batchCode}
                                          </td>
                                          <td className="py-2 px-3">
                                            <MedicineBarcodeSVG code={b.batchCode} width={110} height={34} />
                                          </td>
                                          <td className="py-2.5 px-3 text-[#1C1917]">{b.expiresOn}</td>
                                          <td className="py-2.5 px-3">
                                            <StatusBadge
                                              variant={mapExpiryBandToVariant(b.expiry.band)}
                                              text={b.expiry.label}
                                            />
                                          </td>
                                          <td className="py-2.5 px-3 font-mono tabular-nums">
                                            <span
                                              className={
                                                b.expiry.daysToExpiry <= 15
                                                  ? 'text-[#B91C1C] font-semibold'
                                                  : b.expiry.daysToExpiry <= 30
                                                  ? 'text-[#A16207]'
                                                  : 'text-[#1C1917]'
                                              }
                                            >
                                              {b.expiry.daysToExpiry} days
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3">
                                            <div className="flex flex-wrap gap-1.5">
                                              {b.locationBalances.map((lb) => {
                                                const loc = locations.find((l) => l.id === lb.locationId);
                                                return (
                                                  <span
                                                    key={`${lb.batchId}_${lb.locationId}`}
                                                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[#FAFAF9] border border-[#E7E5E4] text-[#1C1917]"
                                                  >
                                                    <span className="text-[#78716C]">{loc?.name.split(' ')[0]}:</span>
                                                    <strong className="font-mono">{lb.quantity}</strong>
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-[#1C1917]">
                                            {b.totalOnHand}
                                          </td>
                                          <td className="py-2.5 px-3 text-right">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedBatchId(b.id);
                                                setIsMovementModalOpen(true);
                                              }}
                                              className="text-xs text-[#C2410C] hover:underline font-medium"
                                            >
                                              Move / Issue
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHYSICAL RECONCILIATION */}
      {activeTab === 'counts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-[#E7E5E4]">
            <div>
              <h2 className="text-base font-semibold text-[#1C1917]">Physical Count Reconciliation</h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                Staff records physical shelf counts. Variances require manager review; approval triggers an ADJUSTMENT
                ledger entry (balances never overwritten directly).
              </p>
            </div>
            <button
              onClick={() => {
                setCountBatchId(batches[0]?.id || '');
                setIsCountModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Count</span>
            </button>
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E7E5E4] text-[11px] font-semibold text-[#78716C] uppercase">
                  <th className="py-3 px-4">Count ID</th>
                  <th className="py-3 px-3">Batch & Medicine</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3 text-right">System Qty</th>
                  <th className="py-3 px-3 text-right">Counted Qty</th>
                  <th className="py-3 px-3 text-right">Discrepancy</th>
                  <th className="py-3 px-3">Submitted By</th>
                  <th className="py-3 px-4 text-center">Status / Manager Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {physicalCounts.map((count) => {
                  const b = batches.find((x) => x.id === count.batchId);
                  const med = medicines.find((m) => m.id === b?.medicineId);
                  const loc = locations.find((l) => l.id === count.locationId);

                  return (
                    <tr key={count.id} className="hover:bg-[#FAFAF9] transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-[#78716C]">{count.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#1C1917]">{med?.brandName || med?.genericName}</div>
                        <div className="text-xs text-[#78716C] font-mono">Batch: {b?.batchCode}</div>
                      </td>
                      <td className="py-3 px-3 text-xs text-[#1C1917]">{loc?.name || count.locationId}</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#78716C]">
                        {count.systemQuantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-[#1C1917]">
                        {count.countedQuantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                        <span className={count.discrepancy < 0 ? 'text-[#B91C1C]' : 'text-[#15803D]'}>
                          {count.discrepancy > 0 ? `+${count.discrepancy}` : count.discrepancy}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-[#78716C]">
                        <div>{count.submittedBy}</div>
                        <div className="text-[10px] text-[#A8A29E]">{count.submittedAt}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {count.status === 'PENDING_REVIEW' ? (
                          currentUser.role === 'STAFF' ? (
                            <span className="text-xs text-[#A16207] bg-[#FEF9C3] px-2.5 py-1 rounded-full font-medium">
                              Pending Approval
                            </span>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => decidePhysicalCount(count.id, 'APPROVE')}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-[#15803D] hover:bg-[#166534] rounded transition-colors"
                              >
                                Approve Adjustment
                              </button>
                              <button
                                onClick={() => decidePhysicalCount(count.id, 'REJECT')}
                                className="px-2.5 py-1 text-xs font-medium text-[#78716C] hover:text-[#B91C1C] border border-[#E7E5E4] rounded transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )
                        ) : (
                          <StatusBadge
                            variant={count.status === 'APPROVED_RECONCILED' ? 'EXECUTED' : 'EXPIRED'}
                            text={count.status}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MOVEMENT LEDGER */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-[#E7E5E4] flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#1C1917]">Immutable Movement Ledger</h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                Every transaction posted through verified atomic RPC with idempotency keys and audit trail.
              </p>
            </div>
            <span className="text-xs text-[#78716C] font-mono">Append-Only Postgres Ledger</span>
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E7E5E4] text-[10px] font-semibold text-[#78716C] uppercase">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-3">Movement ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Medicine & Batch</th>
                  <th className="py-2.5 px-3">From Location</th>
                  <th className="py-2.5 px-3">To Location</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {movements.slice(0, 50).map((mov) => {
                  const b = batches.find((x) => x.id === mov.batchId);
                  const med = medicines.find((m) => m.id === b?.medicineId);
                  const fromLoc = locations.find((l) => l.id === mov.fromLocationId);
                  const toLoc = locations.find((l) => l.id === mov.toLocationId);

                  return (
                    <tr key={mov.id} className="hover:bg-[#FAFAF9] transition-colors">
                      <td className="py-2.5 px-4 text-[#78716C] font-mono">{mov.occurredAt.replace('T', ' ').slice(0, 16)}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[#1C1917]">{mov.id}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#FAFAF9] border border-[#E7E5E4] font-semibold text-[10px]">
                          {mov.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#1C1917]">{med?.brandName || med?.genericName}</span>{' '}
                        <span className="text-[#78716C] font-mono">({b?.batchCode})</span>
                      </td>
                      <td className="py-2.5 px-3 text-[#78716C]">{fromLoc?.name || mov.fromLocationId || '—'}</td>
                      <td className="py-2.5 px-3 text-[#1C1917] font-medium">{toLoc?.name || mov.toLocationId || '—'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-[#1C1917]">
                        {mov.quantity}
                      </td>
                      <td className="py-2.5 px-4 text-[#78716C] truncate max-w-xs">{mov.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD MOVEMENT MODAL */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#E7E5E4] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#E7E5E4] bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#C2410C]" />
                <h3 className="font-bold text-[#1C1917]">Record Verified Movement</h3>
              </div>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="text-[#78716C] hover:text-[#1C1917] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {movementSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#15803D] mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-[#1C1917]">Transaction Committed</h4>
                <p className="text-sm text-[#78716C]">{movementSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleRecordMovement} className="p-5 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">Movement Type</label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as MovementType)}
                    className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                  >
                    <option value="ISSUE">ISSUE (Consumption to patient/ward)</option>
                    <option value="RECEIPT">RECEIPT (Intake from supplier/PO)</option>
                    <option value="TRANSFER">TRANSFER (Redistribution between locations)</option>
                    <option value="RETURN">RETURN (Return to supplier)</option>
                    <option value="DISPOSAL">DISPOSAL (Biohazard disposal of expired)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">Select Batch</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                    required
                  >
                    {batches.map((b) => {
                      const med = medicines.find((m) => m.id === b.medicineId);
                      return (
                        <option key={b.id} value={b.id}>
                          {med?.brandName || med?.genericName} — Batch {b.batchCode} (Exp: {b.expiresOn})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {movementType !== 'RECEIPT' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">Source Location</label>
                      <select
                        value={fromLocId}
                        onChange={(e) => setFromLocId(e.target.value)}
                        className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2 text-sm"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {movementType !== 'ISSUE' && movementType !== 'DISPOSAL' && movementType !== 'RETURN' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">Destination Location</label>
                      <select
                        value={toLocId}
                        onChange={(e) => setToLocId(e.target.value)}
                        className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2 text-sm"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    min="1"
                    value={movementQty}
                    onChange={(e) => setMovementQty(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2 text-sm font-mono focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">Reason</label>
                  <input
                    type="text"
                    value={movementReason}
                    onChange={(e) => setMovementReason(e.target.value)}
                    className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                    required
                  />
                </div>

                {previewBalance && (
                  <div className="bg-[#FFF7ED] p-3 rounded-lg border border-[#FFEDD5] text-xs space-y-1">
                    <div className="font-semibold text-[#C2410C]">Balance Verification Preview:</div>
                    <div className="flex items-center justify-between text-[#1C1917]">
                      <span>{previewBalance.locationName}:</span>
                      <span className="font-mono font-bold">
                        {previewBalance.before} units &rarr; {previewBalance.after} units
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E5E4]">
                  <button
                    type="button"
                    onClick={() => setIsMovementModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-[#78716C]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-medium text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg transition-colors shadow-sm"
                  >
                    Confirm & Post Movement
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* BARCODE & GS1 SCANNER MODAL */}
      <BarcodeModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectBatch={(batchId) => {
          setSelectedBatchId(batchId);
          setIsMovementModalOpen(true);
        }}
      />

      {/* BATCH CSV UPLOAD MODAL */}
      <BatchCsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
      />

      {/* PHYSICAL COUNT SUBMISSION MODAL */}
      {isCountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#E7E5E4] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#E7E5E4] bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#C2410C]" />
                <h3 className="font-bold text-[#1C1917]">Submit Physical Stock Count</h3>
              </div>
              <button onClick={() => setIsCountModalOpen(false)} className="text-[#78716C] hover:text-[#1C1917] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCount} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Select Batch</label>
                <select
                  value={countBatchId}
                  onChange={(e) => setCountBatchId(e.target.value)}
                  className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2 text-xs"
                >
                  {batches.map((b) => {
                    const med = medicines.find((m) => m.id === b.medicineId);
                    return (
                      <option key={b.id} value={b.id}>
                        {med?.brandName || med?.genericName} ({b.batchCode})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Ward Location</label>
                <select
                  value={countLocId}
                  onChange={(e) => setCountLocId(e.target.value)}
                  className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2 text-xs"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Physical Units Counted On Shelf</label>
                <input
                  type="number"
                  min="0"
                  value={physicalQuantity}
                  onChange={(e) => setPhysicalQuantity(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2 text-sm font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => setIsCountModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#78716C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg shadow-sm"
                >
                  Submit Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
