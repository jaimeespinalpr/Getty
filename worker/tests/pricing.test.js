import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAmountCents, nightsBetween } from '../worker.js';

test('prices beach bookings using the lower of per-person or private-group rate', () => {
  assert.equal(computeAmountCents('exp6h', '2026-11-01', '', 2), 15800);
  assert.equal(computeAmountCents('exp6h', '2026-11-01', '', 6), 45000);
  assert.equal(computeAmountCents('exp8h', '2026-11-01', '', 6), 60000);
});

test('adds one cleaning fee to a multi-night rental', () => {
  assert.equal(computeAmountCents('night', '2026-11-01', '2026-11-04', 2), 40000);
});

test('rejects invalid packages, guest counts, dates and stay lengths', () => {
  assert.equal(computeAmountCents('unknown', '2026-11-01', '', 2), null);
  assert.equal(computeAmountCents('exp6h', '2026-11-01', '', 0), null);
  assert.equal(computeAmountCents('night', '2026-11-01', '2026-11-01', 2), null);
  assert.equal(computeAmountCents('night', '2026-11-01', '2027-01-01', 2), null);
  assert.equal(nightsBetween('2026-11-01', '2026-11-04'), 3);
});
