import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveEffectiveRules, validateContract, type ContextLayer, type EffectiveOrganizationContext } from '../src/index.ts';
import { codes, golden } from './fixtures.ts';

const layer = (id: string, precedence: number, rules: ContextLayer['rules']): ContextLayer => ({
  id,
  scope: 'ORGANIZATION',
  precedence,
  source: { type: 'EntityProfile', id: id.toLowerCase(), version: '1' },
  rules,
});
const human = { type: 'HUMAN' as const, id: 'approver@example.org' };

test('specific layers override general ones and every step stays in the trace', () => {
  const { effective, diagnostics } = deriveEffectiveRules(
    [layer('L-SYSTEM', 20, [{ id: 'quality.coverage.min', category: 'QUALITY', value: 90 }]), layer('L-ORG', 0, [{ id: 'quality.coverage.min', category: 'QUALITY', value: 70 }])],
    [],
  );
  assert.deepEqual(diagnostics, []);
  assert.deepEqual(effective, [
    {
      rule: 'quality.coverage.min',
      category: 'QUALITY',
      value: 90,
      locked: false,
      source: { type: 'LAYER', id: 'L-SYSTEM' },
      trace: [
        { from: 'LAYER', id: 'L-ORG', value: 70, outcome: 'OVERRIDDEN' },
        { from: 'LAYER', id: 'L-SYSTEM', value: 90, outcome: 'APPLIED' },
      ],
    },
  ]);
});

test('a locked rule refuses overrides; only an explicit waiver can except it', () => {
  const layers = [
    layer('L-ORG', 0, [{ id: 'security.identity.provider', category: 'SECURITY', value: 'shared-oidc', locked: true }]),
    layer('L-CLIENT', 10, [{ id: 'security.identity.provider', category: 'SECURITY', value: 'client-idp' }]),
  ];
  const locked = deriveEffectiveRules(layers, []).effective[0]!;
  assert.equal(locked.value, 'shared-oidc');
  assert.deepEqual(locked.trace.map((entry) => entry.outcome), ['APPLIED', 'REFUSED_LOCKED']);

  const waived = deriveEffectiveRules(layers, [
    { id: 'W-1', rule: 'security.identity.provider', value: 'client-idp', reason: 'Pilot.', approvedBy: human, expiresAt: '2027-01-01T00:00:00Z' },
  ]).effective[0]!;
  assert.equal(waived.value, 'client-idp');
  assert.deepEqual(waived.source, { type: 'WAIVER', id: 'W-1' });
  assert.deepEqual(waived.trace.map((entry) => entry.outcome), ['OVERRIDDEN', 'REFUSED_LOCKED', 'WAIVED']);
});

test('derivation is deterministic regardless of the declaration order', () => {
  const a = layer('L-A', 0, [{ id: 'x.a', category: 'DATA', value: 1 }, { id: 'x.b', category: 'DATA', value: [1, 2] }]);
  const b = layer('L-B', 5, [{ id: 'x.b', category: 'DATA', value: [3] }]);
  assert.deepEqual(deriveEffectiveRules([a, b], []), deriveEffectiveRules([b, a], []));
});

test('conflicting precedences, categories and unknown waived rules are reported', () => {
  const precedence = deriveEffectiveRules([layer('L-A', 1, []), layer('L-B', 1, [])], []);
  assert.deepEqual(codes(precedence.diagnostics), ['CONTEXT_DUPLICATE_PRECEDENCE']);
  const category = deriveEffectiveRules([layer('L-A', 0, [{ id: 'x.y', category: 'DATA', value: 1 }]), layer('L-B', 1, [{ id: 'x.y', category: 'SECURITY', value: 2 }])], []);
  assert.deepEqual(codes(category.diagnostics), ['CONTEXT_RULE_CATEGORY_CONFLICT']);
  const unknown = deriveEffectiveRules([layer('L-A', 0, [])], [{ id: 'W', rule: 'x.y', value: 1, reason: 'r', approvedBy: human, expiresAt: '2027-01-01T00:00:00Z' }]);
  assert.deepEqual(codes(unknown.diagnostics), ['CONTEXT_UNKNOWN_RULE']);
});

test('the golden context is exactly the kernel derivation; a hand edit is detected', () => {
  const context = golden<EffectiveOrganizationContext>('EffectiveOrganizationContext', 'asteria-context');
  assert.deepEqual(validateContract(context).diagnostics, []);
  const identity = context.spec.effective.find((rule) => rule.rule === 'security.identity.provider')!;
  assert.equal(identity.value, 'enistere-shared-oidc', 'the client cannot override the locked identity rule');
  assert.deepEqual(identity.trace.map((entry) => entry.outcome), ['APPLIED', 'REFUSED_LOCKED']);
  const residency = context.spec.effective.find((rule) => rule.rule === 'data.residency')!;
  assert.deepEqual(residency.source, { type: 'WAIVER', id: 'W-001' });

  identity.value = 'client-directory';
  assert.deepEqual(codes(validateContract(context).diagnostics), ['CONTEXT_NOT_REPRODUCIBLE']);
});
