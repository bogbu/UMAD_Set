import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../src/domain/mechanics.js', import.meta.url), 'utf8');
const mechanics = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);
const { MechanicState: S, ACTION_PRESETS, setExdeathMechanic, calculateExdeathAction, calculateExdeathEyeActions, calculateExdeathEyeText, calculateChaosAction, normalizeState, initialState, buildPartyChatLine } = mechanics;

function exdeathWith(first, firstState, second, secondState) {
  let exdeath = { ...initialState.exdeath };
  exdeath = setExdeathMechanic(exdeath, first, firstState);
  exdeath = setExdeathMechanic(exdeath, second, secondState);
  return exdeath;
}

assert.equal(calculateExdeathAction('water', S.Circle), '쉐어');
assert.equal(calculateExdeathAction('water', S.Question), '산개');
assert.equal(calculateExdeathAction('thunder', S.Circle), '산개');
assert.equal(calculateExdeathAction('thunder', S.Question), '쉐어');
assert.equal(calculateExdeathAction('bomb', S.Circle), '멈춰!');
assert.equal(calculateExdeathAction('bomb', S.Question), '움직여!');
assert.equal(calculateExdeathAction('bomb', S.Unset), '');

assert.deepEqual(calculateExdeathEyeActions(exdeathWith('thunder', S.Circle, 'bomb', S.Circle)), ['away', 'away']);
assert.deepEqual(calculateExdeathEyeActions(exdeathWith('thunder', S.Circle, 'bomb', S.Question)), ['away', 'look']);
assert.deepEqual(calculateExdeathEyeActions(exdeathWith('thunder', S.Question, 'bomb', S.Circle)), ['look', 'away']);
assert.deepEqual(calculateExdeathEyeActions(exdeathWith('thunder', S.Question, 'bomb', S.Circle)).map(calculateExdeathEyeText), ['봐', '보지마']);
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

assert.equal(calculateChaosAction('debuff', S.Circle), '빠름');
assert.equal(calculateChaosAction('debuff', S.Question), '느림');

assert.equal(calculateChaosAction('fire', S.Circle), '나가');
assert.equal(calculateChaosAction('fire', S.Question), '그대로');
assert.equal(calculateChaosAction('tsunami', S.Circle), '그대로');
assert.equal(calculateChaosAction('tsunami', S.Question), '나가');

assert.equal(normalizeState({ schemaVersion: 1, exdeath: { thunder: 'unknown' } }).exdeath.thunder, S.Unset);

assert.equal(ACTION_PRESETS.alternate.name, '마안/기믹명');
assert.equal(calculateExdeathAction('bomb', S.Circle, 'alternate'), '멈춰');
assert.equal(calculateExdeathAction('water', S.Circle, 'alternate'), '쉐어');
assert.equal(calculateChaosAction('fire', S.Circle, 'alternate'), '채리엇');
assert.equal(calculateChaosAction('fire', S.Question, 'alternate'), '도넛');
assert.equal(calculateChaosAction('tsunami', S.Circle, 'alternate'), '도넛');
assert.equal(calculateChaosAction('tsunami', S.Question, 'alternate'), '채리엇');
assert.equal(calculateChaosAction('debuff', S.Circle, 'alternate'), '산개');
assert.equal(calculateChaosAction('debuff', S.Question, 'alternate'), '쉐어');

assert.equal(buildPartyChatLine(['봐', '나가', '보지마', '나가']), '/p 봐 > 나가 > 보지마 > 나가');

console.log('mechanics domain tests passed');
