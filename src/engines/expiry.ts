import { RuleConfig } from '../schemas';

export type ExpiryBand = 'EXPIRED' | 'LE_7D' | 'LE_15D' | 'LE_30D' | 'LE_60D' | 'GT_60D';

export interface ExpiryResult {
  daysToExpiry: number;
  band: ExpiryBand;
  isExpired: boolean;
  isActionable: boolean; // within 60 days
  label: string;
}

/**
 * Pure engine: Computes days to expiry and band against an injected 'now' date.
 * Strictly respects rule configs and hospital timezone.
 */
export function calculateExpiry(
  expiresOn: string,
  now: string,
  ruleConfig: Pick<RuleConfig, 'expiryWarningDaysRed' | 'expiryWarningDaysYellow' | 'expiryWarningDaysNeutral'>
): ExpiryResult {
  const expiryDate = new Date(expiresOn + 'T00:00:00Z');
  const nowDate = new Date(now + 'T00:00:00Z');

  const diffTime = expiryDate.getTime() - nowDate.getTime();
  const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysToExpiry <= 0) {
    return {
      daysToExpiry,
      band: 'EXPIRED',
      isExpired: true,
      isActionable: true,
      label: 'Expired',
    };
  }

  if (daysToExpiry <= 7) {
    return {
      daysToExpiry,
      band: 'LE_7D',
      isExpired: false,
      isActionable: true,
      label: '≤ 7d',
    };
  }

  if (daysToExpiry <= ruleConfig.expiryWarningDaysRed) {
    return {
      daysToExpiry,
      band: 'LE_15D',
      isExpired: false,
      isActionable: true,
      label: `≤ ${ruleConfig.expiryWarningDaysRed}d`,
    };
  }

  if (daysToExpiry <= ruleConfig.expiryWarningDaysYellow) {
    return {
      daysToExpiry,
      band: 'LE_30D',
      isExpired: false,
      isActionable: true,
      label: `≤ ${ruleConfig.expiryWarningDaysYellow}d`,
    };
  }

  if (daysToExpiry <= ruleConfig.expiryWarningDaysNeutral) {
    return {
      daysToExpiry,
      band: 'LE_60D',
      isExpired: false,
      isActionable: true,
      label: `≤ ${ruleConfig.expiryWarningDaysNeutral}d`,
    };
  }

  return {
    daysToExpiry,
    band: 'GT_60D',
    isExpired: false,
    isActionable: false,
    label: '> 60d',
  };
}
