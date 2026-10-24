import React, { useState, useMemo } from 'react';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  Clock,
  TrendingUp,
  Building2,
  CheckCircle2,
  Plus,
  Search,
  Download,
  Filter,
  Layers,
  ArrowRight,
  Sparkles,
  Store,
  QrCode,
  ShieldAlert,
  ArrowRightLeft,
  Calendar,
  Share2,
} from 'lucide-react';
import { useMediGuard, ParsedCSVBatchRow } from '../../context/MediGuardContext';
import { NavScreen } from '../layout/Sidebar';
import { StatusBadge, StatusBadgeVariant } from '../common/StatusBadge';
import { calculateExpiry } from '../../engines/expiry';
import { formatPaiseINR } from '../../engines/reorder';
import { BatchCsvUploadModal } from '../inventory/BatchCsvUploadModal';
import { BarcodeModal } from '../inventory/BarcodeModal';

interface OverviewViewProps {
  onNavigate: (screen: NavScreen) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const {
    medicines,
    batches,
    balances,
    locations,
    rules,
    currentUser,
    kpiStats,
    addBatchesFromCSV,
  } = useMediGuard();

  const isLocalChemist = currentUser.facilityType === 'LOCAL_PHARMACY';

  // Modals state
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedBarcodeBatch, setSelectedBarcodeBatch] = useState<any>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [expiryFilter, setExpiryFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'SAFE'>('ALL');
  const [selectedLocFilter, setSelectedLocFilter] = useState<string>('ALL');
  const [csvQuickSuccess, setCsvQuickSuccess] = useState<string | null>(null);

  // Compute all batch records with medicine metadata, exact expiry, and days remaining
  const allMedicineBatches = useMemo(() => {
    return batches.map((b) => {
      const med = medicines.find((m) => m.id === b.medicineId) || {
        id: b.medicineId,
        genericName: 'Unknown Medicine',
        brandName: 'Generic Batch',
        sku: b.id,
        category: 'ANTIBIOTIC',
        unitCostPaise: b.unitCostPaise,
        mrpPaise: Math.round(b.unitCostPaise * 1.3),
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80',
      };

      const expiry = calculateExpiry(b.expiresOn, rules.demoFixedDate, rules);
      const batchBalances = balances.filter((bal) => bal.batchId === b.id);
      const totalUnits = batchBalances.reduce((acc, curr) => acc + curr.quantity, 0);
      const primaryLocId = batchBalances[0]?.locationId || 'LOC-CENTRAL';
      const loc = locations.find((l) => l.id === primaryLocId);

      // Determine recommended action
      let recommendedAction = 'Maintain Stock & FEFO';
      if (expiry.daysToExpiry <= 0) {
        recommendedAction = 'Discard & Segregate (Expired)';
      } else if (expiry.daysToExpiry <= 15) {
        recommendedAction = 'Use Immediately / Emergency Transfer';
      } else if (expiry.daysToExpiry <= 30) {
        recommendedAction = isLocalChemist
          ? 'Share with Peer Chemist (25% off)'
          : 'Transfer to High-Burn Ward (ICU)';
      } else if (expiry.daysToExpiry <= 60) {
        recommendedAction = 'Return to Supplier (Cipla Window)';
      }

      return {
        batch: b,
        medicine: med,
        expiry,
        totalUnits,
        primaryLocId,
        locationName: loc?.name || (isLocalChemist ? currentUser.facilityName || 'Local Chemist' : 'Central Store'),
        recommendedAction,
        totalValuePaise: totalUnits * b.unitCostPaise,
      };
    });
  }, [batches, medicines, balances, locations, rules, isLocalChemist, currentUser]);

  // Filtered batches for the table
  const filteredBatches = useMemo(() => {
    return allMedicineBatches.filter((item) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.medicine.genericName.toLowerCase().includes(q) ||
        (item.medicine.brandName && item.medicine.brandName.toLowerCase().includes(q)) ||
        item.batch.batchCode.toLowerCase().includes(q) ||
        item.medicine.sku.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Expiry filter
      if (expiryFilter === 'CRITICAL' && item.expiry.daysToExpiry > 30) return false;
      if (expiryFilter === 'WARNING' && (item.expiry.daysToExpiry <= 30 || item.expiry.daysToExpiry > 60)) return false;
      if (expiryFilter === 'SAFE' && item.expiry.daysToExpiry <= 60) return false;

      // Location filter
      if (selectedLocFilter !== 'ALL' && item.primaryLocId !== selectedLocFilter) return false;

      return true;
    });
  }, [allMedicineBatches, searchQuery, expiryFilter, selectedLocFilter]);

  // Quick Load Demo CSV function
  const handleQuickLoadDemoCsv = () => {
    const demoRows: ParsedCSVBatchRow[] = [
      {
        medicineSku: 'MED-CTX-1G',
        batchCode: `CTX-DEMO-${Math.floor(100 + Math.random() * 900)}`,
        expiresOn: '2026-11-28',
        quantity: 200,
        locationId: 'LOC-CENTRAL',
        unitCostPaise: 14500,
      },
      {
        medicineSku: 'MED-MERO-1G',
        batchCode: `MERO-EXP-${Math.floor(100 + Math.random() * 900)}`,
        expiresOn: '2026-12-15',
        quantity: 75,
        locationId: 'LOC-ICU',
        unitCostPaise: 85000,
      },
      {
        medicineSku: 'MED-PCM-650',
        batchCode: `DOLO-NEW-${Math.floor(100 + Math.random() * 900)}`,
        expiresOn: '2027-06-30',
        quantity: 450,
        locationId: 'LOC-CENTRAL',
        unitCostPaise: 3200,
      },
      {
        medicineSku: 'Augmentin 625 Duo',
        batchCode: `AUG-CSV-${Math.floor(100 + Math.random() * 900)}`,
        expiresOn: '2026-12-05',
        quantity: 120,
        locationId: 'LOC-EMERGENCY',
        unitCostPaise: 19800,
      },
      {
        medicineSku: 'Pan 40mg Injection',
        batchCode: `PAN-BATCH-${Math.floor(100 + Math.random() * 900)}`,
        expiresOn: '2026-11-20',
        quantity: 160,
        locationId: 'LOC-CENTRAL',
        unitCostPaise: 5400,
      },
    ];

    const result = addBatchesFromCSV(demoRows);
    setCsvQuickSuccess(`Successfully ingested ${result.successCount} new medicine batches via CSV.`);
    setTimeout(() => setCsvQuickSuccess(null), 5000);
  };

  const handleDownloadCsvTemplate = () => {
    const template = `medicineSku,batchCode,expiresOn,quantity,locationId,unitCostPaise
MED-CTX-1G,CTX-2027-A,2027-05-15,250,LOC-CENTRAL,14500
MED-MERO-1G,MERO-2026-B,2026-12-28,80,LOC-ICU,85000
MED-PCM-650,PCM-2027-C,2027-08-20,500,LOC-CENTRAL,3200
Augmentin 625,AUG-2026-D,2026-12-10,100,LOC-EMERGENCY,19800`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mediguard_medicines_expiry_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-[#1C1917]">
      {/* 1. Header Banner with Identity & Prominent CSV Addition */}
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#C2410C] flex items-center justify-center font-bold">
              {isLocalChemist ? <Store className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917]">
                  Central Medicines Management & Expiry Dashboard
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]">
                  {isLocalChemist ? 'Local Chemist Store' : 'Inpatient Formulary'}
                </span>
              </div>
              <p className="text-xs text-[#78716C] flex items-center gap-2 mt-0.5">
                <span>Operating as: <strong>{currentUser.name}</strong></span>
                <span>&bull;</span>
                <span>{currentUser.facilityName || 'Central Pharmacy'}</span>
                {currentUser.drugLicenseNo && (
                  <>
                    <span>&bull;</span>
                    <span className="font-mono text-[#C2410C]">DL: {currentUser.drugLicenseNo}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: CSV Addition */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Medicine CSV</span>
          </button>

          <button
            onClick={handleQuickLoadDemoCsv}
            title="Ingests 5 pre-configured demo batches with expiry dates"
            className="px-3.5 py-2.5 rounded-lg bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FFEDD5] text-[#C2410C] text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Demo CSV (5 Meds)</span>
          </button>

          <button
            onClick={handleDownloadCsvTemplate}
            title="Download CSV format template"
            className="p-2.5 text-[#78716C] hover:text-[#1C1917] bg-[#FAFAF9] border border-[#E7E5E4] hover:border-[#C2410C] rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {isLocalChemist && (
            <button
              onClick={() => onNavigate('network')}
              className="px-3.5 py-2.5 rounded-lg bg-[#FAFAF9] hover:bg-[#FFF7ED] border border-[#E7E5E4] hover:border-[#C2410C] text-[#1C1917] hover:text-[#C2410C] text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>Chemist Exchange</span>
            </button>
          )}
        </div>
      </div>

      {csvQuickSuccess && (
        <div className="p-3.5 bg-[#DCFCE7] border border-[#BBF7D0] text-[#15803D] rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{csvQuickSuccess}</span>
        </div>
      )}

      {/* 2. Key Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 shadow-2xs">
          <div className="text-2xl font-bold text-[#1C1917] tabular-nums">
            {medicines.length}
          </div>
          <div className="text-xs text-[#78716C] mt-1 font-medium">Catalog Medicines</div>
          <div className="text-[10px] text-[#78716C]">Verified Formulations</div>
        </div>

        <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 shadow-2xs">
          <div className="text-2xl font-bold text-[#1C1917] tabular-nums">
            {batches.length}
          </div>
          <div className="text-xs text-[#78716C] mt-1 font-medium">Active Batches</div>
          <div className="text-[10px] text-[#78716C]">On-Shelf Monitored</div>
        </div>

        <div className="bg-white border border-[#FEE2E2] rounded-xl p-4 shadow-2xs bg-gradient-to-b from-white to-[#FEF2F2]">
          <div className="text-2xl font-bold text-[#B91C1C] tabular-nums">
            {allMedicineBatches.filter((b) => b.expiry.daysToExpiry <= 30 && b.expiry.daysToExpiry > 0).length}
          </div>
          <div className="text-xs text-[#B91C1C] mt-1 font-bold">Critical (&le; 30 Days)</div>
          <div className="text-[10px] text-[#B91C1C]">FEFO Priority Burning</div>
        </div>

        <div className="bg-white border border-[#FEF08A] rounded-xl p-4 shadow-2xs bg-gradient-to-b from-white to-[#FEFCE8]">
          <div className="text-2xl font-bold text-[#A16207] tabular-nums">
            {allMedicineBatches.filter((b) => b.expiry.daysToExpiry > 30 && b.expiry.daysToExpiry <= 60).length}
          </div>
          <div className="text-xs text-[#A16207] mt-1 font-bold">Warning (31–60 Days)</div>
          <div className="text-[10px] text-[#A16207]">Supplier Return / Share</div>
        </div>

        <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 shadow-2xs">
          <div className="text-2xl font-bold text-[#B91C1C] tabular-nums">
            {formatPaiseINR(kpiStats.projectedAtRiskPaise)}
          </div>
          <div className="text-xs text-[#78716C] mt-1 font-medium">At-Risk Value (₹)</div>
          <div className="text-[10px] text-[#78716C]">Near-Expiry Capital</div>
        </div>

        <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 shadow-2xs">
          <div className="text-2xl font-bold text-[#15803D] tabular-nums">
            {allMedicineBatches.reduce((acc, curr) => acc + curr.totalUnits, 0)}
          </div>
          <div className="text-xs text-[#78716C] mt-1 font-medium">Total Units in Stock</div>
          <div className="text-[10px] text-[#15803D] font-medium">Reconciled Ledger</div>
        </div>
      </div>

      {/* 3. CSV Integration Banner & Quick Add Strip */}
      <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-[#FFEDD5] flex items-center justify-center text-[#C2410C] shrink-0 shadow-2xs">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-[#1C1917]">
              Need to add new medicines or stock incoming shipments?
            </div>
            <div className="text-xs text-[#78716C]">
              Upload your vendor invoice or dispensary CSV. All new medicines and expiry dates are ingested automatically.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Batch CSV</span>
          </button>
          <button
            onClick={handleQuickLoadDemoCsv}
            className="px-3 py-2 rounded-lg bg-white border border-[#FFEDD5] text-[#C2410C] hover:bg-[#FFF7ED] text-xs font-semibold transition-colors"
          >
            Load Sample CSV
          </button>
        </div>
      </div>

      {/* 4. Central Medicines & Expiry Date Management Table */}
      <div className="bg-white border border-[#E7E5E4] rounded-2xl shadow-2xs overflow-hidden space-y-4 p-5 sm:p-6">
        {/* Table Controls: Search & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E4]">
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by brand name, generic name, batch code, or SKU..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Expiry Urgency Filter */}
            <div className="flex items-center bg-[#FAFAF9] p-1 rounded-lg border border-[#E7E5E4] text-xs font-medium">
              <button
                onClick={() => setExpiryFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  expiryFilter === 'ALL'
                    ? 'bg-white text-[#C2410C] font-semibold shadow-2xs border border-[#E7E5E4]'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                All ({allMedicineBatches.length})
              </button>

              <button
                onClick={() => setExpiryFilter('CRITICAL')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  expiryFilter === 'CRITICAL'
                    ? 'bg-[#FEE2E2] text-[#B91C1C] font-semibold shadow-2xs'
                    : 'text-[#78716C] hover:text-[#B91C1C]'
                }`}
              >
                Critical &le;30d ({allMedicineBatches.filter((b) => b.expiry.daysToExpiry <= 30 && b.expiry.daysToExpiry > 0).length})
              </button>

              <button
                onClick={() => setExpiryFilter('WARNING')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  expiryFilter === 'WARNING'
                    ? 'bg-[#FEF9C3] text-[#A16207] font-semibold shadow-2xs'
                    : 'text-[#78716C] hover:text-[#A16207]'
                }`}
              >
                31–60d ({allMedicineBatches.filter((b) => b.expiry.daysToExpiry > 30 && b.expiry.daysToExpiry <= 60).length})
              </button>

              <button
                onClick={() => setExpiryFilter('SAFE')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  expiryFilter === 'SAFE'
                    ? 'bg-[#DCFCE7] text-[#15803D] font-semibold shadow-2xs'
                    : 'text-[#78716C] hover:text-[#15803D]'
                }`}
              >
                Safe &gt;60d ({allMedicineBatches.filter((b) => b.expiry.daysToExpiry > 60).length})
              </button>
            </div>

            {/* Location selector */}
            <select
              value={selectedLocFilter}
              onChange={(e) => setSelectedLocFilter(e.target.value)}
              className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg px-2.5 py-1.5 text-xs text-[#1C1917] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Storage Locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Medicines Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E7E5E4] text-[#78716C] font-semibold bg-[#FAFAF9]">
                <th className="py-3 px-3">Medicine & Brand</th>
                <th className="py-3 px-3">Batch Code</th>
                <th className="py-3 px-3">Exact Expiry Date</th>
                <th className="py-3 px-3">Days Remaining</th>
                <th className="py-3 px-3 text-right">Units on Hand</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3 text-right">Unit MRP</th>
                <th className="py-3 px-3 text-right">Batch Value</th>
                <th className="py-3 px-3">Decision Recommendation</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {filteredBatches.map((item) => {
                const days = item.expiry.daysToExpiry;
                const isCritical = days <= 30 && days > 0;
                const isWarning = days > 30 && days <= 60;
                const isExpired = days <= 0;

                return (
                  <tr
                    key={item.batch.id}
                    className={`hover:bg-[#FAFAF9] transition-colors ${
                      isCritical ? 'bg-[#FEF2F2]/40' : ''
                    }`}
                  >
                    {/* Medicine */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.medicine.image}
                          alt={item.medicine.genericName}
                          className="w-9 h-9 rounded-lg object-cover border border-[#E7E5E4] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[#1C1917] truncate max-w-[150px]">
                            {item.medicine.brandName || item.medicine.genericName}
                          </div>
                          <div className="text-[11px] text-[#78716C] truncate max-w-[150px]">
                            {item.medicine.genericName}
                          </div>
                          <div className="text-[10px] font-mono text-[#78716C]">{item.medicine.sku}</div>
                        </div>
                      </div>
                    </td>

                    {/* Batch Code */}
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#FAFAF9] border border-[#E7E5E4] text-[#1C1917]">
                        {item.batch.batchCode}
                      </span>
                    </td>

                    {/* Exact Expiry Date */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-medium text-[#1C1917]">
                        <Calendar className="w-3.5 h-3.5 text-[#78716C]" />
                        <span>{item.batch.expiresOn}</span>
                      </div>
                    </td>

                    {/* Days Remaining & Badge */}
                    <td className="py-3 px-3">
                      {isExpired ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          <span>EXPIRED</span>
                        </span>
                      ) : isCritical ? (
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{days} days left</span>
                          </span>
                          <div className="w-20 h-1.5 bg-[#FEE2E2] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#B91C1C]"
                              style={{ width: `${Math.min(100, (days / 30) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : isWarning ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF9C3] text-[#A16207] border border-[#FEF08A] flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          <span>{days} days left</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{days} days left</span>
                        </span>
                      )}
                    </td>

                    {/* Units on Hand */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold font-mono text-sm text-[#1C1917] tabular-nums">
                        {item.totalUnits}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3">
                      <span className="text-xs text-[#78716C] truncate max-w-[120px] block">
                        {item.locationName}
                      </span>
                    </td>

                    {/* Unit Cost/MRP */}
                    <td className="py-3 px-3 text-right font-mono text-xs text-[#78716C]">
                      {formatPaiseINR(item.batch.unitCostPaise)}
                    </td>

                    {/* Batch Total Value */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-xs text-[#1C1917]">
                      {formatPaiseINR(item.totalValuePaise)}
                    </td>

                    {/* Recommendation */}
                    <td className="py-3 px-3">
                      <span
                        className={`text-[11px] font-semibold px-2 py-1 rounded inline-block ${
                          isCritical
                            ? 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]'
                            : isWarning
                            ? 'bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]'
                            : 'bg-[#FAFAF9] text-[#78716C] border border-[#E7E5E4]'
                        }`}
                      >
                        {item.recommendedAction}
                      </span>
                    </td>

                    {/* Action Barcode Button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedBarcodeBatch(item.batch);
                          setIsBarcodeModalOpen(true);
                        }}
                        title="Print / View GS1 Barcode"
                        className="p-1.5 rounded-lg text-[#78716C] hover:text-[#C2410C] bg-[#FAFAF9] hover:bg-[#FFF7ED] border border-[#E7E5E4] hover:border-[#FFEDD5] transition-colors"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBatches.length === 0 && (
          <div className="py-12 text-center text-[#78716C] space-y-2">
            <Layers className="w-8 h-8 text-[#78716C]/40 mx-auto" />
            <div className="text-sm font-semibold text-[#1C1917]">No medicine batches matched your search</div>
            <div className="text-xs">Try adjusting your search terms or upload a new batch via CSV.</div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-[#E7E5E4] flex flex-col sm:flex-row items-center justify-between text-xs text-[#78716C] gap-2">
          <span>
            Showing <strong>{filteredBatches.length}</strong> of <strong>{allMedicineBatches.length}</strong> verified batches
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#15803D]" />
            <span>Deterministic ISO 8601 Expiry Clock Active ({rules.demoFixedDate})</span>
          </div>
        </div>
      </div>

      {/* 5. Modals for CSV Import & Barcode */}
      <BatchCsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
      />

      <BarcodeModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
      />
    </div>
  );
};
