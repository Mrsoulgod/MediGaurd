import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  CheckCircle2,
  Clock,
  Building2,
  X,
  Info,
} from 'lucide-react';
import { useMediGuard } from '../../context/MediGuardContext';
import { StatusBadge, StatusBadgeVariant } from '../common/StatusBadge';
import { calculateAdaptiveReorder, formatPaiseINR } from '../../engines/reorder';

export const ProcurementView: React.FC = () => {
  const {
    medicines,
    locations,
    suppliers,
    batches,
    balances,
    transferRequests,
    procurementRequests,
    rules,
    currentUser,
    selectedLocationId,
    proposeProcurement,
    decideProcurement,
    receiveProcurement,
  } = useMediGuard();

  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState<string>(medicines[0]?.id || '');
  const [selectedLocId, setSelectedLocId] = useState<string>('LOC-CENTRAL');
  const [customQty, setCustomQty] = useState<number>(100);
  const [priorityNotes, setPriorityNotes] = useState<string>('Routine reorder to meet 30-day target buffer');

  // Compute adaptive reorder suggestions across medicines
  const rankedReorderSuggestions = useMemo(() => {
    return medicines
      .map((med) => {
        const medBatches = batches.filter((b) => b.medicineId === med.id && b.status === 'ACTIVE');
        const medBals = balances.filter(
          (bal) =>
            medBatches.some((b) => b.id === bal.batchId) &&
            (selectedLocationId === 'ALL' || bal.locationId === selectedLocationId)
        );
        const usableOnHand = medBals.reduce((acc, curr) => acc + curr.quantity, 0);

        // Calculate approved incoming transfers
        const approvedTransfers = transferRequests
          .filter((t) => t.status === 'APPROVED' && medBatches.some((b) => b.id === t.batchId))
          .reduce((acc, curr) => acc + curr.quantity, 0);

        const dailyDemandRate = med.criticality === 'HIGH' ? 14 : 6;

        const reorderResult = calculateAdaptiveReorder({
          usableOnHandStock: usableOnHand,
          dailyUsage: dailyDemandRate,
          leadTimeDays: 4,
          safetyStockDays: rules.safetyStockDaysDefault,
          targetCoverageDays: rules.targetCoverageDaysDefault,
          incomingApprovedTransfers: approvedTransfers,
          incomingOrderedProcurement: 0,
          packageSize: 50,
          nowDateStr: rules.demoFixedDate,
        });

        const supplier = suppliers[0];

        return {
          med,
          supplier,
          usableOnHand,
          dailyDemandRate,
          reorderResult,
        };
      })
      .filter((item) => item.reorderResult.suggestedQty > 0 || item.usableOnHand <= 30)
      .sort((a, b) => b.reorderResult.suggestedQty - a.reorderResult.suggestedQty);
  }, [medicines, batches, balances, transferRequests, suppliers, selectedLocationId, rules]);

  // Handle Propose Order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedId || customQty <= 0) return;

    proposeProcurement(selectedMedId, selectedLocId, customQty, priorityNotes);
    setIsNewRequestModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* View Header with Exactly One Primary Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5E4]">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight">Procurement & Order Approvals</h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            Ranked procurement queue with full formula visibility, status steppers, and receipt verification.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedMedId(medicines[0]?.id || '');
            setIsNewRequestModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Request</span>
        </button>
      </div>

      {/* STATS & DISCLAIMER STRIP PER DESIGN.md §4 */}
      <div className="bg-[#FFF7ED] border border-[#FFEDD5] p-3.5 rounded-lg flex items-center justify-between text-xs text-[#C2410C]">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            <strong>Deterministic Reorder Formula:</strong> Suggested Qty = ceil((Target &minus; (Eligible + Incoming + Transfers &minus; Safety)) / PackSize) &times; PackSize.
          </span>
        </div>
        <span className="font-semibold text-[11px] underline">
          Approval does not change stock. Receiving does.
        </span>
      </div>

      {/* SECTION 1: ACTIVE PROCUREMENT REQUESTS & STATUS STEPPER */}
      <div className="bg-white border border-[#E7E5E4] rounded-lg overflow-hidden shadow-sm space-y-2">
        <div className="p-4 border-b border-[#E7E5E4] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1C1917]">Active Procurement Pipeline</h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Follows strict lifecycle: Pending &rarr; Approved &rarr; Ordered &rarr; Received.
            </p>
          </div>
          <span className="text-xs text-[#78716C] font-mono">
            {procurementRequests.length} Total POs
          </span>
        </div>

        {procurementRequests.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#78716C]">
            No purchase orders currently in progress. Use the suggestions below to initiate reorders.
          </div>
        ) : (
          <div className="divide-y divide-[#E7E5E4]">
            {procurementRequests.map((po) => {
              const med = medicines.find((m) => m.id === po.medicineId);
              const loc = locations.find((l) => l.id === po.locationId);
              const displayName = med?.brandName || med?.genericName;
              const totalCost = po.suggestedQty * (po.unitCostPaise || med?.unitCostPaise || 0);

              return (
                <div key={po.id} className="p-4 hover:bg-[#FAFAF9] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Item info */}
                    <div className="flex items-center gap-3">
                      <img
                        src={med?.image}
                        alt={displayName}
                        className="w-10 h-10 rounded-lg object-cover border border-[#E7E5E4]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1C1917]">{displayName}</span>
                          <span className="text-xs font-mono text-[#78716C]">PO: {po.id}</span>
                        </div>
                        <div className="text-xs text-[#78716C]">
                          Delivery to: <strong>{loc?.name}</strong> &bull; Qty: <strong>{po.suggestedQty} units</strong> &bull; Value: {formatPaiseINR(totalCost)}
                        </div>
                      </div>
                    </div>

                    {/* Status Stepper per DESIGN.md §4 */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <span
                        className={`px-2 py-0.5 rounded font-medium ${
                          po.status === 'PENDING'
                            ? 'bg-[#FEF9C3] text-[#A16207] border border-[#FEF08A]'
                            : 'bg-[#DCFCE7] text-[#15803D]'
                        }`}
                      >
                        Pending
                      </span>
                      <span className="text-[#78716C]">&rarr;</span>
                      <span
                        className={`px-2 py-0.5 rounded font-medium ${
                          po.status === 'APPROVED'
                            ? 'bg-[#FEF9C3] text-[#A16207] border border-[#FEF08A]'
                            : po.status === 'ORDERED' || po.status === 'RECEIVED'
                            ? 'bg-[#DCFCE7] text-[#15803D]'
                            : 'bg-[#F5F5F4] text-[#78716C]'
                        }`}
                      >
                        Approved
                      </span>
                      <span className="text-[#78716C]">&rarr;</span>
                      <span
                        className={`px-2 py-0.5 rounded font-medium ${
                          po.status === 'ORDERED'
                            ? 'bg-[#FEF9C3] text-[#A16207] border border-[#FEF08A]'
                            : po.status === 'RECEIVED'
                            ? 'bg-[#DCFCE7] text-[#15803D]'
                            : 'bg-[#F5F5F4] text-[#78716C]'
                        }`}
                      >
                        Ordered
                      </span>
                      <span className="text-[#78716C]">&rarr;</span>
                      <span
                        className={`px-2 py-0.5 rounded font-medium ${
                          po.status === 'RECEIVED'
                            ? 'bg-[#DCFCE7] text-[#15803D]'
                            : 'bg-[#F5F5F4] text-[#78716C]'
                        }`}
                      >
                        Received
                      </span>
                    </div>

                    {/* Action buttons based on Role and Status */}
                    <div className="flex items-center gap-2">
                      {po.status === 'PENDING' && (
                        currentUser.role === 'STAFF' ? (
                          <span className="text-xs text-[#A16207] bg-[#FEF9C3] px-2.5 py-1 rounded font-medium">
                            Awaiting Manager Approval
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => decideProcurement(po.id, 'APPROVE')}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors"
                            >
                              Approve Request
                            </button>
                            <button
                              onClick={() => decideProcurement(po.id, 'REJECT')}
                              className="px-2.5 py-1.5 text-xs font-medium text-[#78716C] hover:text-[#B91C1C] border border-[#E7E5E4] rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )
                      )}

                      {po.status === 'APPROVED' && (
                        <button
                          onClick={() => receiveProcurement(po.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg shadow-sm transition-colors"
                        >
                          Receive & Post Stock Receipt
                        </button>
                      )}

                      {po.status === 'RECEIVED' && (
                        <span className="text-xs text-[#15803D] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Stock Posted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: RANKED ADAPTIVE REORDER TABLE */}
      <div className="bg-white border border-[#E7E5E4] rounded-lg overflow-hidden shadow-sm space-y-2">
        <div className="p-4 border-b border-[#E7E5E4] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1C1917]">Ranked Adaptive Reorder Recommendations</h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Displays all calculation terms: daily burn, coverage, targets, buffer, and pack rounding.
            </p>
          </div>
          <span className="text-xs font-mono text-[#78716C]">Full Auditability</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-[#E7E5E4] text-[10px] font-semibold text-[#78716C] uppercase">
                <th className="py-2.5 px-3">Medicine</th>
                <th className="py-2.5 px-2 text-right">Daily Demand</th>
                <th className="py-2.5 px-2 text-right">Usable On-Hand</th>
                <th className="py-2.5 px-2 text-right">Coverage Days</th>
                <th className="py-2.5 px-2 text-right">Target (30d)</th>
                <th className="py-2.5 px-2 text-right">Safety Buffer</th>
                <th className="py-2.5 px-2 text-right font-bold text-[#C2410C]">Suggested Qty</th>
                <th className="py-2.5 px-3 text-right">Estimated Cost</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {rankedReorderSuggestions.map((item) => (
                <tr key={item.med.id} className="hover:bg-[#FFF7ED]/40 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-[#1C1917]">{item.med.brandName || item.med.genericName}</div>
                    <div className="text-[11px] text-[#78716C]">{item.supplier?.name}</div>
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono tabular-nums text-[#1C1917]">
                    {item.dailyDemandRate}/day
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono tabular-nums font-semibold">
                    <span className={item.usableOnHand <= 30 ? 'text-[#B91C1C]' : 'text-[#1C1917]'}>
                      {item.usableOnHand}
                    </span>
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                    <span
                      className={
                        item.reorderResult.coverageDays <= 5
                          ? 'text-[#B91C1C] font-bold'
                          : item.reorderResult.coverageDays <= 12
                          ? 'text-[#A16207]'
                          : 'text-[#1C1917]'
                      }
                    >
                      {item.reorderResult.coverageDays} d
                    </span>
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono tabular-nums text-[#78716C]">
                    {item.reorderResult.calculationTerms.targetDays * item.dailyDemandRate}
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono tabular-nums text-[#78716C]">
                    {item.reorderResult.reorderThresholdUnits}
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono tabular-nums font-bold text-[#C2410C] text-sm">
                    {item.reorderResult.suggestedQty} units
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#1C1917]">
                    {formatPaiseINR(item.reorderResult.suggestedQty * item.med.unitCostPaise)}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => {
                        proposeProcurement(
                          item.med.id,
                          'LOC-CENTRAL',
                          item.reorderResult.suggestedQty,
                          `MDI Adaptive Reorder: Coverage only ${item.reorderResult.coverageDays} days`
                        );
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-[#C2410C] hover:bg-[#FFF7ED] border border-[#C2410C] rounded transition-colors"
                    >
                      Create PO
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: SUPPLIER PERFORMANCE & RETURN POLICY */}
      <div className="bg-white border border-[#E7E5E4] rounded-lg p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#C2410C]" />
            <h3 className="font-bold text-[#1C1917]">Contracted Suppliers & Return Policies</h3>
          </div>
          <span className="text-xs text-[#78716C]">Verified Vendor Catalog</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {suppliers.map((sup) => (
            <div key={sup.id} className="p-3.5 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg space-y-1.5 text-xs">
              <div className="font-bold text-[#1C1917]">{sup.name}</div>
              <div className="text-[#78716C]">{sup.contactEmail}</div>
              <div className="pt-1.5 border-t border-[#E7E5E4] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Avg Lead Time:</span>
                  <span className="font-mono font-semibold">{sup.leadTimeDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Return Window:</span>
                  <span className="font-mono text-[#C2410C] font-semibold">{sup.returnWindowDays}d before exp</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW PURCHASE REQUEST MODAL */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#E7E5E4] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#E7E5E4] bg-[#FAFAF9]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#C2410C]" />
                <h3 className="font-bold text-[#1C1917]">Initiate Purchase Order</h3>
              </div>
              <button
                onClick={() => setIsNewRequestModalOpen(false)}
                className="text-[#78716C] hover:text-[#1C1917] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Select Medicine</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2 text-xs"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brandName || m.genericName} ({m.genericName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Target Receiving Location</label>
                <select
                  value={selectedLocId}
                  onChange={(e) => setSelectedLocId(e.target.value)}
                  className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2 text-xs"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Order Quantity (Units)</label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={customQty}
                  onChange={(e) => setCustomQty(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2 text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">Priority Justification</label>
                <input
                  type="text"
                  value={priorityNotes}
                  onChange={(e) => setPriorityNotes(e.target.value)}
                  className="w-full bg-white border border-[#E7E5E4] rounded-lg p-2 text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#78716C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg shadow-sm"
                >
                  Submit Order Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
