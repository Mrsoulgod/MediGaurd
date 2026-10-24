import { Batch, StockBalance } from '../schemas';

export interface BatchFEFOEvaluation {
  batchId: string;
  locationId: string;
  batchCode: string;
  expiresOn: string;
  daysToExpiry: number;
  availableQuantity: number;
  projectedConsumedUnits: number;
  projectedUnconsumedUnits: number;
  projectedAtRiskValuePaise: number;
  allocationRank: number;
  isEligibleForFEFO: boolean;
  ineligibilityReason?: string;
}

/**
 * Pure engine: Simulates First-Expired-First-Out consumption across batches at a specific location.
 * Strictly excludes expired, quarantined, recalled, or blocked batches.
 */
export function evaluateFEFOAllocation(
  batches: Batch[],
  balances: StockBalance[],
  locationId: string,
  dailyDemand: number,
  now: string
): BatchFEFOEvaluation[] {
  const batchMap = new Map<string, Batch>(batches.map(b => [b.id, b]));

  // Get active balances for this location
  const locBalances = balances.filter(b => b.locationId === locationId && b.quantity > 0);

  const evaluations: BatchFEFOEvaluation[] = [];

  // Filter eligible batches and compute daysToExpiry
  const evaluatedItems = locBalances.map(bal => {
    const batch = batchMap.get(bal.batchId);
    if (!batch) {
      return null;
    }

    const expiryDate = new Date(batch.expiresOn + 'T00:00:00Z');
    const nowDate = new Date(now + 'T00:00:00Z');
    const daysToExpiry = Math.ceil((expiryDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));

    let isEligible = true;
    let ineligibilityReason: string | undefined = undefined;

    if (batch.status !== 'ACTIVE') {
      isEligible = false;
      ineligibilityReason = `Batch status is ${batch.status}`;
    } else if (daysToExpiry <= 0) {
      isEligible = false;
      ineligibilityReason = 'Batch is expired';
    }

    return {
      batch,
      balance: bal,
      daysToExpiry,
      isEligible,
      ineligibilityReason,
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  // Sort eligible by earliest expiry first (FEFO)
  const eligibleSorted = evaluatedItems
    .filter(item => item.isEligible)
    .sort((a, b) => a.batch.expiresOn.localeCompare(b.batch.expiresOn));

  // Walk through eligible batches consuming daily demand
  let unitsAlreadyConsumed = 0;

  eligibleSorted.forEach((item, index) => {
    const qty = item.balance.quantity;
    const maxCapacityToExpiry = Math.max(0, Math.floor(dailyDemand * item.daysToExpiry) - unitsAlreadyConsumed);
    const projectedConsumed = Math.min(qty, maxCapacityToExpiry);
    const projectedUnconsumed = Math.max(0, qty - projectedConsumed);
    const projectedAtRiskValuePaise = projectedUnconsumed * item.batch.unitCostPaise;

    unitsAlreadyConsumed += projectedConsumed;

    evaluations.push({
      batchId: item.batch.id,
      locationId,
      batchCode: item.batch.batchCode,
      expiresOn: item.batch.expiresOn,
      daysToExpiry: item.daysToExpiry,
      availableQuantity: qty,
      projectedConsumedUnits: projectedConsumed,
      projectedUnconsumedUnits: projectedUnconsumed,
      projectedAtRiskValuePaise,
      allocationRank: index + 1,
      isEligibleForFEFO: true,
    });
  });

  // Append ineligible items (e.g. expired or quarantined)
  evaluatedItems.filter(item => !item.isEligible).forEach(item => {
    evaluations.push({
      batchId: item.batch.id,
      locationId,
      batchCode: item.batch.batchCode,
      expiresOn: item.batch.expiresOn,
      daysToExpiry: item.daysToExpiry,
      availableQuantity: item.balance.quantity,
      projectedConsumedUnits: 0,
      projectedUnconsumedUnits: item.balance.quantity,
      projectedAtRiskValuePaise: item.balance.quantity * item.batch.unitCostPaise,
      allocationRank: 999,
      isEligibleForFEFO: false,
      ineligibilityReason: item.ineligibilityReason,
    });
  });

  return evaluations;
}
