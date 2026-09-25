import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  collectRefs,
  contractDigest,
  pinnedRef,
  validateContractSet,
  type AnyContract,
  type ChangeRequest,
  type DecisionSet,
  type DomainContract,
  type EvidenceRecord,
  type SystemDefinition,
} from '../src/index.ts';
import { codes, golden, loadGolden, withReplaced } from './fixtures.ts';

const setCodes = (documents: readonly unknown[]) => codes(validateContractSet(documents).diagnostics);

test('the committed Asteria set is closed, pinned and valid with no warning', () => {
  const validation = validateContractSet(loadGolden());
  assert.deepEqual(validation.diagnostics, []);
  assert.equal(validation.valid, true);
  assert.equal(validation.system, 'asteria');
  assert.equal(validation.entries.length, 20);
});

test('the set is closed under references: a missing revision is reported, never assumed', () => {
  const withoutContext = loadGolden().filter((document) => document.kind !== 'EffectiveOrganizationContext');
  assert.deepEqual(setCodes(withoutContext), ['REF_UNRESOLVED']);
});

test('a pinned digest detects any edit of the referenced revision', () => {
  const edited = golden<DecisionSet>('DecisionSet', 'asteria-decisions');
  edited.spec.decisions[0]!.rationale = 'Changed after acceptance.';
  const diagnostics = validateContractSet(withReplaced(edited)).diagnostics;
  assert.deepEqual(codes(diagnostics), ['REF_DIGEST_MISMATCH']);
  assert.ok(diagnostics.every((item) => item.path?.endsWith('/digest')));
  // A lifecycle transition is not an edit: it keeps every pin valid.
  const superseded = golden<DecisionSet>('DecisionSet', 'asteria-decisions');
  superseded.metadata.status = 'SUPERSEDED';
  assert.equal(contractDigest(superseded), contractDigest(golden('DecisionSet', 'asteria-decisions')));
});

test('item references (#item) must exist in the referenced revision', () => {
  const change = golden<ChangeRequest>('ChangeRequest', 'asteria-cr-001');
  change.spec.justifiedBy[0] = { ...change.spec.justifiedBy[0]!, item: 'NFR-404' };
  // Re-pinning is impossible without changing the change itself: its own digest moves too.
  const documents = withReplaced(change).map((document) =>
    document.kind === 'EvidenceRecord' && document.spec.invalidation ? { ...document, spec: { ...document.spec, invalidation: { ...document.spec.invalidation, by: pinnedRef(change) } } } : document,
  );
  assert.ok(setCodes(documents).includes('REF_ITEM_UNRESOLVED'));
});

test('references must point to the expected kind of contract', () => {
  const definition = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  definition.spec.inputs.decisionSet = pinnedRef(golden('RequirementBaseline', 'asteria-requirements'));
  assert.ok(setCodes(withReplaced(definition)).includes('REF_KIND_MISMATCH'));
});

test('an accepted contract cannot rest on an unaccepted input', () => {
  const domain = golden<DomainContract>('DomainContract', 'asteria-service-requests');
  domain.metadata.status = 'PROPOSED';
  delete domain.metadata.acceptance;
  // Re-pin the dependents on this new content so that only the acceptance rule speaks.
  const documents = loadGolden().map((document) => (document.kind === 'DomainContract' ? domain : document));
  const repinned = JSON.parse(JSON.stringify(documents).replaceAll(contractDigest(golden('DomainContract', 'asteria-service-requests')), contractDigest(domain))) as AnyContract[];
  const found = setCodes(repinned);
  assert.ok(found.includes('REF_NOT_ACCEPTED'), found.join());
});

test('duplicates and mixed systems are rejected', () => {
  const documents = loadGolden();
  assert.deepEqual(setCodes([...documents, documents[0]]), ['REF_DUPLICATE_CONTRACT']);
  const other = golden<DecisionSet>('DecisionSet', 'asteria-decisions');
  other.metadata.id = 'other-decisions';
  other.spec.system = 'other';
  assert.ok(setCodes([...documents, other]).includes('REF_SYSTEM_MISMATCH'));
});

test('traceability: drivers, allocations and domain items resolve across contracts', () => {
  const decisions = golden<DecisionSet>('DecisionSet', 'asteria-decisions');
  decisions.spec.decisions[0]!.drivers = ['FR-404'];
  const repinned = (replacement: AnyContract, original: AnyContract) =>
    JSON.parse(JSON.stringify(withReplaced(replacement)).replaceAll(contractDigest(original), contractDigest(replacement))) as AnyContract[];
  assert.ok(setCodes(repinned(decisions, golden('DecisionSet', 'asteria-decisions'))).includes('DECISION_UNKNOWN_REQUIREMENT'));

  const definition = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  const worker = definition.spec.components.find((component) => component.id === 'async-worker')!;
  worker.subscribes = ['asteria-service-requests#RequestArchived'];
  assert.ok(setCodes(withReplaced(definition)).includes('SYSTEM_UNKNOWN_DOMAIN_ITEM'));

  const noProvider = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  const api = noProvider.spec.components.find((component) => component.id === 'authority-api')!;
  api.implements = api.implements!.filter((item) => !item.endsWith('#escalate-request'));
  assert.ok(setCodes(withReplaced(noProvider)).includes('SYSTEM_OPERATION_WITHOUT_PROVIDER'));

  const noProducer = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  const producer = noProducer.spec.components.find((component) => component.id === 'authority-api')!;
  producer.implements = producer.implements!.filter((item) => !item.endsWith('#upload-attachment'));
  for (const component of noProducer.spec.components) {
    for (const consumed of component.consumes ?? []) {
      if (consumed.operations) consumed.operations = consumed.operations.filter((item) => !item.endsWith('#upload-attachment'));
    }
  }
  assert.ok(setCodes(withReplaced(noProducer)).includes('SYSTEM_EVENT_WITHOUT_PRODUCER'));

  const uncovered = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  uncovered.spec.components.find((component) => component.id === 'async-worker')!.requirements = ['FR-005', 'NFR-001', 'SEC-002'];
  const validation = validateContractSet(withReplaced(uncovered));
  assert.ok(codes(validation.diagnostics).includes('SYSTEM_REQUIREMENT_UNCOVERED'));
});

test('a change request on a superseded base is stale; declared changes must match the proposed revision', () => {
  const stale = golden<ChangeRequest>('ChangeRequest', 'asteria-cr-002');
  stale.spec.base = pinnedRef(golden('SystemDefinition', 'asteria', 1));
  assert.ok(setCodes(withReplaced(stale)).includes('CHANGE_BASE_STALE'));

  const inconsistent = golden<ChangeRequest>('ChangeRequest', 'asteria-cr-001');
  inconsistent.spec.changes = inconsistent.spec.changes.slice(1);
  const documents = JSON.parse(
    JSON.stringify(withReplaced(inconsistent)).replaceAll(contractDigest(golden('ChangeRequest', 'asteria-cr-001')), contractDigest(inconsistent)),
  ) as AnyContract[];
  assert.ok(setCodes(documents).includes('CHANGE_INCONSISTENT'));

  const impact = golden<ChangeRequest>('ChangeRequest', 'asteria-cr-002');
  impact.spec.impact.components = ['payments-api'];
  assert.ok(setCodes(withReplaced(impact)).includes('CHANGE_UNKNOWN_COMPONENT'));
});

test('Evidence about a revision that is no longer in force is reported stale', () => {
  const documents = loadGolden().filter((document) => !(document.kind === 'EvidenceRecord' && document.spec.invalidation));
  const found = validateContractSet(documents).diagnostics.filter((item) => item.code === 'EVIDENCE_STALE');
  assert.deepEqual(found.map((item) => item.ref).sort(), [
    'EvidenceRecord/asteria-sd1-closure@1',
    'EvidenceRecord/asteria-sd1-legacy-materialization@1',
    'EvidenceRecord/asteria-sd1-requirement-allocation@1',
    'EvidenceRecord/asteria-sd1-worker-extensibility@1',
  ]);
  assert.ok(found.every((item) => item.severity === 'warning' && item.class === 'EVIDENCE_INCONCLUSIVE'));
});

test('an invalidated record keeps its history: the first revision is never rewritten', () => {
  const first = golden<EvidenceRecord>('EvidenceRecord', 'asteria-sd1-closure', 1);
  const second = golden<EvidenceRecord>('EvidenceRecord', 'asteria-sd1-closure', 2);
  assert.equal(first.metadata.status, 'VALID');
  assert.equal(second.metadata.status, 'INVALIDATED');
  assert.deepEqual(second.metadata.supersedes, pinnedRef(first));
  assert.deepEqual({ ...second.spec, invalidation: undefined }, { ...first.spec, invalidation: undefined });
  assert.equal(second.spec.invalidation?.by.id, 'asteria-cr-001');
});

test('collectRefs finds every stable reference with its JSON Pointer', () => {
  const refs = collectRefs(golden('SystemDefinition', 'asteria', 2));
  assert.deepEqual(
    refs.map((found) => found.path),
    [
      '/metadata/provenance/derivedFrom/0',
      '/metadata/provenance/derivedFrom/1',
      '/metadata/provenance/derivedFrom/2',
      '/metadata/supersedes',
      '/spec/inputs/decisionSet',
      '/spec/inputs/domainContracts/0',
      '/spec/inputs/organizationContext',
      '/spec/inputs/requirementBaseline',
    ],
  );
});
