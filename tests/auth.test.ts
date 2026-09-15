import assert from 'node:assert/strict';
import test from 'node:test';

import { actorName, type Partner } from '../lib/types.ts';

const partners: Partner[] = [
  {
    id: 'christian',
    name: 'Christian Krikorian',
    share: 5000,
    archived: 0,
    version: 1,
    email: 'christian@iconic.test',
    has_password: 1,
  },
  { id: 'ivan', name: 'Ivan', share: 5000, archived: 0, version: 1 },
];

test('actorName resolves the partner or stays empty for legacy rows', () => {
  assert.equal(actorName(partners, 'christian'), 'Christian Krikorian');
  assert.equal(actorName(partners, 'ivan'), 'Ivan');
  assert.equal(actorName(partners, ''), '');
  assert.equal(actorName(partners), '');
  assert.equal(actorName(partners, 'missing'), '');
});
