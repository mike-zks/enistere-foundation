import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyChanges,
  validateContract,
  verifyChangeBase,
  type ChangeRequest,
  type DecisionSet,
  type DomainContract,
  type EvidenceRecord,
  type RequirementBaseline,
  type SystemDefinition,
} from '../src/index.ts';
import { codes, golden } from './fixtures.ts';

const check = (document: unknown) => codes(validateContract(document).diagnostics);

// ── A1 ────────────────────────────────────────────────────────────────────
test('A1 keeps provenance, references and decisions honest', () => {
  const unknownSource = golden<RequirementBaseline>('RequirementBaseline', 'asteria-requirements');
  unknownSource.spec.requirements[0]!.sourceRefs = [{ source: 'SRC-NOPE' }];
  assert.deepEqual(check(unknownSource), ['REQUIREMENT_UNKNOWN_SOURCE']);

  const inferred = golden<RequirementBaseline>('RequirementBaseline', 'asteria-requirements');
  inferred.metadata.status = 'PROPOSED';
  delete inferred.metadata.acceptance;
  inferred.spec.requirements[0]!.status = 'INFERRED';
  delete inferred.spec.requirements[0]!.sourceRefs;
  assert.deepEqual(check(inferred), ['REQUIREMENT_WITHOUT_PROVENANCE']);

  const undecided = golden<RequirementBaseline>('RequirementBaseline', 'asteria-requirements');
  undecided.spec.requirements[1]!.status = 'PROPOSED';
  assert.deepEqual(check(undecided), ['REQUIREMENT_NOT_DECIDED']);

  const blocking = golden<RequirementBaseline>('RequirementBaseline', 'asteria-requirements');
  blocking.spec.ambiguities[0]!.impact = 'BLOCKING';
  blocking.spec.ambiguities[0]!.status = 'OPEN';
  assert.deepEqual(check(blocking), ['REQUIREMENT_BLOCKING_AMBIGUITY_OPEN']);

  const cycle = golden<RequirementBaseline>('RequirementBaseline', 'asteria-requirements');
  cycle.spec.requirements.find((item) => item.id === 'FR-003')!.dependsOn = ['FR-004'];
  const cycleDiagnostics = validateContract(cycle).diagnostics;
  assert.deepEqual(codes(cycleDiagnostics), ['REQUIREMENT_DEPENDENCY_CYCLE']);
  assert.deepEqual(cycleDiagnostics[0]?.details, { cycle: ['FR-003', 'FR-004', 'FR-003'] });

  const duplicate = golden<RequirementBaseline>('RequirementBaseline', 'asteria-requirements');
  duplicate.spec.requirements[1]!.id = 'FR-001';
  assert.ok(check(duplicate).includes('CONTRACT_DUPLICATE_ITEM_ID'));

  const unknownActor = golden<RequirementBaseline>('RequirementBaseline', 'asteria-requirements');
  unknownActor.spec.requirements[0]!.actors = ['citizen'];
  assert.deepEqual(check(unknownActor), ['REQUIREMENT_UNKNOWN_REFERENCE']);

  const noCriteria = golden<RequirementBaseline>('RequirementBaseline', 'asteria-requirements');
  delete noCriteria.spec.requirements[0]!.acceptanceCriteria;
  const warnings = validateContract(noCriteria);
  assert.deepEqual(codes(warnings.diagnostics), ['REQUIREMENT_ACCEPTED_WITHOUT_CRITERIA']);
  assert.equal(warnings.valid, true, 'a warning never blocks');
});

// ── A2 ────────────────────────────────────────────────────────────────────
test('A2 decisions choose among evaluated options and keep alternatives', () => {
  const unknownOption = golden<DecisionSet>('DecisionSet', 'asteria-decisions');
  unknownOption.spec.decisions[0]!.chosenOption = 'OPT-KAFKA';
  assert.deepEqual(check(unknownOption), ['DECISION_UNKNOWN_OPTION']);

  const noRationale = golden<DecisionSet>('DecisionSet', 'asteria-decisions');
  delete noRationale.spec.decisions[0]!.rationale;
  assert.deepEqual(check(noRationale), ['DECISION_CHOSEN_OPTION_MISSING']);

  const single = golden<DecisionSet>('DecisionSet', 'asteria-decisions');
  single.spec.decisions[0]!.options = single.spec.decisions[0]!.options.slice(0, 1);
  assert.deepEqual(check(single), ['DECISION_NO_ALTERNATIVE']);

  const proposed = golden<DecisionSet>('DecisionSet', 'asteria-decisions');
  proposed.spec.decisions[1]!.status = 'PROPOSED';
  assert.deepEqual(check(proposed), ['DECISION_NOT_DECIDED']);

  const superseded = golden<DecisionSet>('DecisionSet', 'asteria-decisions');
  superseded.spec.decisions[1]!.supersedes = 'AD-999';
  assert.deepEqual(check(superseded), ['DECISION_UNKNOWN_SUPERSEDED']);
});

// ── A4 ────────────────────────────────────────────────────────────────────
test('A4 relations, data ownership, integrations and environments are coherent', () => {
  const unknown = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  unknown.spec.components[0]!.consumes![0]!.component = 'billing-api';
  assert.deepEqual(check(unknown), ['SYSTEM_UNKNOWN_COMPONENT']);

  const self = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  self.spec.components[0]!.consumes![0]!.component = 'requester-web';
  assert.deepEqual(check(self), ['SYSTEM_SELF_DEPENDENCY']);

  const twoOwners = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  twoOwners.spec.components.find((component) => component.id === 'async-worker')!.data = [{ store: 'asteria-db', access: 'OWNER' }];
  assert.deepEqual(check(twoOwners), ['SYSTEM_DATA_OWNER_CONFLICT']);

  const orphan = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  orphan.spec.components.find((component) => component.id === 'authority-api')!.data = [{ store: 'asteria-db', access: 'READ_WRITE' }, { store: 'asteria-objects', access: 'OWNER' }];
  assert.deepEqual(check(orphan), ['SYSTEM_DATA_STORE_WITHOUT_OWNER']);

  const integration = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  integration.spec.components.find((component) => component.id === 'async-worker')!.integrations = ['sms-gateway'];
  assert.deepEqual(check(integration), ['SYSTEM_UNKNOWN_INTEGRATION']);

  const environment = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  environment.spec.components[0]!.environments = ['preprod'];
  assert.deepEqual(check(environment), ['SYSTEM_UNKNOWN_ENVIRONMENT']);
});

test('A4 accepts any component kind: the kernel hardcodes no runtime nor application catalogue', () => {
  const extended = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  extended.spec.components.push({
    id: 'edge-gateway', name: 'Edge gateway', kind: 'edge-function', audience: 'PUBLIC',
    responsibilities: ['Caches public request status pages.'],
    consumes: [{ component: 'authority-api', interaction: 'SYNC_REQUEST' }],
    runtime: { preferences: ['some-future-runtime'] },
    ownership: { class: 'COMPILER_OWNED', team: 'asteria-web' },
  });
  assert.deepEqual(validateContract(extended).diagnostics, []);
});

// ── A5 ────────────────────────────────────────────────────────────────────
test('A5 types, operations, invariants, events and facets resolve inside the contract', () => {
  const unknownType = golden<DomainContract>('DomainContract', 'asteria-service-requests');
  unknownType.spec.types[0]!.fields![3]!.type = 'Category';
  assert.deepEqual(check(unknownType), ['DOMAIN_UNKNOWN_TYPE']);

  const listType = golden<DomainContract>('DomainContract', 'asteria-service-requests');
  listType.spec.operations[2]!.output = 'list<Request>';
  assert.deepEqual(check(listType), ['DOMAIN_UNKNOWN_TYPE']);

  const unknownEvent = golden<DomainContract>('DomainContract', 'asteria-service-requests');
  unknownEvent.spec.operations[0]!.emits = ['AttachmentDeleted'];
  assert.deepEqual(check(unknownEvent), ['DOMAIN_UNKNOWN_EVENT']);

  const unknownInvariant = golden<DomainContract>('DomainContract', 'asteria-service-requests');
  unknownInvariant.spec.operations[0]!.invariants = ['INV-042'];
  assert.deepEqual(check(unknownInvariant), ['DOMAIN_UNKNOWN_INVARIANT']);

  const unknownOperation = golden<DomainContract>('DomainContract', 'asteria-service-requests');
  unknownOperation.spec.acceptance[0]!.operations = ['delete-request'];
  assert.deepEqual(check(unknownOperation), ['DOMAIN_UNKNOWN_OPERATION']);

  const shape = golden<DomainContract>('DomainContract', 'asteria-service-requests');
  shape.spec.types.find((type) => type.id === 'Priority')!.fields = [{ name: 'x', type: 'string', required: true }];
  assert.deepEqual(check(shape), ['DOMAIN_INVALID_TYPE_SHAPE']);

  const field = golden<DomainContract>('DomainContract', 'asteria-service-requests');
  field.spec.types[0]!.fields!.push({ name: 'id', type: 'uuid', required: true });
  assert.deepEqual(check(field), ['CONTRACT_DUPLICATE_ITEM_ID']);

  const facet = golden<DomainContract>('DomainContract', 'asteria-service-requests');
  facet.spec.facets[0]!.appliesTo = ['sync-everything'];
  assert.deepEqual(check(facet), ['DOMAIN_UNKNOWN_TYPE']);
});

// ── A6 ────────────────────────────────────────────────────────────────────
test('A6 classification bounds what a change may do; UNSUPPORTED never proceeds', () => {
  const unsupported = golden<ChangeRequest>('ChangeRequest', 'asteria-cr-002');
  unsupported.metadata.status = 'ACCEPTED';
  unsupported.metadata.acceptance = { decision: 'ACCEPTED', authority: 'DECIDE', actor: { type: 'HUMAN', id: 'h' }, at: '2026-09-23T10:00:00Z' };
  assert.deepEqual(check(unsupported), ['CHANGE_UNSUPPORTED_CANNOT_PROCEED']);

  const migration = golden<ChangeRequest>('ChangeRequest', 'asteria-cr-001');
  migration.spec.classification = 'MIGRATION_REQUIRED';
  assert.deepEqual(check(migration), ['CHANGE_MIGRATION_MISSING']);
  migration.spec.impact.migration = { strategy: 'Drain the upload queue before switching.', reversible: true };
  assert.deepEqual(check(migration), []);

  const manual = golden<ChangeRequest>('ChangeRequest', 'asteria-cr-001');
  manual.spec.classification = 'MANUAL_ONLY';
  manual.spec.impact.ownerWork = [];
  assert.deepEqual(check(manual), ['CHANGE_OWNER_WORK_MISSING']);

  const target = golden<ChangeRequest>('ChangeRequest', 'asteria-cr-001');
  target.spec.proposed = { ...target.spec.proposed!, revision: 1 };
  assert.deepEqual(check(target), ['CHANGE_TARGET_MISMATCH']);

  const metadataPath = golden<ChangeRequest>('ChangeRequest', 'asteria-cr-001');
  metadataPath.spec.changes[0]!.path = '/metadata/status';
  assert.deepEqual(check(metadataPath), ['CONTRACT_SCHEMA_VIOLATION']);
});

test('A6 changes apply as RFC 6901 operations and a moved base is detected', () => {
  const change = golden<ChangeRequest>('ChangeRequest', 'asteria-cr-001');
  const base = golden<SystemDefinition>('SystemDefinition', 'asteria', 1);
  const proposed = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  const applied = applyChanges(base, change.spec.changes);
  assert.equal(applied.error, null);
  assert.deepEqual(applied.document?.spec, proposed.spec);
  assert.notDeepEqual(base.spec, proposed.spec, 'input not mutated');

  const bad = applyChanges(base, [{ op: 'REPLACE', path: '/spec/components/99/name', value: 'x', rationale: 'r' }]);
  assert.equal(bad.error?.index, 0);
  const duplicateAdd = applyChanges(base, [{ op: 'ADD', path: '/spec/purpose', value: 'x', rationale: 'r' }]);
  assert.match(duplicateAdd.error?.reason ?? '', /existing member/);

  assert.deepEqual(verifyChangeBase(change, base), []);
  assert.deepEqual(codes(verifyChangeBase(change, proposed)), ['CHANGE_BASE_STALE']);
  const edited = structuredClone(base);
  edited.spec.purpose = 'Something else.';
  assert.deepEqual(codes(verifyChangeBase(change, edited)), ['CHANGE_BASE_STALE']);
  assert.deepEqual(codes(verifyChangeBase(change, golden('DecisionSet', 'asteria-decisions'))), ['CHANGE_TARGET_MISMATCH']);
});

// ── A7 ────────────────────────────────────────────────────────────────────
test('A7 records keep time, invalidation and secrets straight', () => {
  const expiry = golden<EvidenceRecord>('EvidenceRecord', 'asteria-sd2-closure');
  expiry.spec.expiresAt = expiry.spec.observedAt;
  assert.deepEqual(check(expiry), ['EVIDENCE_EXPIRY_BEFORE_OBSERVATION']);

  const invalidated = golden<EvidenceRecord>('EvidenceRecord', 'asteria-sd2-closure');
  invalidated.metadata.status = 'INVALIDATED';
  assert.deepEqual(check(invalidated), ['EVIDENCE_INVALIDATION_MISSING']);

  // Synthetic credentials, assembled at runtime so that no credential-looking literal is committed.
  const userinfo = ['user', 'not-a-secret'].join(':');
  for (const uri of [`https://${userinfo}@ci.example/log`, 's3://bucket/report.json?X-Amz-Signature=abc', 'https://ci.example/log?token=abc']) {
    const secret = golden<EvidenceRecord>('EvidenceRecord', 'asteria-sd2-closure');
    secret.spec.artifacts = [{ uri, mediaType: 'text/plain' }];
    assert.deepEqual(check(secret), ['EVIDENCE_SECRET_IN_URI'], uri);
  }
  const clean = golden<EvidenceRecord>('EvidenceRecord', 'asteria-sd2-closure');
  clean.spec.artifacts = [{ uri: 'https://ci.example/runs/42/report.json', mediaType: 'application/json' }];
  assert.deepEqual(check(clean), []);

  const waiver = golden<EvidenceRecord>('EvidenceRecord', 'asteria-sd2-closure');
  waiver.spec.waiver = { context: { kind: 'EffectiveOrganizationContext', id: 'asteria-context', revision: 1, digest: `sha256:${'0'.repeat(64)}` }, waiver: 'W-001' };
  assert.deepEqual(check(waiver), ['EVIDENCE_WAIVER_WITHOUT_FAILURE']);
});
