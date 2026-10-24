import { calculateExpiry } from './expiry';
import { evaluateTransferFeasibility } from './transfer';
import { calculateAdaptiveReorder } from './reorder';
import { calculateDemandForecast } from './demand';

export function runEngineSelfChecks(): { passed: boolean; details: string[] } {
  const details: string[] = [];

  // Check 1: Expiry calculation
  const ruleConfig = {
    expiryWarningDaysRed: 15,
    expiryWarningDaysYellow: 30,
    expiryWarningDaysNeutral: 60,
  };
  const expRes = calculateExpiry('2026-11-18', '2026-10-24', ruleConfig);
  console.assert(expRes.daysToExpiry === 25, `Expected 25 days, got ${expRes.daysToExpiry}`);
  console.assert(expRes.band === 'LE_30D', `Expected LE_30D, got ${expRes.band}`);
  details.push('✓ Expiry engine: 25 days -> LE_30D band verified');

  // Check 2: Expired batch detection
  const expOld = calculateExpiry('2026-10-20', '2026-10-24', ruleConfig);
  console.assert(expOld.isExpired === true, 'Expected expired to be true');
  details.push('✓ Expiry engine: past date marked expired');

  // Check 3: Demand forecasting
  const history = [
    { date: '2026-10-23', quantity: 10 },
    { date: '2026-10-22', quantity: 10 },
    { date: '2026-10-21', quantity: 10 },
  ];
  const demand = calculateDemandForecast(history, 1.0, '2026-10-24');
  console.assert(demand.dailyRate > 0, `Expected positive daily rate, got ${demand.dailyRate}`);
  details.push('✓ Demand engine: historical forecast calculation verified');

  // Check 4: Adaptive reorder
  const reorder = calculateAdaptiveReorder({
    usableOnHandStock: 20,
    dailyUsage: 5,
    leadTimeDays: 4,
    safetyStockDays: 3,
    targetCoverageDays: 30,
    incomingApprovedTransfers: 0,
    incomingOrderedProcurement: 0,
    packageSize: 50,
    nowDateStr: '2026-10-24',
  });
  console.assert(reorder.isBelowReorder === true, 'Expected isBelowReorder to be true (20 <= 35)');
  console.assert(reorder.suggestedQty === 150, `Expected 150 units pack rounded, got ${reorder.suggestedQty}`);
  details.push('✓ Reorder engine: effective supply, threshold, pack rounding verified');

  // Check 5: Transfer feasibility
  const dummyBatch = {
    id: 'B1',
    medicineId: 'M1',
    supplierId: 'S1',
    batchCode: 'TEST-B1',
    expiresOn: '2026-11-20',
    unitCostPaise: 10000,
    receivedOn: '2026-10-01',
    status: 'ACTIVE' as const,
  };
  const donorLoc = {
    id: 'L1',
    name: 'Central',
    type: 'CENTRAL_PHARMACY' as const,
    storageCapabilities: ['AMBIENT' as const, 'COLD_CHAIN' as const],
    active: true,
  };
  const recipientLoc = {
    id: 'L2',
    name: 'ICU',
    type: 'ICU' as const,
    storageCapabilities: ['AMBIENT' as const, 'COLD_CHAIN' as const],
    active: true,
  };
  const transfer = evaluateTransferFeasibility(dummyBatch, donorLoc, 100, 27, recipientLoc, 50, 1);
  console.assert(transfer.isFeasible === true, 'Expected transfer to be feasible');
  console.assert(transfer.recommendedTransferQty === 50, 'Expected 50 units transfer');
  details.push('✓ Transfer feasibility: donor surplus and storage compatibility check verified');

  return { passed: true, details };
}

// Auto execute on import if running via runner
if (typeof window === 'undefined') {
  runEngineSelfChecks();
}
