import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../src/domain/mechanics.js', import.meta.url), 'utf8');
const mechanics = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);
const { MechanicState: S, setExdeathMechanic, calculateExdeathEyeActions, calculateChaosAction, calculateFinalCardResults, finalResultLabels, normalizeState, initialState } = mechanics;

function exdeathWith(first, firstState, second, secondState) {
  let exdeath = { ...initialState.exdeath };
  exdeath = setExdeathMechanic(exdeath, first, firstState);
  exdeath = setExdeathMechanic(exdeath, second, secondState);
  return exdeath;
}

assert.deepEqual(calculateExdeathEyeActions(exdeathWith('thunder', S.Circle, 'bomb', S.Circle)), ['away', 'away']);
assert.deepEqual(calculateExdeathEyeActions(exdeathWith('thunder', S.Circle, 'bomb', S.Question)), ['away', 'look']);
assert.deepEqual(calculateExdeathEyeActions(exdeathWith('thunder', S.Question, 'bomb', S.Circle)), ['look', 'away']);
assert.deepEqual(calculateExdeathEyeActions(exdeathWith('thunder', S.Question, 'bomb', S.Question)), ['look', 'look']);

let exdeath = exdeathWith('thunder', S.Circle, 'bomb', S.Question);
assert.deepEqual(exdeath.inputOrder, ['thunder', 'bomb']);
exdeath = setExdeathMechanic(exdeath, 'thunder', S.Question);
assert.deepEqual(exdeath.inputOrder, ['thunder', 'bomb']);
assert.equal(exdeath.thunder, S.Question);
exdeath = setExdeathMechanic(exdeath, 'water', S.Circle);
assert.equal(exdeath.thunder, S.Unset);
assert.equal(exdeath.water, S.Circle);
assert.deepEqual(exdeath.inputOrder, ['bomb', 'water']);

assert.equal(calculateChaosAction('fire', S.Circle), '나가');
assert.equal(calculateChaosAction('fire', S.Question), '그대로');
assert.equal(calculateChaosAction('tsunami', S.Circle), '그대로');
assert.equal(calculateChaosAction('tsunami', S.Question), '나가');

const cases = [
  [S.Circle, S.Circle, ['dodge-all', 'cone-only', 'line-only', 'all-hit']],
  [S.Circle, S.Question, ['cone-only', 'dodge-all', 'all-hit', 'line-only']],
  [S.Question, S.Circle, ['line-only', 'all-hit', 'dodge-all', 'cone-only']],
  [S.Question, S.Question, ['all-hit', 'line-only', 'cone-only', 'dodge-all']],
];
for (const [thunder, blizzard, expected] of cases) {
  assert.deepEqual(calculateFinalCardResults({ thunder, blizzard }).map((card) => card.result), expected);
  assert.deepEqual(calculateFinalCardResults({ thunder, blizzard }).map((card) => finalResultLabels[card.result]), expected.map((key) => finalResultLabels[key]));
}
assert.deepEqual(calculateFinalCardResults({ thunder: S.Circle, blizzard: S.Unset }).map((card) => card.result), [null, null, null, null]);
assert.equal(normalizeState({ schemaVersion: 1, exdeath: { thunder: 'unknown' } }).exdeath.thunder, S.Unset);

console.log('mechanics domain tests passed');
