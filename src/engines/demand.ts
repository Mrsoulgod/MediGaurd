export interface DailyConsumptionRecord {
  date: string; // YYYY-MM-DD
  quantity: number;
}

export interface DemandForecastResult {
  dailyRate: number;
  confidence: 'HIGH' | 'LOW_DATA_CONFIDENCE';
  sevenDayAvg: number;
  thirtyDayAvg: number;
  appliedMultiplier: number;
  reason: string;
}

/**
 * Pure engine: Department-Wise Demand Forecasting (F08).
 * Uses 0.6 (7-day) / 0.4 (30-day) blend, handles sparse data fallback, and applies adjustments.
 */
export function calculateDemandForecast(
  history: DailyConsumptionRecord[],
  multiplier: number = 1.0,
  nowDateStr: string
): DemandForecastResult {
  if (!history || history.length === 0) {
    return {
      dailyRate: 1, // baseline fallback
      confidence: 'LOW_DATA_CONFIDENCE',
      sevenDayAvg: 1,
      thirtyDayAvg: 1,
      appliedMultiplier: multiplier,
      reason: 'No historical movement data recorded. Using default conservative baseline.',
    };
  }

  const nowDate = new Date(nowDateStr + 'T00:00:00Z');

  // Filter 7-day and 30-day windows relative to now
  const last7Days = history.filter(h => {
    const d = new Date(h.date + 'T00:00:00Z');
    const diff = (nowDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const last30Days = history.filter(h => {
    const d = new Date(h.date + 'T00:00:00Z');
    const diff = (nowDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  // Check data sparsity
  const isSparse = last7Days.length < 3 || last30Days.length < 10;
  const confidence = isSparse ? 'LOW_DATA_CONFIDENCE' : 'HIGH';

  const sum7 = last7Days.reduce((acc, curr) => acc + curr.quantity, 0);
  const avg7 = last7Days.length > 0 ? sum7 / Math.max(last7Days.length, 7) : 0;

  const sum30 = last30Days.reduce((acc, curr) => acc + curr.quantity, 0);
  const avg30 = last30Days.length > 0 ? sum30 / Math.max(last30Days.length, 30) : 0;

  // 0.6 / 0.4 blend
  let baseRate = avg7 * 0.6 + avg30 * 0.4;
  if (baseRate <= 0) {
    baseRate = 1; // minimum meaningful non-zero rate
  }

  const dailyRate = +(baseRate * multiplier).toFixed(2);

  return {
    dailyRate,
    confidence,
    sevenDayAvg: +avg7.toFixed(2),
    thirtyDayAvg: +avg30.toFixed(2),
    appliedMultiplier: multiplier,
    reason: isSparse
      ? 'Sparse historical issue records detected (< 10 recorded days). Tagged with LOW_DATA_CONFIDENCE.'
      : 'Standard 0.6 (7-day) / 0.4 (30-day) weighted blend.',
  };
}
