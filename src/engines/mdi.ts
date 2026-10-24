import { Batch, Medicine, Location, Supplier, StockBalance } from '../schemas';
import { evaluateFEFOAllocation } from './fefo';
import { evaluateTransferFeasibility } from './transfer';
import { calculateAdaptiveReorder } from './reorder';
import { calculateExpiry } from './expiry';

export type MDIActionType =
  | 'TRANSFER'
  | 'FEFO_DISPENSE'
  | 'SUPPLIER_RETURN'
  | 'PROCUREMENT_REORDER'
  | 'DISPOSAL_REVIEW';

export interface MDICandidate {
  id: string;
  type: MDIActionType;
  title: string;
  medicine: Medicine;
  batch: Batch;
  location: Location;
  targetLocation?: Location;
  recommendedQuantity: number;
  projectedFinancialImpactPaise: number;
  urgencyScore: number; // 0-100
  evidenceTerms: string[];
  checks: {
    storageMatch: boolean;
    shelfLifeSufficient: boolean;
    donorSurplusConfirmed: boolean;
    batchActive: boolean;
  };
  requiresManagerApproval: boolean;
  isFeasible: boolean;
  infeasibilityReason?: string;
}

/**
 * Pure engine: MDI Best-Next-Action Engine (F19).
 * Evaluates candidate actions, enforces transfer-before-purchase, and ranks by feasible evidence.
 */
export function evaluateBestNextActions(
  batches: Batch[],
  medicines: Medicine[],
  locations: Location[],
  suppliers: Supplier[],
  balances: StockBalance[],
  dailyRatesMap: Map<string, number>, // key = `${medicineId}_${locationId}`
  nowDateStr: string
): MDICandidate[] {
  const medicineMap = new Map<string, Medicine>(medicines.map(m => [m.id, m]));
  const locationMap = new Map<string, Location>(locations.map(l => [l.id, l]));
  const supplierMap = new Map<string, Supplier>(suppliers.map(s => [s.id, s]));

  const candidates: MDICandidate[] = [];

  // Group balances by location
  for (const loc of locations) {
    for (const med of medicines) {
      const dailyUsage = dailyRatesMap.get(`${med.id}_${loc.id}`) || 2;
      const fefoEvals = evaluateFEFOAllocation(batches, balances, loc.id, dailyUsage, nowDateStr);

      for (const fEval of fefoEvals) {
        const batch = batches.find(b => b.id === fEval.batchId);
        if (!batch) continue;

        const supplier = supplierMap.get(batch.supplierId);
        const expiryCalc = calculateExpiry(batch.expiresOn, nowDateStr, {
          expiryWarningDaysRed: 15,
          expiryWarningDaysYellow: 30,
          expiryWarningDaysNeutral: 60,
        });

        // 1. Expired / Ineligible: DISPOSAL_REVIEW
        if (expiryCalc.isExpired || batch.status === 'EXPIRED' || batch.status === 'RECALLED' || batch.status === 'QUARANTINED') {
          candidates.push({
            id: `MDI-DISPOSE-${batch.id}-${loc.id}`,
            type: 'DISPOSAL_REVIEW',
            title: `DISPOSAL REVIEW · ${med.genericName} · Batch ${batch.batchCode}`,
            medicine: med,
            batch,
            location: loc,
            recommendedQuantity: fEval.availableQuantity,
            projectedFinancialImpactPaise: fEval.availableQuantity * batch.unitCostPaise,
            urgencyScore: 95,
            evidenceTerms: [
              `Batch is ${batch.status} (expired ${Math.abs(expiryCalc.daysToExpiry)} days ago).`,
              'Must be physically removed and quarantined for controlled incineration.',
            ],
            checks: {
              storageMatch: true,
              shelfLifeSufficient: false,
              donorSurplusConfirmed: true,
              batchActive: false,
            },
            requiresManagerApproval: true,
            isFeasible: true,
          });
          continue;
        }

        // 2. Projected Waste Detected (fEval.projectedUnconsumedUnits > 0)
        if (fEval.projectedUnconsumedUnits > 0) {
          // Check for INTER-LOCATION TRANSFER first (transfer-before-purchase)
          const otherLocations = locations.filter(l => l.id !== loc.id);
          let matchedTransfer = false;

          for (const targetLoc of otherLocations) {
            const targetUsage = dailyRatesMap.get(`${med.id}_${targetLoc.id}`) || 2;
            const targetBal = balances
              .filter(b => b.locationId === targetLoc.id)
              .filter(b => {
                const bObj = batches.find(x => x.id === b.batchId);
                return bObj && bObj.medicineId === med.id && bObj.status === 'ACTIVE';
              })
              .reduce((acc, c) => acc + c.quantity, 0);

            const leadTime = supplier?.leadTimeDays || 4;
            const targetCoverageDays = targetUsage > 0 ? targetBal / targetUsage : 999;
            const targetDeficit = Math.max(0, Math.ceil(targetUsage * 14 - targetBal));

            if (targetCoverageDays < leadTime + 3 && targetDeficit > 0) {
              const feasibility = evaluateTransferFeasibility(
                batch,
                loc,
                fEval.projectedUnconsumedUnits,
                expiryCalc.daysToExpiry,
                targetLoc,
                targetDeficit
              );

              if (feasibility.isFeasible && feasibility.recommendedTransferQty > 0) {
                candidates.push({
                  id: `MDI-TRF-${batch.id}-${loc.id}-${targetLoc.id}`,
                  type: 'TRANSFER',
                  title: `TRANSFER · ${med.genericName} · Batch ${batch.batchCode}`,
                  medicine: med,
                  batch,
                  location: loc,
                  targetLocation: targetLoc,
                  recommendedQuantity: feasibility.recommendedTransferQty,
                  projectedFinancialImpactPaise: feasibility.projectedValuePreservedPaise,
                  urgencyScore: 90,
                  evidenceTerms: [
                    `Expires in ${expiryCalc.daysToExpiry} days.`,
                    `${fEval.projectedUnconsumedUnits} units projected unused at ${loc.name}.`,
                    `${targetLoc.name} runs out in ${targetCoverageDays.toFixed(1)} days (lead time: ${leadTime}d).`,
                  ],
                  checks: feasibility.checks,
                  requiresManagerApproval: true,
                  isFeasible: true,
                });
                matchedTransfer = true;
                break;
              }
            }
          }

          // Check for SUPPLIER RETURN if transfer not matched
          if (!matchedTransfer && supplier?.acceptsReturns && supplier.returnWindowDays > 0) {
            const canReturn = expiryCalc.daysToExpiry > supplier.returnWindowDays;
            if (canReturn) {
              const returnCutoffDays = expiryCalc.daysToExpiry - supplier.returnWindowDays;
              candidates.push({
                id: `MDI-RET-${batch.id}-${loc.id}`,
                type: 'SUPPLIER_RETURN',
                title: `SUPPLIER RETURN · ${med.genericName} · Batch ${batch.batchCode}`,
                medicine: med,
                batch,
                location: loc,
                recommendedQuantity: fEval.projectedUnconsumedUnits,
                projectedFinancialImpactPaise: fEval.projectedUnconsumedUnits * batch.unitCostPaise,
                urgencyScore: 80,
                evidenceTerms: [
                  `${fEval.projectedUnconsumedUnits} units projected unused.`,
                  `Supplier ${supplier.name} policy accepts returns with ≥ ${supplier.returnWindowDays}d window.`,
                  `${returnCutoffDays} days remaining to dispatch return.`,
                ],
                checks: {
                  storageMatch: true,
                  shelfLifeSufficient: true,
                  donorSurplusConfirmed: true,
                  batchActive: true,
                },
                requiresManagerApproval: true,
                isFeasible: true,
              });
            }
          }
        } else {
          // Healthy stock with earliest expiry: FEFO_DISPENSE
          if (fEval.allocationRank === 1 && fEval.daysToExpiry <= 30) {
            candidates.push({
              id: `MDI-FEFO-${batch.id}-${loc.id}`,
              type: 'FEFO_DISPENSE',
              title: `USE FIRST (FEFO) · ${med.genericName} · Batch ${batch.batchCode}`,
              medicine: med,
              batch,
              location: loc,
              recommendedQuantity: fEval.availableQuantity,
              projectedFinancialImpactPaise: fEval.availableQuantity * batch.unitCostPaise,
              urgencyScore: 65,
              evidenceTerms: [
                `Earliest active expiry (${batch.expiresOn}, ${fEval.daysToExpiry}d left).`,
                'Full batch projected to be consumed before expiry if dispensed first.',
              ],
              checks: {
                storageMatch: true,
                shelfLifeSufficient: true,
                donorSurplusConfirmed: false,
                batchActive: true,
              },
              requiresManagerApproval: false,
              isFeasible: true,
            });
          }
        }
      }
    }
  }

  // Sort candidates by urgency score descending
  return candidates.sort((a, b) => b.urgencyScore - a.urgencyScore);
}
