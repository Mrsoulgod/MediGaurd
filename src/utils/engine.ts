import { TODAY, THRESHOLDS, DEFAULT_SAFETY_DAYS, DEFAULT_COVER_DAYS } from '../config/constants';
import { Drug, Supplier, Batch, BatchAnalysis, TodayAction, ProcurementItem, Location, ActionType, ExpiryStatusColor } from '../types';

/**
 * Calculates days to expiry relative to the fixed demo TODAY constant.
 */
export function getDaysToExpiry(expiryDateStr: string): number {
  const expiry = new Date(expiryDateStr + 'T00:00:00');
  const today = new Date(TODAY + 'T00:00:00');
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Section 8.1: Determines status color based on daysToExpiry and drug criticality/cold chain.
 */
export function getExpiryStatus(daysToExpiry: number, drug: Drug, batchStatus: Batch['status']): ExpiryStatusColor {
  if (batchStatus === 'recalled' || batchStatus === 'quarantined') {
    return 'expired'; // black/critical treatment
  }
  if (daysToExpiry <= 0) {
    return 'expired';
  }

  const isTighter = drug.critical || drug.coldChain;
  const redLimit = isTighter ? THRESHOLDS.CRITICAL.RED : THRESHOLDS.NORMAL.RED;
  const amberLimit = isTighter ? THRESHOLDS.CRITICAL.AMBER : THRESHOLDS.NORMAL.AMBER;

  if (daysToExpiry < redLimit) return 'red';
  if (daysToExpiry < amberLimit) return 'amber';
  return 'green';
}

/**
 * Formats currency in Indian Rupee format (₹).
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculates return-by date (expiry minus returnWindowDays)
 */
export function calculateReturnByDate(expiryStr: string, returnWindowDays: number): string {
  const d = new Date(expiryStr + 'T00:00:00');
  d.setDate(d.getDate() - returnWindowDays);
  return d.toISOString().split('T')[0];
}

/**
 * Section 8.2 & 8.3: FEFO usable and wasted quantity per drug, and recommended action per batch.
 */
export function analyzeBatches(
  batches: Batch[],
  drugs: Drug[],
  suppliers: Supplier[]
): BatchAnalysis[] {
  const drugMap = new Map<string, Drug>(drugs.map(d => [d.id, d]));
  const supplierMap = new Map<string, Supplier>(suppliers.map(s => [s.id, s]));

  // Group active batches by drugId to run FEFO consumption calculation
  const activeBatchesByDrug = new Map<string, Batch[]>();
  for (const b of batches) {
    if (!activeBatchesByDrug.has(b.drugId)) {
      activeBatchesByDrug.set(b.drugId, []);
    }
    activeBatchesByDrug.get(b.drugId)!.push(b);
  }

  // Calculate location stocks per drug to detect transfers
  // Location stock map: drugId -> location -> total active qty
  const locationStockMap = new Map<string, Map<Location, number>>();
  for (const b of batches) {
    if (b.status !== 'active') continue;
    if (!locationStockMap.has(b.drugId)) {
      locationStockMap.set(b.drugId, new Map());
    }
    const currentLocQty = locationStockMap.get(b.drugId)!.get(b.location) || 0;
    locationStockMap.get(b.drugId)!.set(b.location, currentLocQty + b.qty);
  }

  const results: BatchAnalysis[] = [];

  for (const [drugId, drugBatches] of activeBatchesByDrug.entries()) {
    const drug = drugMap.get(drugId);
    if (!drug) continue;

    // Filter active and sort by expiry ascending (earliest first - FEFO)
    const sortedActive = drugBatches
      .filter(b => b.status === 'active')
      .sort((a, b) => a.expiry.localeCompare(b.expiry));

    let unitsAlreadyConsumed = 0;
    const activeAnalysisMap = new Map<string, { usableQty: number; wasteQty: number; isEarliest: boolean }>();

    for (let i = 0; i < sortedActive.length; i++) {
      const b = sortedActive[i];
      const dte = getDaysToExpiry(b.expiry);
      const isEarliest = i === 0;

      if (dte <= 0) {
        // Expired
        activeAnalysisMap.set(b.id, { usableQty: 0, wasteQty: b.qty, isEarliest });
        continue;
      }

      if (drug.dailyUsage === 0) {
        // Edge case: zero daily usage rate (e.g. emergency antidote)
        // Stock doesn't consume daily, usable until expiry
        activeAnalysisMap.set(b.id, { usableQty: b.qty, wasteQty: 0, isEarliest });
        continue;
      }

      // Section 8.2: usableQty = min(qty, dailyUsage * daysToExpiry - unitsAlreadyConsumedByEarlierBatches), never below 0
      const maxPossible = drug.dailyUsage * dte - unitsAlreadyConsumed;
      const usableQty = Math.max(0, Math.min(b.qty, maxPossible));
      const wasteQty = b.qty - usableQty;

      unitsAlreadyConsumed += usableQty;
      activeAnalysisMap.set(b.id, { usableQty, wasteQty, isEarliest });
    }

    // Now analyze all batches of this drug (including quarantined/recalled)
    for (const b of drugBatches) {
      const supplier = supplierMap.get(b.supplierId) || {
        id: b.supplierId,
        name: 'Standard Supplier',
        leadTimeDays: 4,
        returnWindowDays: 30,
      };

      const daysToExpiry = getDaysToExpiry(b.expiry);
      const expiryStatus = getExpiryStatus(daysToExpiry, drug, b.status);

      let usableQty = 0;
      let wasteQty = b.qty;
      let isEarliestBatch = false;

      if (b.status === 'active' && activeAnalysisMap.has(b.id)) {
        const calc = activeAnalysisMap.get(b.id)!;
        usableQty = calc.usableQty;
        wasteQty = calc.wasteQty;
        isEarliestBatch = calc.isEarliest;
      }

      const wasteValue = wasteQty * drug.unitCost;

      // Section 8.3 Recommended Action per batch:
      let recommendedAction: ActionType = 'no_action';
      let actionExplanation = '';
      let deadlineDays = daysToExpiry;
      let transferTargetLocation: Location | undefined = undefined;
      let returnByDate: string | undefined = undefined;

      // 1. Expired, recalled or quarantined: Discard.
      if (b.status === 'recalled') {
        recommendedAction = 'discard';
        actionExplanation = `Batch recalled by manufacturer. Quarantine and discard immediately.`;
        deadlineDays = 0;
      } else if (b.status === 'quarantined') {
        recommendedAction = 'discard';
        actionExplanation = `Batch quarantined under quality hold. Discard or resolve QC.`;
        deadlineDays = 0;
      } else if (daysToExpiry <= 0) {
        recommendedAction = 'discard';
        actionExplanation = `Expired ${Math.abs(daysToExpiry)} days ago on ${b.expiry}. Must be removed and incinerated.`;
        deadlineDays = 0;
      } else if (wasteQty === 0) {
        // 2. wasteQty = 0: Use first if it is the earliest batch, otherwise no action.
        if (isEarliestBatch) {
          recommendedAction = 'use_first';
          actionExplanation = `Earliest active expiry. Prioritize dispensing this batch (FEFO).`;
          deadlineDays = daysToExpiry;
        } else {
          recommendedAction = 'no_action';
          actionExplanation = `Healthy stock. Projected to be fully consumed before expiry.`;
          deadlineDays = daysToExpiry;
        }
      } else {
        // wasteQty > 0
        // Check rule 3: another location is short on this drug
        const locStocks = locationStockMap.get(b.drugId);
        let shortLocation: Location | undefined = undefined;

        if (locStocks) {
          const otherLocs: Location[] = (['Main Store', 'Ward A', 'Ward B'] as Location[]).filter(l => l !== b.location);
          for (const loc of otherLocs) {
            const stockInLoc = locStocks.get(loc) || 0;
            // Short if stock in ward is low (e.g. <= 10 units or < 3 days of hospital demand)
            if (stockInLoc < Math.max(5, drug.dailyUsage * 2)) {
              shortLocation = loc;
              break;
            }
          }
        }

        // 3. wasteQty > 0 and another location is short on this drug: Transfer.
        if (shortLocation) {
          recommendedAction = 'transfer';
          transferTargetLocation = shortLocation;
          deadlineDays = Math.max(1, Math.min(daysToExpiry - 2, 7));
          actionExplanation = `${wasteQty} units will expire unused in ${b.location}. Transfer to ${shortLocation} where stock is critical.`;
        }
        // 4. wasteQty > 0 and daysToExpiry > supplier.returnWindowDays: Return to supplier.
        else if (daysToExpiry > supplier.returnWindowDays) {
          recommendedAction = 'return';
          returnByDate = calculateReturnByDate(b.expiry, supplier.returnWindowDays);
          const daysUntilReturnCutoff = daysToExpiry - supplier.returnWindowDays;
          deadlineDays = Math.max(1, daysUntilReturnCutoff);
          actionExplanation = `${wasteQty} units cannot be consumed in time. Eligible for supplier return before ${returnByDate}.`;
        }
        // 5. Otherwise: Use first and flag for review.
        else {
          recommendedAction = 'review';
          deadlineDays = Math.max(1, Math.min(daysToExpiry, 5));
          actionExplanation = `${wasteQty} units will expire unused (past supplier return window). Flag for urgent clinical review / fast-track use.`;
        }
      }

      results.push({
        batch: b,
        drug,
        supplier,
        daysToExpiry,
        expiryStatus,
        usableQty,
        wasteQty,
        wasteValue,
        recommendedAction,
        actionExplanation,
        isEarliestBatch,
        deadlineDays,
        transferTargetLocation,
        returnByDate,
      });
    }
  }

  return results;
}

/**
 * Section 8.5: Today action score & Ranked Action List.
 * score = ₹AtRisk × urgencyFactor × criticalWeight
 * urgencyFactor: 3 if deadline within 3 days, 2 within 7 days, else 1.
 */
export function getTodayActions(analyses: BatchAnalysis[]): TodayAction[] {
  const actions: TodayAction[] = [];

  for (const item of analyses) {
    if (item.recommendedAction === 'no_action') continue;

    const criticalWeight = item.drug.critical ? 2 : 1;
    let urgencyFactor = 1;
    if (item.deadlineDays <= 3) {
      urgencyFactor = 3;
    } else if (item.deadlineDays <= 7) {
      urgencyFactor = 2;
    }

    // For expired items, wasteValue is full batch value
    const rupeesAtRisk = item.wasteValue > 0 ? item.wasteValue : item.batch.qty * item.drug.unitCost;

    // Baseline minimum score for critical or expired to ensure they appear
    const baseRisk = Math.max(rupeesAtRisk, item.recommendedAction === 'discard' ? 500 : 100);
    const score = baseRisk * urgencyFactor * criticalWeight;

    // Compute deadline string
    const deadlineDate = new Date(TODAY + 'T00:00:00');
    deadlineDate.setDate(deadlineDate.getDate() + Math.max(0, item.deadlineDays));
    const deadlineFormatted = item.deadlineDays <= 0 ? 'Today (Urgent)' : deadlineDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    actions.push({
      id: `ACT-${item.batch.id}`,
      batchId: item.batch.id,
      drug: item.drug,
      batch: item.batch,
      action: item.recommendedAction,
      why: item.actionExplanation,
      rupeesAtRisk: rupeesAtRisk,
      deadline: deadlineFormatted,
      deadlineDays: item.deadlineDays,
      score,
      urgencyFactor,
      criticalWeight,
      fromLocation: item.batch.location,
      toLocation: item.transferTargetLocation,
      transferQty: item.wasteQty > 0 ? item.wasteQty : item.batch.qty,
      returnByDate: item.returnByDate,
    });
  }

  // Sort by score descending (top urgency and ₹ impact)
  return actions.sort((a, b) => b.score - a.score);
}

/**
 * Section 8.4: Reorder and Procurement Calculation.
 */
export function calculateProcurement(
  drugs: Drug[],
  suppliers: Supplier[],
  batches: Batch[],
  analyses: BatchAnalysis[]
): ProcurementItem[] {
  const supplierMap = new Map(suppliers.map(s => [s.id, s]));
  const drugMap = new Map(drugs.map(d => [d.id, d]));

  // Sum usableStock across active batches per drug (stock that will expire does not count)
  const usableStockMap = new Map<string, number>();
  const wastedStockMap = new Map<string, number>();
  const totalStockMap = new Map<string, number>();

  for (const d of drugs) {
    usableStockMap.set(d.id, 0);
    wastedStockMap.set(d.id, 0);
    totalStockMap.set(d.id, 0);
  }

  for (const a of analyses) {
    if (a.batch.status === 'active') {
      const curUsable = usableStockMap.get(a.drug.id) || 0;
      usableStockMap.set(a.drug.id, curUsable + a.usableQty);

      const curWasted = wastedStockMap.get(a.drug.id) || 0;
      wastedStockMap.set(a.drug.id, curWasted + a.wasteQty);

      const curTotal = totalStockMap.get(a.drug.id) || 0;
      totalStockMap.set(a.drug.id, curTotal + a.batch.qty);
    }
  }

  const items: ProcurementItem[] = [];

  for (const drug of drugs) {
    if (drug.dailyUsage === 0) continue; // edge case: no regular reordering for zero usage drugs

    // Find primary supplier (from first batch or default)
    const drugBatch = batches.find(b => b.drugId === drug.id);
    const supplierId = drugBatch ? drugBatch.supplierId : suppliers[0].id;
    const supplier = supplierMap.get(supplierId) || suppliers[0];

    const usableStock = usableStockMap.get(drug.id) || 0;
    const wastedStock = wastedStockMap.get(drug.id) || 0;
    const totalStock = totalStockMap.get(drug.id) || 0;

    // reorderPoint = dailyUsage * (leadTimeDays + 3)
    const reorderPoint = Math.ceil(drug.dailyUsage * (supplier.leadTimeDays + DEFAULT_SAFETY_DAYS));

    // stockoutDays = usableStock / dailyUsage
    const stockoutDays = drug.dailyUsage > 0 ? +(usableStock / drug.dailyUsage).toFixed(1) : 999;

    // If usableStock <= reorderPoint, reorderQty = dailyUsage * 30 - usableStock
    if (usableStock <= reorderPoint) {
      const reorderQty = Math.max(0, Math.ceil(drug.dailyUsage * DEFAULT_COVER_DAYS - usableStock));
      const orderCost = reorderQty * drug.unitCost;

      // Procurement rank = stockoutRisk * criticalWeight
      // stockoutRisk is higher the smaller stockoutDays - leadTimeDays gets
      const daysMargin = stockoutDays - supplier.leadTimeDays;
      // If daysMargin is negative, we will stock out BEFORE the order arrives!
      const stockoutRisk = Math.max(1, Math.round(50 - daysMargin * 3));
      const criticalWeight = drug.critical ? 2 : 1;
      const procurementRank = stockoutRisk * criticalWeight;

      const stockoutDateObj = new Date(TODAY + 'T00:00:00');
      stockoutDateObj.setDate(stockoutDateObj.getDate() + Math.max(0, Math.floor(stockoutDays)));
      const stockoutDate = stockoutDateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      // Find substitutes
      const substitutes = (drug.substituteIds || [])
        .map(subId => drugMap.get(subId))
        .filter((d): d is Drug => Boolean(d));

      items.push({
        drug,
        supplier,
        usableStock,
        wastedStock,
        totalStock,
        reorderPoint,
        stockoutDays,
        stockoutDate,
        reorderQty,
        orderCost,
        procurementRank,
        stockoutRisk,
        substitutes,
        isEmergencyStockout: stockoutDays <= supplier.leadTimeDays,
      });
    }
  }

  // Sort by procurementRank descending (highest urgency first)
  return items.sort((a, b) => b.procurementRank - a.procurementRank);
}
