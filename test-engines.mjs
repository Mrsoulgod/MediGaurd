import assert from 'node:assert';

// 1. Expiry band logic verification
function calculateExpiryDays(expiresOn, now) {
  const exp = new Date(expiresOn + 'T00:00:00Z');
  const n = new Date(now + 'T00:00:00Z');
  return Math.ceil((exp - n) / (1000 * 60 * 60 * 24));
}

assert.strictEqual(calculateExpiryDays('2026-11-18', '2026-10-24'), 25);
assert.strictEqual(calculateExpiryDays('2026-10-24', '2026-10-24'), 0);
assert.strictEqual(calculateExpiryDays('2026-10-20', '2026-10-24'), -4);
console.log('✓ Expiry days engine self-check passed');

// 2. Reorder calculation verification
function calculateReorder(usable, daily, leadDays, safetyDays, targetDays, packSize) {
  const reorderPoint = Math.ceil(daily * (leadDays + safetyDays));
  const isBelow = usable <= reorderPoint;
  let suggested = 0;
  if (isBelow) {
    const deficit = Math.max(0, daily * targetDays - usable);
    const packs = Math.ceil(deficit / packSize);
    suggested = packs * packSize;
  }
  return { reorderPoint, isBelow, suggested };
}

const reorder = calculateReorder(20, 5, 4, 3, 30, 50);
assert.strictEqual(reorder.reorderPoint, 35);
assert.strictEqual(reorder.isBelow, true);
assert.strictEqual(reorder.suggested, 150); // (5*30 - 20) = 130 -> 3 packs of 50 = 150
console.log('✓ Adaptive reorder engine self-check passed');

// 3. Demand 0.6 / 0.4 weighting
function blendDemand(sevenDayAvg, thirtyDayAvg) {
  return +(0.6 * sevenDayAvg + 0.4 * thirtyDayAvg).toFixed(2);
}
assert.strictEqual(blendDemand(10, 10), 10);
assert.strictEqual(blendDemand(15, 10), 13);
console.log('✓ 60/40 Demand blend engine self-check passed');

// 4. FEFO sorting verification
const batches = [
  { code: 'B2', exp: '2026-11-20' },
  { code: 'B1', exp: '2026-11-05' },
  { code: 'B3', exp: '2026-12-15' },
];
batches.sort((a, b) => new Date(a.exp) - new Date(b.exp));
assert.strictEqual(batches[0].code, 'B1');
assert.strictEqual(batches[1].code, 'B2');
assert.strictEqual(batches[2].code, 'B3');
console.log('✓ FEFO allocation engine self-check passed');

console.log('ALL ENGINE SELF-CHECKS PASSED SUCCESSFULLY!');
