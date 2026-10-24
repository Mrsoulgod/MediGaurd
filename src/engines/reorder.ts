export interface ReorderCalculationInput {
  usableOnHandStock: number; // strictly active & unexpired stock
  dailyUsage: number;
  leadTimeDays: number;
  safetyStockDays: number;
  targetCoverageDays: number;
  incomingApprovedTransfers: number; // approved transfers ONLY (never pending)
  incomingOrderedProcurement: number; // ordered procurement awaiting receipt
  packageSize: number;
  nowDateStr: string;
}

export interface ReorderCalculationResult {
  effectiveSupply: number;
  reorderThresholdUnits: number;
  coverageDays: number;
  projectedStockoutDate: string;
  isBelowReorder: boolean;
  suggestedQty: number;
  isEmergencyStockout: boolean; // coverageDays <= leadTimeDays
  calculationTerms: {
    usableOnHand: number;
    approvedTransfers: number;
    orderedIncoming: number;
    leadTimeDays: number;
    safetyStockDays: number;
    targetDays: number;
  };
}

/**
 * Pure engine: Shortage Prediction & Adaptive Reordering (F09).
 * Hard rule: approved inbound transfers count as supply; pending suggestions do NOT.
 */
export function calculateAdaptiveReorder(input: ReorderCalculationInput): ReorderCalculationResult {
  const {
    usableOnHandStock,
    dailyUsage,
    leadTimeDays,
    safetyStockDays,
    targetCoverageDays,
    incomingApprovedTransfers,
    incomingOrderedProcurement,
    packageSize,
    nowDateStr,
  } = input;

  // Effective supply includes approved inbound transfers + ordered POs, strictly excluding pending suggestions
  const effectiveSupply = usableOnHandStock + incomingApprovedTransfers + incomingOrderedProcurement;

  const rate = Math.max(0.1, dailyUsage);
  const coverageDays = +(effectiveSupply / rate).toFixed(1);

  // reorderPoint = dailyUsage * (leadTimeDays + safetyStockDays)
  const reorderThresholdUnits = Math.ceil(rate * (leadTimeDays + safetyStockDays));
  const isBelowReorder = effectiveSupply <= reorderThresholdUnits;

  // target stock = dailyUsage * targetCoverageDays
  let suggestedQty = 0;
  if (isBelowReorder) {
    const rawDeficit = Math.max(0, rate * targetCoverageDays - effectiveSupply);
    const packs = Math.ceil(rawDeficit / Math.max(1, packageSize));
    suggestedQty = packs * Math.max(1, packageSize);
  }

  // Stockout date
  const nowDate = new Date(nowDateStr + 'T00:00:00Z');
  nowDate.setDate(nowDate.getDate() + Math.max(0, Math.floor(coverageDays)));
  const projectedStockoutDate = nowDate.toISOString().split('T')[0];

  const isEmergencyStockout = coverageDays <= leadTimeDays;

  return {
    effectiveSupply,
    reorderThresholdUnits,
    coverageDays,
    projectedStockoutDate,
    isBelowReorder,
    suggestedQty,
    isEmergencyStockout,
    calculationTerms: {
      usableOnHand: usableOnHandStock,
      approvedTransfers: incomingApprovedTransfers,
      orderedIncoming: incomingOrderedProcurement,
      leadTimeDays,
      safetyStockDays,
      targetDays: targetCoverageDays,
    },
  };
}

export function formatPaiseINR(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
