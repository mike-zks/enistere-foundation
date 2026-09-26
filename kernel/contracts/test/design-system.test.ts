import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveDesignTokens, validateContract, validateContractSet, validateTokens, type DesignSystem, type SystemDefinition } from '../src/index.ts';
import { codes, golden, loadGolden } from './fixtures.ts';

const check = (document: unknown) => codes(validateContract(document).diagnostics);
const design = (): DesignSystem => structuredClone(golden<DesignSystem>('DesignSystem', 'operator-design-system'));

test('the golden design system is a valid, human-accepted A9 contract', () => {
  assert.deepEqual(check(design()), []);
  const proposed = design();
  proposed.metadata.provenance = { origin: 'AI_PROPOSAL', actor: { type: 'AI_AGENT', id: 'assistant' } };
  proposed.metadata.acceptance = { decision: 'ACCEPTED', authority: 'DECIDE', actor: { type: 'AI_AGENT', id: 'assistant' }, at: '2026-09-15T09:00:00Z' };
  assert.ok(check(proposed).includes('AUTHORITY_AI_CANNOT_DECIDE'), 'an AI never accepts a design system');
});

test('token values must match their type; aliases must resolve to the same type, without cycle', () => {
  const bad = design();
  const tokens = bad.spec.tokens as Record<string, Record<string, unknown>>;
  (tokens.color as Record<string, Record<string, unknown>>).brand!.primary = { $type: 'color', $value: 'navy' };
  assert.ok(check(bad).includes('DESIGN_TOKEN_INVALID_VALUE'));
  assert.deepEqual(codes(validateTokens({ a: { $type: 'color', $value: '{b}' } }, 'x')), ['DESIGN_TOKEN_UNRESOLVED_ALIAS']);
  assert.deepEqual(codes(validateTokens({ a: { $type: 'color', $value: '{b}' }, b: { $type: 'dimension', $value: '4px' } }, 'x')), ['DESIGN_TOKEN_TYPE_MISMATCH']);
  assert.deepEqual(codes(validateTokens({ a: { $type: 'color', $value: '{b}' }, b: { $type: 'color', $value: '{a}' } }, 'x')), ['DESIGN_TOKEN_ALIAS_CYCLE']);
  assert.deepEqual(codes(validateTokens({ a: { $type: 'duration', $value: '200ms' }, b: { $type: 'fontWeight', $value: 600 } }, 'x')), []);
});

test('a context only overrides declared tokens, with values of their type', () => {
  const bad = design();
  bad.spec.contexts[0]!.overrides = { 'color.unknown': '#000000' };
  assert.ok(check(bad).includes('DESIGN_CONTEXT_UNKNOWN_TOKEN'));
  bad.spec.contexts[0]!.overrides = { 'font.size.body': 'large' };
  assert.ok(check(bad).includes('DESIGN_TOKEN_INVALID_VALUE'));
});

test('resolution applies the context overrides and resolves aliases', () => {
  const tokens = resolveDesignTokens(design(), 'public-portal');
  assert.deepEqual(tokens['font.size.body'], { type: 'dimension', value: '18px' });
  assert.deepEqual(tokens['color.action.primary'], tokens['color.brand.primary'], 'alias resolved');
  assert.deepEqual(resolveDesignTokens(design(), 'back-office')['font.size.body'], { type: 'dimension', value: '16px' });
  assert.deepEqual(Object.keys(tokens), [...Object.keys(tokens)].sort());
});

test('a surface binds to a design context the pinned design system declares', () => {
  const documents = loadGolden().map((document) => {
    if (document.kind !== 'SystemDefinition' || document.metadata.revision !== 2) return document;
    const copy = structuredClone(document) as SystemDefinition;
    copy.spec.components[0]!.experience!.designContext = 'kiosk';
    return copy;
  });
  assert.ok(codes(validateContractSet(documents).diagnostics).includes('SYSTEM_UNKNOWN_DESIGN_CONTEXT'));
});
