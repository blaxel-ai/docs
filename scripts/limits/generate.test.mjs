// Run with `npm test`.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { scanRules } from './generate.mjs';

const data = JSON.parse(readFileSync(new URL('../../data/limits.json', import.meta.url), 'utf8'));
const rule = (id) => scanRules(data).find((r) => r.id === id);

test('ttl-minimum accepts each minimum stated for its own policy', () => {
  const { check } = rule('ttl-minimum');
  assert.deepEqual(check('The minimum value for ttl and ttl-max-age is 5m, and for ttl-idle it is 60s.'), []);
  assert.deepEqual(check('On every tier, ttl and ttl-max-age must be at least 5m, and ttl-idle at least 1m.'), []);
  assert.deepEqual(check('Shorter values are rejected, such as ttl 1m is too short: the minimum is 5m.'), []);
});

test('ttl-minimum rejects minimums swapped between policies', () => {
  const { check } = rule('ttl-minimum');
  assert.equal(check('The minimum value for ttl and ttl-max-age is 60s, and for ttl-idle it is 5m.').length, 2);
  assert.equal(check('ttl-idle must be at least 5m.').length, 1);
});
