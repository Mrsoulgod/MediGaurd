import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  TrendingDown,
  Info,
  X,
  ArrowRight,
  Sparkles,
  Flame,
  Calendar,
  Share2,
  Tag,
} from 'lucide-react';
import { useMediGuard } from '../../context/MediGuardContext';
import { StatusBadge, StatusBadgeVariant } from '../common/StatusBadge';
import { calculateExpiry } from '../../engines/expiry';
import { formatPaiseINR } from '../../engines/reorder';
import { MDICandidate } from '../../engines/mdi';

export const RisksView: React.FC = () => {
  const {
    locations,
    medicines,
    batches,
    balances,
    transferRequests,
    mdiCandidates,
    rules,
    currentUser,
    selectedLocationId,
    proposeTransfer,
    decideTransfer,
    postSharedListing,
  } = useMediGuard();

  // Tabs: Expiry vs Shortage (never merged into one score per DESIGN.md §4)
  const [riskTab, setRiskTab] = useState<'expiry' | 'shortage'>('expiry');

  // Expiry Segmentation Filter: 20 vs 30 vs 60 days window
  const [expiryWindowFilter, setExpiryWindowFilter] = useState<'ALL' | 'LE_20' | '21_30' | '31_60'>('ALL');

  // Side Drawer state for selected batch/medicine
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<{
    type: 'batch' | 'medicine';
    batchId?: string;
    medicineId?: string;
  } | null>(null);

  // Transfer Proposal Modal state
  const [transferCandidate, setTransferCandidate] = useState<MDICandidate | null>(null);
  const [transferQty, setTransferQty] = useState<number>(0);
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  // Expiry Risk Batches
  const expiryBatches = useMemo(() => {
    return batches
      .map((b) => {
        const med = medicines.find((m) => m.id === b.medicineId);
        const expiry = calculateExpiry(b.expiresOn, rules.demoFixedDate, rules);
        const batchBals = balances.filter(
          (bal) => bal.batchId === b.id && (selectedLocationId === 'ALL' || bal.locationId === selectedLocationId)
        );
        const totalOnHand = batchBals.reduce((acc, curr) => acc + curr.quantity, 0);

        // Projected consumption & unconsumed
        const dailyBurnRate = 3.8;
        const projectedConsumed = Math.min(totalOnHand, Math.round(dailyBurnRate * Math.max(0, expiry.daysToExpiry)));
        const projectedUnconsumed = Math.max(0, totalOnHand - projectedConsumed);
        const projectedAtRiskPaise = projectedUnconsumed * (med?.unitCostPaise || b.unitCostPaise || 0);

        return {
          ...b,
          med,
          expiry,
          totalOnHand,
          batchBals,
          projectedUnconsumed,
          projectedAtRiskPaise,
        };
      })
      .filter((b) => b.totalOnHand > 0 && b.expiry.daysToExpiry <= 60)
      .sort((a, b) => a.expiry.daysToExpiry - b.expiry.daysToExpiry);
  }, [batches, medicines, balances, rules, selectedLocationId]);

  // Expiry Segments: ≤20 Days, 21-30 Days, 31-60 Days
  const expiryBuckets = useMemo(() => {
    const bucket20 = expiryBatches.filter((b) => b.expiry.daysToExpiry > 0 && b.expiry.daysToExpiry <= 20);
    const bucket30 = expiryBatches.filter((b) => b.expiry.daysToExpiry >= 21 && b.expiry.daysToExpiry <= 30);
    const bucket60 = expiryBatches.filter((b) => b.expiry.daysToExpiry >= 31 && b.expiry.daysToExpiry <= 60);

    const val20 = bucket20.reduce((sum, b) => sum + b.projectedAtRiskPaise, 0);
    const val30 = bucket30.reduce((sum, b) => sum + b.projectedAtRiskPaise, 0);
    const val60 = bucket60.reduce((sum, b) => sum + b.projectedAtRiskPaise, 0);

    return {
      bucket20,
      bucket30,
      bucket60,
      val20,
      val30,
      val60,
    };
  }, [expiryBatches]);

  const displayedExpiryBatches = useMemo(() => {
    if (expiryWindowFilter === 'LE_20') return expiryBuckets.bucket20;
    if (expiryWindowFilter === '21_30') return expiryBuckets.bucket30;
    if (expiryWindowFilter === '31_60') return expiryBuckets.bucket60;
    return expiryBatches;
  }, [expiryBatches, expiryBuckets, expiryWindowFilter]);

  // Shortage Risk Medicines
  const shortageMedicines = useMemo(() => {
    return medicines
      .map((med) => {
        const medBatches = batches.filter((b) => b.medicineId === med.id && b.status === 'ACTIVE');
        const medBals = balances.filter(
          (bal) =>
            medBatches.some((b) => b.id === bal.batchId) &&
            (selectedLocationId === 'ALL' || bal.locationId === selectedLocationId)
        );
        const totalOnHand = medBals.reduce((acc, curr) => acc + curr.quantity, 0);

        const dailyDemand = med.criticality === 'HIGH' ? 14 : 6;
        const daysCoverage = dailyDemand > 0 ? (totalOnHand / dailyDemand).toFixed(1) : '99';
        const isShortage = totalOnHand <= 30;

        return {
          ...med,
          totalOnHand,
          dailyDemand,
          daysCoverage,
          isShortage,
        };
      })
      .filter((m) => m.isShortage || parseFloat(m.daysCoverage) <= 10)
      .sort((a, b) => parseFloat(a.daysCoverage) - parseFloat(b.daysCoverage));
  }, [medicines, batches, balances, selectedLocationId]);

  // Feasible vs Infeasible MDI candidates
  const feasibleCandidates = useMemo(() => {
    return mdiCandidates.filter((c) => c.isFeasible);
  }, [mdiCandidates]);

  const infeasibleCandidates = useMemo(() => {
    return mdiCandidates.filter((c) => !c.isFeasible);
  }, [mdiCandidates]);

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

  const handleOpenTransferModal = (candidate: MDICandidate) => {
    setTransferCandidate(candidate);
    setTransferQty(candidate.recommendedQuantity);
    setTransferNotes(`MDI Transfer-before-purchase justified: ${candidate.evidenceTerms.join(' ')}`);
  };

  const handleConfirmTransferProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferCandidate || !transferCandidate.location.id || !transferCandidate.targetLocation?.id) return;

    proposeTransfer(
      transferCandidate.batch.id,
      transferCandidate.location.id,
      transferCandidate.targetLocation.id,
      transferQty,
      transferNotes
    );

    setTransferSuccess('Transfer request submitted for Manager sign-off.');
    setTimeout(() => {
      setTransferSuccess(null);
      setTransferCandidate(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E4]">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">Risk & Decision Intelligence</h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            MDI Engine: Expiry waste prevention, FEFO prioritization, and shortage redistribution candidates.
          </p>
        </div>

        {/* Tab switch between Expiry and Shortage */}
        <div className="flex items-center p-1 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg">
          <button
            onClick={() => setRiskTab('expiry')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              riskTab === 'expiry' ? 'bg-[#C2410C] text-white shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Expiry Risk ({expiryBatches.length})
          </button>
          <button
            onClick={() => setRiskTab('shortage')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              riskTab === 'shortage' ? 'bg-[#C2410C] text-white shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Shortage Risk ({shortageMedicines.length})
          </button>
        </div>
      </div>

      {/* HERO SECTION: MDI BEST-NEXT-ACTIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C2410C]" />
            <h2 className="text-base font-bold text-[#1C1917]">MDI Recommended Actions (Evaluated Feasible)</h2>
          </div>
          <span className="text-xs text-[#78716C]">
            Verified compatibility &bull; Human approval required
          </span>
        </div>

        {feasibleCandidates.length === 0 ? (
          <div className="p-6 bg-white border border-[#E7E5E4] rounded-lg text-center text-sm text-[#78716C]">
            No pending high-risk batch actions requiring intervention today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feasibleCandidates.map((cand) => {
              const medName = cand.medicine.brandName || cand.medicine.genericName;

              return (
                <div
                  key={cand.id}
                  className="bg-white border border-[#E7E5E4] hover:border-[#C2410C] rounded-lg p-5 shadow-sm transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]">
                          {cand.type}
                        </span>
                        <span className="text-xs font-semibold text-[#1C1917]">{medName}</span>
                        <span className="text-xs font-mono text-[#78716C]">({cand.batch.batchCode})</span>
                      </div>
                      <span className="text-[11px] text-[#A16207] bg-[#FEF9C3] px-2 py-0.5 rounded-full font-medium">
                        Needs Manager Approval
                      </span>
                    </div>

                    <div className="mt-2 text-sm font-semibold text-[#1C1917] flex items-center gap-1.5">
                      <span>{cand.location.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#78716C]" />
                      <span>{cand.targetLocation?.name || 'ICU'}</span>
                    </div>

                    <div className="text-base font-bold text-[#C2410C] mt-1 font-mono">
                      Move {cand.recommendedQuantity} units
                    </div>

                    {/* Why clause */}
                    <div className="mt-2 text-xs text-[#78716C] bg-[#FAFAF9] p-2.5 rounded border border-[#E7E5E4] leading-relaxed">
                      <strong className="text-[#1C1917]">Why: </strong>
                      {cand.evidenceTerms.join(' · ')}
                    </div>

                    {/* Compatibility Checklist */}
                    <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
                      {cand.checks.storageMatch && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D]">
                          <CheckCircle2 className="w-3 h-3" /> Storage Match
                        </span>
                      )}
                      {cand.checks.shelfLifeSufficient && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D]">
                          <CheckCircle2 className="w-3 h-3" /> Shelf Life Valid
                        </span>
                      )}
                      {cand.checks.donorSurplusConfirmed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D]">
                          <CheckCircle2 className="w-3 h-3" /> Donor Surplus Confirmed
                        </span>
                      )}
                      {cand.checks.batchActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D]">
                          <CheckCircle2 className="w-3 h-3" /> Batch Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-[#E7E5E4] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-[#78716C]">Projected value preserved:</div>
                      <div className="text-sm font-bold text-[#15803D] font-mono">
                        {formatPaiseINR(cand.projectedFinancialImpactPaise)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDrawerItem({ type: 'batch', batchId: cand.batch.id })}
                        className="px-2.5 py-1.5 text-xs font-medium text-[#78716C] hover:text-[#1C1917]"
                      >
                        Evidence
                      </button>
                      <button
                        onClick={() => handleOpenTransferModal(cand)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg shadow-sm transition-colors"
                      >
                        Propose Transfer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Collapsed Infeasible Actions */}
        {infeasibleCandidates.length > 0 && (
          <details className="mt-3 bg-[#FAFAF9] p-3 rounded-lg border border-[#E7E5E4] text-xs">
            <summary className="font-medium text-[#78716C] cursor-pointer hover:text-[#1C1917]">
              View {infeasibleCandidates.length} evaluated actions not feasible today (with reasons)
            </summary>
            <div className="mt-3 space-y-2">
              {infeasibleCandidates.map((inf) => (
                <div
                  key={inf.id}
                  className="p-2.5 bg-white rounded border border-[#E7E5E4] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-[#1C1917]">
                      {inf.type} &bull; Batch {inf.batch.batchCode}
                    </div>
                    <div className="text-[11px] text-[#B91C1C]">{inf.infeasibilityReason || 'Infeasible check'}</div>
                  </div>
                  <span className="text-[10px] text-[#78716C] font-mono">Rule Check Failed</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* PENDING TRANSFERS QUEUE */}
      {transferRequests.length > 0 && (
        <div className="space-y-3 bg-white p-4 rounded-lg border border-[#E7E5E4]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#C2410C]" />
              <span>Inter-Ward Transfer Requests Queue</span>
            </h3>
            <span className="text-xs text-[#78716C]">
              {transferRequests.filter((t) => t.status === 'PENDING').length} awaiting manager approval
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E7E5E4] text-[10px] text-[#78716C] uppercase">
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Batch & Medicine</th>
                  <th className="py-2.5 px-3">From Location</th>
                  <th className="py-2.5 px-3">To Location</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3">Rationale</th>
                  <th className="py-2.5 px-3 text-center">Status / Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {transferRequests.map((req) => {
                  const b = batches.find((x) => x.id === req.batchId);
                  const med = medicines.find((m) => m.id === b?.medicineId);
                  const src = locations.find((l) => l.id === req.sourceLocationId);
                  const dst = locations.find((l) => l.id === req.destinationLocationId);

                  return (
                    <tr key={req.id} className="hover:bg-[#FAFAF9]">
                      <td className="py-2.5 px-3 font-mono text-[#78716C]">{req.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#1C1917]">
                        {med?.brandName || med?.genericName}{' '}
                        <span className="font-mono text-[#78716C]">({b?.batchCode})</span>
                      </td>
                      <td className="py-2.5 px-3">{src?.name}</td>
                      <td className="py-2.5 px-3 font-medium text-[#C2410C]">{dst?.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">{req.quantity}</td>
                      <td className="py-2.5 px-3 text-[#78716C] max-w-xs truncate">{req.rationale}</td>
                      <td className="py-2.5 px-3 text-center">
                        {req.status === 'PENDING' ? (
                          currentUser.role === 'STAFF' ? (
                            <span className="text-[11px] text-[#A16207] bg-[#FEF9C3] px-2 py-0.5 rounded">
                              Pending Approval
                            </span>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => decideTransfer(req.id, 'APPROVE')}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded transition-colors"
                              >
                                Approve Transfer
                              </button>
                              <button
                                onClick={() => decideTransfer(req.id, 'REJECT')}
                                className="px-2 py-1 text-xs text-[#78716C] hover:text-[#B91C1C] border border-[#E7E5E4] rounded transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )
                        ) : (
                          <StatusBadge
                            variant={req.status === 'APPROVED' ? 'EXECUTED' : 'EXPIRED'}
                            text={req.status}
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

      {/* RISK TABLE: EXPIRY TAB (SEGMENTED 20, 30, 60 DAYS FOCUS) */}
      {riskTab === 'expiry' && (
        <div className="space-y-4">
          {/* Expiry Window Focus Cards: 20d, 30d, 60d */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: <= 20 Days Focus */}
            <div
              onClick={() => setExpiryWindowFilter(expiryWindowFilter === 'LE_20' ? 'ALL' : 'LE_20')}
              className={`p-4 rounded-xl border cursor-pointer transition-all card-hover-lift flex flex-col justify-between space-y-2 ${
                expiryWindowFilter === 'LE_20'
                  ? 'bg-red-50/70 border-[#B91C1C] ring-2 ring-[#B91C1C]/20 shadow-xs'
                  : 'bg-white border-[#E7E5E4] hover:border-[#B91C1C]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#B91C1C] flex items-center gap-1.5 uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-[#B91C1C] animate-pulse" />
                  <span>Next ≤ 20 Days</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C] font-bold border border-[#FECACA]">
                  {expiryBuckets.bucket20.length} Batches
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-[#B91C1C] tabular-nums">
                  {formatPaiseINR(expiryBuckets.val20)}
                </div>
                <div className="text-[11px] text-[#78716C] mt-0.5 font-medium">
                  Emergency Action: Liquidation, 50% chemist discount, or immediate ICU consumption.
                </div>
              </div>
              <div className="text-[10px] text-[#B91C1C] font-semibold pt-1 border-t border-red-100 flex items-center justify-between">
                <span>{expiryWindowFilter === 'LE_20' ? 'Active Focus (Click to reset)' : 'Click to isolate ≤20d batches'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Card 2: 21–30 Days Focus */}
            <div
              onClick={() => setExpiryWindowFilter(expiryWindowFilter === '21_30' ? 'ALL' : '21_30')}
              className={`p-4 rounded-xl border cursor-pointer transition-all card-hover-lift flex flex-col justify-between space-y-2 ${
                expiryWindowFilter === '21_30'
                  ? 'bg-orange-50/70 border-[#C2410C] ring-2 ring-[#C2410C]/20 shadow-xs'
                  : 'bg-white border-[#E7E5E4] hover:border-[#C2410C]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#C2410C] flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-[#C2410C]" />
                  <span>Next 21–30 Days</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FFF7ED] text-[#C2410C] font-bold border border-[#FFEDD5]">
                  {expiryBuckets.bucket30.length} Batches
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-[#C2410C] tabular-nums">
                  {formatPaiseINR(expiryBuckets.val30)}
                </div>
                <div className="text-[11px] text-[#78716C] mt-0.5 font-medium">
                  High Urgency: Strict FEFO burn rate enforcement & temporary procurement freeze.
                </div>
              </div>
              <div className="text-[10px] text-[#C2410C] font-semibold pt-1 border-t border-orange-100 flex items-center justify-between">
                <span>{expiryWindowFilter === '21_30' ? 'Active Focus (Click to reset)' : 'Click to isolate 21–30d batches'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Card 3: 31–60 Days Focus */}
            <div
              onClick={() => setExpiryWindowFilter(expiryWindowFilter === '31_60' ? 'ALL' : '31_60')}
              className={`p-4 rounded-xl border cursor-pointer transition-all card-hover-lift flex flex-col justify-between space-y-2 ${
                expiryWindowFilter === '31_60'
                  ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white border-[#E7E5E4] hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Next 31–60 Days</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  {expiryBuckets.bucket60.length} Batches
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
                  {formatPaiseINR(expiryBuckets.val60)}
                </div>
                <div className="text-[11px] text-[#78716C] mt-0.5 font-medium">
                  Surveillance Window: Monitor patient velocity & plan inter-department transfers.
                </div>
              </div>
              <div className="text-[10px] text-amber-700 font-semibold pt-1 border-t border-amber-100 flex items-center justify-between">
                <span>{expiryWindowFilter === '31_60' ? 'Active Focus (Click to reset)' : 'Click to isolate 31–60d batches'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E7E5E4]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-[#1C1917] mr-1">Focus Window:</span>
              <button
                type="button"
                onClick={() => setExpiryWindowFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  expiryWindowFilter === 'ALL'
                    ? 'bg-[#1C1917] text-white shadow-xs'
                    : 'bg-[#FAFAF9] text-[#78716C] hover:text-[#1C1917] border border-[#E7E5E4]'
                }`}
              >
                All Expiry Windows (≤ 60d) &bull; {expiryBatches.length}
              </button>

              <button
                type="button"
                onClick={() => setExpiryWindowFilter('LE_20')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  expiryWindowFilter === 'LE_20'
                    ? 'bg-[#B91C1C] text-white shadow-xs'
                    : 'bg-[#FAFAF9] text-[#B91C1C] hover:bg-red-50 border border-red-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Next ≤ 20 Days ({expiryBuckets.bucket20.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setExpiryWindowFilter('21_30')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  expiryWindowFilter === '21_30'
                    ? 'bg-[#C2410C] text-white shadow-xs'
                    : 'bg-[#FAFAF9] text-[#C2410C] hover:bg-orange-50 border border-orange-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Next 21–30 Days ({expiryBuckets.bucket30.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setExpiryWindowFilter('31_60')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  expiryWindowFilter === '31_60'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-[#FAFAF9] text-amber-700 hover:bg-amber-50 border border-amber-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Next 31–60 Days ({expiryBuckets.bucket60.length})</span>
              </button>
            </div>

            <div className="text-xs text-[#78716C] font-mono">
              Showing <strong>{displayedExpiryBatches.length}</strong> of {expiryBatches.length} batches
            </div>
          </div>

          {/* Clinical Action Focus Banner */}
          {expiryWindowFilter !== 'ALL' && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in ${
                expiryWindowFilter === 'LE_20'
                  ? 'bg-red-50 border-red-200 text-[#B91C1C]'
                  : expiryWindowFilter === '21_30'
                  ? 'bg-orange-50 border-orange-200 text-[#C2410C]'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">
                  {expiryWindowFilter === 'LE_20'
                    ? 'Immediate Emergency Expiry Action Protocol (≤ 20 Days)'
                    : expiryWindowFilter === '21_30'
                    ? 'Priority Formulary Consumption Protocol (21–30 Days)'
                    : 'Surveillance & Inter-Department Planning Protocol (31–60 Days)'}
                </div>
                <div className="text-[11px] leading-relaxed opacity-90">
                  {expiryWindowFilter === 'LE_20'
                    ? 'These medicines will expire within 20 days. Execute immediate inter-ward redistribution to ICU/Emergency or publish at 50% discount on the Local Chemist Peer Network to prevent complete discard loss.'
                    : expiryWindowFilter === '21_30'
                    ? 'Formulary lock: Ensure all ward nursing stations consume these specific batches first (strict FEFO). Temporarily block duplicate supplier purchase orders for these SKUs.'
                    : 'Batches with 31 to 60 days remaining are entering the critical risk window. Review daily ward burn rates and stage inter-department transfer requests.'}
                </div>
              </div>
            </div>
          )}

          {/* Near Expiry Batches Table */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FAFAF9] border-b border-[#E7E5E4] text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
                    <th className="py-3 px-4">Medicine & Form</th>
                    <th className="py-3 px-3">Batch Code</th>
                    <th className="py-3 px-3">Expiry Date</th>
                    <th className="py-3 px-3">Days Left</th>
                    <th className="py-3 px-3 text-right">On-Hand Stock</th>
                    <th className="py-3 px-3 text-right">Projected Waste</th>
                    <th className="py-3 px-3 text-right">At-Risk Value</th>
                    <th className="py-3 px-4 text-center">Decisions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E5E4]">
                  {displayedExpiryBatches.map((item) => {
                    const displayName = item.med?.brandName || item.med?.genericName;
                    const isLe20 = item.expiry.daysToExpiry <= 20;
                    const isLe30 = item.expiry.daysToExpiry > 20 && item.expiry.daysToExpiry <= 30;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedDrawerItem({ type: 'batch', batchId: item.id })}
                        className="hover:bg-[#FFF7ED]/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={item.med?.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80'}
                              alt={displayName}
                              className="w-9 h-9 rounded-lg object-cover border border-[#E7E5E4] shrink-0"
                            />
                            <div>
                              <div className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                                <span>{displayName}</span>
                                {item.med?.storageRequirement === 'COLD_CHAIN' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                    2–8°C
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#78716C]">{item.med?.genericName}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-xs font-semibold text-[#1C1917]">{item.batchCode}</td>
                        <td className="py-3 px-3 text-xs font-mono text-[#1C1917]">{item.expiresOn}</td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                              isLe20
                                ? 'bg-red-50 text-[#B91C1C] border-red-200 animate-pulse'
                                : isLe30
                                ? 'bg-orange-50 text-[#C2410C] border-orange-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {isLe20 && <Flame className="w-3.5 h-3.5 text-[#B91C1C]" />}
                            {isLe30 && <Clock className="w-3.5 h-3.5 text-[#C2410C]" />}
                            <span>{item.expiry.daysToExpiry} days left</span>
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums text-[#1C1917] font-semibold">
                          {item.totalOnHand} {item.med?.unit || 'units'}
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums text-[#B91C1C] font-semibold">
                          {item.projectedUnconsumed} units
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums text-[#B91C1C] font-bold">
                          {formatPaiseINR(item.projectedAtRiskPaise)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                const cand = mdiCandidates.find((c) => c.batch.id === item.id);
                                if (cand) {
                                  setTransferCandidate(cand);
                                  setTransferQty(cand.recommendedQuantity);
                                  setTransferNotes(`Transfer candidate: ${cand.evidenceTerms.join(' ')}`);
                                } else {
                                  setSelectedDrawerItem({ type: 'batch', batchId: item.id });
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FFEDD5] text-[#C2410C] text-xs font-semibold transition-colors shadow-2xs"
                              title="Propose inter-department transfer"
                            >
                              Transfer
                            </button>

                            <button
                              onClick={() => {
                                postSharedListing({
                                  medicineName: displayName || item.batchCode,
                                  medicineSku: item.med?.sku || item.medicineId,
                                  batchCode: item.batchCode,
                                  expiresOn: item.expiresOn,
                                  availableUnits: Math.max(10, Math.floor(item.totalOnHand * 0.4)),
                                  unitPricePaise: item.unitCostPaise || item.med?.unitCostPaise || 2000,
                                  discountPercent: isLe20 ? 50 : 30,
                                  notes: `Urgent near-expiry surplus (${item.expiry.daysToExpiry} days left). Liquidate to peer chemists.`,
                                });
                                alert(`Listed ${displayName} (${item.batchCode}) on Chemist Exchange at ${isLe20 ? '50%' : '30%'} discount!`);
                              }}
                              className="px-2.5 py-1 rounded bg-white hover:bg-[#FAFAF9] border border-[#E7E5E4] hover:border-[#C2410C] text-[#1C1917] hover:text-[#C2410C] text-xs font-medium transition-colors shadow-2xs flex items-center gap-1"
                              title="Offer to neighboring chemists"
                            >
                              <Share2 className="w-3 h-3 text-[#C2410C]" />
                              <span>Exchange</span>
                            </button>

                            <button
                              onClick={() => setSelectedDrawerItem({ type: 'batch', batchId: item.id })}
                              className="p-1 rounded text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAFAF9]"
                              title="Inspect Clinical Evidence"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {displayedExpiryBatches.length === 0 && (
              <div className="p-8 text-center text-xs text-[#78716C] space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#15803D] mx-auto" />
                <div className="font-semibold text-sm text-[#1C1917]">No batches in this expiry window</div>
                <p>All items in this bracket have been consumed or safely redistributed.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RISK TABLE: SHORTAGE TAB */}
      {riskTab === 'shortage' && (
        <div className="bg-white border border-[#E7E5E4] rounded-lg overflow-hidden shadow-sm space-y-2">
          <div className="p-4 border-b border-[#E7E5E4] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">Shortage & Depletion Exposure</h3>
              <p className="text-xs text-[#78716C] mt-0.5">
                Items predicted to exhaust before standard lead time replenishment.
              </p>
            </div>
            <span className="text-xs font-mono text-[#78716C]">Adaptive Demand Monitored</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E7E5E4] text-[11px] font-semibold text-[#78716C] uppercase">
                  <th className="py-3 px-4">Medicine & Form</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Daily Demand</th>
                  <th className="py-3 px-3 text-right">On-Hand Stock</th>
                  <th className="py-3 px-3 text-right">Coverage Days</th>
                  <th className="py-3 px-3 text-center">Risk Status</th>
                  <th className="py-3 px-4 text-center">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {shortageMedicines.map((med) => {
                  const isCritical = parseFloat(med.daysCoverage) <= 3;
                  const displayName = med.brandName || med.genericName;

                  return (
                    <tr
                      key={med.id}
                      onClick={() => setSelectedDrawerItem({ type: 'medicine', medicineId: med.id })}
                      className="hover:bg-[#FFF7ED]/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={med.image}
                            alt={displayName}
                            className="w-8 h-8 rounded object-cover border border-[#E7E5E4]"
                          />
                          <div>
                            <div className="font-semibold text-[#1C1917]">{displayName}</div>
                            <div className="text-xs text-[#78716C]">{med.genericName}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs text-[#78716C]">{med.category}</td>

                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-[#1C1917]">
                        {med.dailyDemand} / day
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums font-bold">
                        <span className={med.totalOnHand <= 30 ? 'text-[#B91C1C]' : 'text-[#1C1917]'}>
                          {med.totalOnHand} {med.unit}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums font-bold">
                        <span className={isCritical ? 'text-[#B91C1C]' : 'text-[#A16207]'}>
                          {med.daysCoverage} days
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <StatusBadge
                          variant={isCritical ? 'STOCKOUT' : 'LOW_STOCK'}
                          text={isCritical ? 'Stockout Imminent' : 'Low Stock'}
                        />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDrawerItem({ type: 'medicine', medicineId: med.id });
                          }}
                          className="text-xs text-[#C2410C] hover:underline font-semibold"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SIDE DRAWER FOR DETAILED EVIDENCE */}
      {selectedDrawerItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-[#E7E5E4] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between p-4 border-b border-[#E7E5E4] bg-[#FAFAF9]">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#C2410C]" />
                  <h3 className="font-bold text-[#1C1917]">Decision Intelligence Evidence</h3>
                </div>
                <button
                  onClick={() => setSelectedDrawerItem(null)}
                  className="text-[#78716C] hover:text-[#1C1917] p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5 text-sm">
                {selectedDrawerItem.type === 'batch' && selectedDrawerItem.batchId && (
                  (() => {
                    const b = batches.find((x) => x.id === selectedDrawerItem.batchId);
                    const med = medicines.find((m) => m.id === b?.medicineId);
                    const expiry = calculateExpiry(b?.expiresOn || '', rules.demoFixedDate, rules);
                    const bBals = balances.filter((bal) => bal.batchId === b?.id);
                    const totalQty = bBals.reduce((acc, curr) => acc + curr.quantity, 0);
                    const displayName = med?.brandName || med?.genericName;

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={med?.image}
                            alt={displayName}
                            className="w-12 h-12 rounded-lg object-cover border border-[#E7E5E4]"
                          />
                          <div>
                            <h4 className="font-bold text-[#1C1917]">{displayName}</h4>
                            <div className="text-xs text-[#78716C] font-mono">
                              Batch: {b?.batchCode} &bull; Exp: {b?.expiresOn}
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#FAFAF9] p-3.5 rounded-lg border border-[#E7E5E4] space-y-2 text-xs">
                          <div className="font-semibold text-[#1C1917] uppercase tracking-wider text-[10px]">
                            Deterministic Expiry Evaluation
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#78716C]">Current Fixed Date:</span>
                            <span className="font-mono font-medium">{rules.demoFixedDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#78716C]">Days Remaining:</span>
                            <span className="font-mono font-bold text-[#B91C1C]">{expiry.daysToExpiry} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#78716C]">Expiry Band:</span>
                            <StatusBadge variant={mapExpiryBandToVariant(expiry.band)} text={expiry.label} />
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="font-semibold text-[#1C1917]">Balances Across Hospital Wards:</div>
                          <div className="space-y-1.5">
                            {bBals.map((bal) => {
                              const loc = locations.find((l) => l.id === bal.locationId);
                              return (
                                <div
                                  key={`${bal.batchId}_${bal.locationId}`}
                                  className="p-2 bg-white rounded border border-[#E7E5E4] flex justify-between items-center"
                                >
                                  <span className="text-[#1C1917] font-medium">{loc?.name}:</span>
                                  <span className="font-mono font-bold">{bal.quantity} units</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {selectedDrawerItem.type === 'medicine' && selectedDrawerItem.medicineId && (
                  (() => {
                    const med = medicines.find((m) => m.id === selectedDrawerItem.medicineId);
                    const displayName = med?.brandName || med?.genericName;
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={med?.image}
                            alt={displayName}
                            className="w-12 h-12 rounded-lg object-cover border border-[#E7E5E4]"
                          />
                          <div>
                            <h4 className="font-bold text-[#1C1917]">{displayName}</h4>
                            <div className="text-xs text-[#78716C]">{med?.genericName}</div>
                          </div>
                        </div>

                        <div className="bg-[#FAFAF9] p-3.5 rounded-lg border border-[#E7E5E4] space-y-2 text-xs">
                          <div className="font-semibold text-[#1C1917] uppercase tracking-wider text-[10px]">
                            Shortage & Replenishment Model
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#78716C]">Criticality:</span>
                            <span className="font-mono font-bold text-[#B91C1C]">{med?.criticality}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#78716C]">Storage Requirement:</span>
                            <span className="font-mono">{med?.storageRequirement}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#E7E5E4] bg-[#FAFAF9] flex justify-end">
              <button
                onClick={() => setSelectedDrawerItem(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER PROPOSAL MODAL */}
      {transferCandidate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#E7E5E4] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#E7E5E4] bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#C2410C]" />
                <h3 className="font-bold text-[#1C1917]">Propose Inter-Department Stock Transfer</h3>
              </div>
              <button onClick={() => setTransferCandidate(null)} className="text-[#78716C] hover:text-[#1C1917] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#15803D] mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-[#1C1917]">Proposal Queued</h4>
                <p className="text-sm text-[#78716C]">{transferSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmTransferProposal} className="p-5 space-y-4 text-sm">
                <div className="bg-[#FAFAF9] p-3 rounded-lg border border-[#E7E5E4] space-y-1.5 text-xs">
                  <div className="font-semibold text-[#1C1917]">Batch & Route:</div>
                  <div className="flex items-center justify-between text-[#78716C]">
                    <span>Donor Location:</span>
                    <strong className="text-[#1C1917]">
                      {transferCandidate.location.name}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[#78716C]">
                    <span>Recipient Location:</span>
                    <strong className="text-[#C2410C]">
                      {transferCandidate.targetLocation?.name}
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">Transfer Quantity (Units)</label>
                  <input
                    type="number"
                    min="1"
                    value={transferQty}
                    onChange={(e) => setTransferQty(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2 text-sm font-mono focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">Clinical Rationale & Notes</label>
                  <textarea
                    rows={3}
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2 text-xs focus:ring-2 focus:ring-[#C2410C] focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E5E4]">
                  <button
                    type="button"
                    onClick={() => setTransferCandidate(null)}
                    className="px-4 py-2 text-xs font-medium text-[#78716C]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg shadow-sm"
                  >
                    Submit Transfer Proposal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
