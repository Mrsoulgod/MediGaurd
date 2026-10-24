import { Batch, Location, StorageCapability } from '../schemas';

export interface TransferFeasibilityCheck {
  isFeasible: boolean;
  donorSurplusQty: number;
  recipientDeficitQty: number;
  recommendedTransferQty: number;
  projectedValuePreservedPaise: number;
  checks: {
    storageMatch: boolean;
    shelfLifeSufficient: boolean;
    donorSurplusConfirmed: boolean;
    batchActive: boolean;
  };
  reasons: string[];
}

/**
 * Pure engine: Inter-Department Stock Redistribution Feasibility (F11).
 * Verifies storage capability match, shelf life vs transit, donor surplus, and batch eligibility.
 */
export function evaluateTransferFeasibility(
  batch: Batch,
  donorLocation: Location,
  donorProjectedUnused: number,
  daysToExpiry: number,
  recipientLocation: Location,
  recipientDeficit: number,
  estimatedTransitDays: number = 1
): TransferFeasibilityCheck {
  const reasons: string[] = [];

  // Check 1: Batch active
  const batchActive = batch.status === 'ACTIVE' && daysToExpiry > 0;
  if (!batchActive) {
    reasons.push(`Batch ${batch.batchCode} is ${batch.status} or expired.`);
  }

  // Check 2: Donor has real projected surplus
  const donorSurplusConfirmed = donorProjectedUnused > 0;
  if (!donorSurplusConfirmed) {
    reasons.push(`Donor location ${donorLocation.name} has no projected unused surplus.`);
  }

  // Check 3: Storage compatibility
  // If batch requires COLD_CHAIN, recipient location MUST have COLD_CHAIN capability
  let storageMatch = true;
  // If the batch requires cold chain (or donor has cold chain that recipient lacks)
  if (donorLocation.storageCapabilities.includes('COLD_CHAIN') && !recipientLocation.storageCapabilities.includes('COLD_CHAIN')) {
    storageMatch = false;
    reasons.push(`Recipient ${recipientLocation.name} lacks COLD_CHAIN storage capability.`);
  }

  // Check 4: Shelf life sufficient for transit + recipient use
  const shelfLifeSufficient = daysToExpiry > estimatedTransitDays + 3;
  if (!shelfLifeSufficient) {
    reasons.push(`Remaining shelf life (${daysToExpiry}d) is insufficient for safe transit and clinical dispensing.`);
  }

  const isFeasible = batchActive && donorSurplusConfirmed && storageMatch && shelfLifeSufficient && recipientDeficit > 0;

  // Transfer the minimum of donor's surplus and recipient's deficit
  const recommendedTransferQty = isFeasible ? Math.min(donorProjectedUnused, recipientDeficit) : 0;
  const projectedValuePreservedPaise = recommendedTransferQty * batch.unitCostPaise;

  return {
    isFeasible,
    donorSurplusQty: donorProjectedUnused,
    recipientDeficitQty: recipientDeficit,
    recommendedTransferQty,
    projectedValuePreservedPaise,
    checks: {
      storageMatch,
      shelfLifeSufficient,
      donorSurplusConfirmed,
      batchActive,
    },
    reasons,
  };
}
