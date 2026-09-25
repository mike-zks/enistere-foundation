import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateContract, type Actor, type EffectiveOrganizationContext, type EvidenceRecord } from '../src/index.ts';
import { codes, golden } from './fixtures.ts';

const ai: Actor = { type: 'AI_AGENT', id: 'assistant' };

test('an AI proposal with high confidence is still only a proposal (confidence is never approval)', () => {
  const baseline = golden('RequirementBaseline', 'asteria-requirements');
  assert.equal(baseline.metadata.provenance.origin, 'AI_PROPOSAL');
  delete baseline.metadata.acceptance;
  baseline.metadata.provenance.confidence = 0.99;
  assert.deepEqual(codes(validateContract(baseline).diagnostics), ['AUTHORITY_ACCEPTANCE_MISSING']);
  baseline.metadata.status = 'PROPOSED';
  assert.deepEqual(validateContract(baseline).diagnostics, []);
});

test('only a human, or the system under an approval policy, may exercise DECIDE', () => {
  const byAi = golden('SystemDefinition', 'asteria', 2);
  byAi.metadata.acceptance!.actor = ai;
  assert.deepEqual(codes(validateContract(byAi).diagnostics), ['AUTHORITY_AI_CANNOT_DECIDE']);

  for (const type of ['COMPILER', 'CHECKER', 'OBSERVER'] as const) {
    const document = golden('SystemDefinition', 'asteria', 2);
    document.metadata.acceptance!.actor = { type, id: 'machine' };
    assert.deepEqual(codes(validateContract(document).diagnostics), ['AUTHORITY_ACTOR_CANNOT_DECIDE'], type);
  }

  const automatic = golden('SystemDefinition', 'asteria', 2);
  automatic.metadata.acceptance!.actor = { type: 'SYSTEM', id: 'approval-engine' };
  assert.deepEqual(codes(validateContract(automatic).diagnostics), ['AUTHORITY_SYSTEM_DECISION_WITHOUT_POLICY']);
  automatic.metadata.acceptance!.approvalPolicy = { type: 'ApprovalPolicy', id: 'auto-accept-safe', version: '1' };
  assert.deepEqual(validateContract(automatic).diagnostics, []);
});

test('status and acceptance must tell the same story', () => {
  const rejected = golden('DecisionSet', 'asteria-decisions');
  rejected.metadata.status = 'REJECTED';
  assert.deepEqual(codes(validateContract(rejected).diagnostics), ['AUTHORITY_ACCEPTANCE_INCONSISTENT']);

  const draft = golden('DecisionSet', 'asteria-decisions');
  draft.metadata.status = 'DRAFT';
  assert.deepEqual(codes(validateContract(draft).diagnostics), ['AUTHORITY_ACCEPTANCE_INCONSISTENT']);

  const applied = golden('ChangeRequest', 'asteria-cr-001');
  delete applied.metadata.acceptance;
  assert.deepEqual(codes(validateContract(applied).diagnostics), ['AUTHORITY_ACCEPTANCE_MISSING']);
});

test('a derived contract is computed by the compiler and never accepted', () => {
  const edited = golden('EffectiveOrganizationContext', 'asteria-context');
  edited.metadata.provenance = { origin: 'HUMAN', actor: { type: 'HUMAN', id: 'someone' } };
  assert.deepEqual(codes(validateContract(edited).diagnostics), ['AUTHORITY_DERIVED_NOT_COMPILED']);

  const accepted = golden('EffectiveOrganizationContext', 'asteria-context');
  accepted.metadata.acceptance = { decision: 'ACCEPTED', authority: 'DECIDE', actor: { type: 'HUMAN', id: 'h' }, at: '2026-09-20T10:00:00Z' };
  assert.deepEqual(codes(validateContract(accepted).diagnostics), ['AUTHORITY_ACCEPTANCE_INCONSISTENT']);
});

test('Evidence is produced by VERIFY — never by an AI answer', () => {
  const byAi = golden<EvidenceRecord>('EvidenceRecord', 'asteria-sd2-closure');
  byAi.spec.producedBy = ai;
  byAi.metadata.provenance.actor = ai;
  assert.deepEqual(codes(validateContract(byAi).diagnostics), ['AUTHORITY_AI_CANNOT_VERIFY']);

  const humanMode = golden<EvidenceRecord>('EvidenceRecord', 'asteria-sd2-closure');
  humanMode.spec.checker.mode = 'HUMAN_REVIEW';
  assert.deepEqual(codes(validateContract(humanMode).diagnostics), ['AUTHORITY_ACTOR_CANNOT_VERIFY']);
  humanMode.spec.producedBy = { type: 'HUMAN', id: 'reviewer@asteria.example' };
  humanMode.metadata.provenance.actor = humanMode.spec.producedBy;
  assert.deepEqual(validateContract(humanMode).diagnostics, []);

  const accepted = golden<EvidenceRecord>('EvidenceRecord', 'asteria-sd2-closure');
  accepted.metadata.acceptance = { decision: 'ACCEPTED', authority: 'DECIDE', actor: { type: 'HUMAN', id: 'h' }, at: '2026-09-20T10:00:00Z' };
  assert.deepEqual(codes(validateContract(accepted).diagnostics), ['AUTHORITY_ACCEPTANCE_INCONSISTENT']);
});

test('a waiver is a DECIDE act: an AI or a machine cannot approve it', () => {
  const context = golden<EffectiveOrganizationContext>('EffectiveOrganizationContext', 'asteria-context');
  context.spec.waivers[0]!.approvedBy = ai;
  assert.ok(codes(validateContract(context).diagnostics).includes('AUTHORITY_AI_CANNOT_DECIDE'));
  context.spec.waivers[0]!.approvedBy = { type: 'CHECKER', id: 'c' };
  assert.ok(codes(validateContract(context).diagnostics).includes('AUTHORITY_ACTOR_CANNOT_DECIDE'));
});
