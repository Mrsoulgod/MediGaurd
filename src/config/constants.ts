/**
 * Single source of truth for the demo date.
 * All date math across ExpiryIQ uses this constant so the demo never drifts or breaks.
 */
export const TODAY = '2026-10-24';

export const LOCATIONS = ['Main Store', 'Ward A', 'Ward B'] as const;

export const DEFAULT_SAFETY_DAYS = 3;
export const DEFAULT_COVER_DAYS = 30;

export const THRESHOLDS = {
  NORMAL: {
    RED: 30,
    AMBER: 90,
  },
  CRITICAL: {
    RED: 60,
    AMBER: 120,
  },
  SHELF_LIFE_RECEIVE_MIN_PERCENT: 70,
};
