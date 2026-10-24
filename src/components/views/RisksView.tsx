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
  } = useMediGuard();

  // Tabs: Expiry vs Shortage (never merged into one score per DESIGN.md §4)
  const [riskTab, setRiskTab] = useState<'expiry' | 'shortage'>('expiry');

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
        const projectedAtRiskPaise = projectedUnconsumed * (med?.unitCostPaise || 0);

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

      {/* RISK TABLE: EXPIRY TAB */}
      {riskTab === 'expiry' && (
        <div className="bg-white border border-[#E7E5E4] rounded-lg overflow-hidden shadow-sm space-y-2">
          <div className="p-4 border-b border-[#E7E5E4] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">Near-Expiry Batches (≤ 60 Days Window)</h3>
              <p className="text-xs text-[#78716C] mt-0.5">
                Ranked by projected waste value. Click row to open decision evidence drawer.
              </p>
            </div>
            <span className="text-xs font-mono text-[#78716C]">FEFO Sorted</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E7E5E4] text-[11px] font-semibold text-[#78716C] uppercase">
                  <th className="py-3 px-4">Medicine & Form</th>
                  <th className="py-3 px-3">Batch Code</th>
                  <th className="py-3 px-3">Expiry Date</th>
                  <th className="py-3 px-3">Days Left</th>
                  <th className="py-3 px-3 text-right">On-Hand Qty</th>
                  <th className="py-3 px-3 text-right">Projected Unconsumed</th>
                  <th className="py-3 px-3 text-right">At-Risk Value (Projected)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {expiryBatches.map((item) => {
                  const displayName = item.med?.brandName || item.med?.genericName;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedDrawerItem({ type: 'batch', batchId: item.id })}
                      className="hover:bg-[#FFF7ED]/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.med?.image}
                            alt={displayName}
                            className="w-8 h-8 rounded object-cover border border-[#E7E5E4]"
                          />
                          <div>
                            <div className="font-semibold text-[#1C1917]">{displayName}</div>
                            <div className="text-xs text-[#78716C]">{item.med?.genericName}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-xs font-medium text-[#1C1917]">{item.batchCode}</td>
                      <td className="py-3 px-3 text-xs text-[#1C1917]">{item.expiresOn}</td>

                      <td className="py-3 px-3">
                        <StatusBadge
                          variant={mapExpiryBandToVariant(item.expiry.band)}
                          text={`${item.expiry.daysToExpiry} days`}
                        />
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#1C1917] font-semibold">
                        {item.totalOnHand}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#B91C1C] font-semibold">
                        {item.projectedUnconsumed} units
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#B91C1C] font-bold">
                        {formatPaiseINR(item.projectedAtRiskPaise)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDrawerItem({ type: 'batch', batchId: item.id });
                          }}
                          className="text-xs text-[#C2410C] hover:underline font-semibold"
                        >
                          Inspect
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
