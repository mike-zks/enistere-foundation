import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { AnyContract, DomainContract, SystemDefinition } from '@enistere/foundation-kernel-contracts';

import { buildDomainIR, buildSystemIR, createKernelFacade } from '../src/index.ts';

const GOLDEN = fileURLToPath(new URL('../../../goldens/asteria/', import.meta.url));
const SOURCES = fileURLToPath(new URL('../src/', import.meta.url));

function loadAsteria(): AnyContract[] {
  return ['contracts/', 'evidence/'].flatMap((directory) =>
    readdirSync(`${GOLDEN}${directory}`)
      .sort()
      .map((file) => JSON.parse(readFileSync(`${GOLDEN}${directory}${file}`, 'utf8')) as AnyContract),
  );
}
const domain = (): DomainContract => loadAsteria().find((document) => document.kind === 'DomainContract') as DomainContract;
const definition = (): SystemDefinition =>
  loadAsteria().find((document) => document.kind === 'SystemDefinition' && document.metadata.revision === 2) as SystemDefinition;
const PREFIX = 'DomainContract/asteria-service-requests@1#';

test('the Domain IR resolves types and pins every cross-reference to the contract revision', () => {
  const ir = buildDomainIR(domain());
  assert.equal(ir.contract.ref, 'DomainContract/asteria-service-requests@1');
  assert.deepEqual(ir.types.map((type) => type.id), [...ir.types.map((type) => type.id)].sort());
  const upload = ir.operations.find((operation) => operation.id === 'upload-attachment')!;
  assert.deepEqual(upload.emits, [`${PREFIX}AttachmentUploaded`]);
  assert.equal(upload.input?.type, `${PREFIX}UploadAttachmentInput`);
  assert.equal(upload.idempotent, false, 'defaults are explicit');
  const request = ir.types.find((type) => type.id === 'ServiceRequest')!;
  assert.deepEqual(request.fields.find((field) => field.name === 'id')?.type, { expression: 'uuid', list: false, primitive: 'uuid', type: null });
  assert.ok(ir.invariants.every((invariant) => invariant.appliesTo.every((ref) => ref.startsWith(PREFIX))));
  assert.ok(ir.acceptance.every((scenario) => scenario.operations.every((ref) => ref.startsWith(PREFIX))));
});

test('list types and sensitive fields are kept', () => {
  const edited: DomainContract = structuredClone(domain());
  const type = edited.spec.types.find((candidate) => candidate.kind === 'ENTITY')!;
  type.fields = [...(type.fields ?? []), { name: 'tags', type: 'list<string>', required: false, sensitive: true }];
  const field = buildDomainIR(edited).types.find((candidate) => candidate.id === type.id)!.fields.find((candidate) => candidate.name === 'tags')!;
  assert.deepEqual(field, { name: 'tags', type: { expression: 'list<string>', list: true, primitive: 'string', type: null }, required: false, sensitive: true });
});

test('the Domain IR does not depend on authoring order', () => {
  const reordered: DomainContract = structuredClone(domain());
  reordered.spec.types.reverse();
  reordered.spec.operations.reverse();
  reordered.spec.events.reverse();
  reordered.spec.invariants.reverse();
  reordered.spec.acceptance.reverse();
  reordered.spec.facets.reverse();
  const original = buildDomainIR(domain());
  const shuffled = buildDomainIR(reordered);
  assert.equal(shuffled.digest === original.digest, false, 'the contract digest differs: authoring order is content');
  assert.equal(JSON.stringify({ ...shuffled, contract: null, digest: null }), JSON.stringify({ ...original, contract: null, digest: null }));
});

test('facets are carried but listed as not interpreted — nothing is dropped', () => {
  const ir = buildDomainIR(domain());
  assert.deepEqual(ir.facets.map((facet) => facet.id), ['offline-sync', 'scheduling', 'workflow']);
  assert.deepEqual(ir.unsupported.map((item) => [item.id, item.code]), [
    ['offline-sync', 'IR_FACET_NOT_INTERPRETED'],
    ['scheduling', 'IR_FACET_NOT_INTERPRETED'],
    ['workflow', 'IR_FACET_NOT_INTERPRETED'],
  ]);
});

test('the System IR binds operations and events to components', () => {
  const ir = buildSystemIR(definition(), [domain()]);
  assert.equal(ir.domains.length, 1);
  const submit = ir.operationBindings.find((binding) => binding.item === `${PREFIX}submit-request`)!;
  assert.deepEqual(submit, { item: `${PREFIX}submit-request`, implementedBy: ['authority-api'], consumedBy: ['requester-web'] });
  const status = ir.eventBindings.find((binding) => binding.item === `${PREFIX}RequestStatusChanged`)!;
  assert.deepEqual(status.subscribedBy, ['async-worker']);
  assert.deepEqual(status.publishedBy, ['authority-api'], 'an implementer of an emitting operation publishes the event');
});

test('unrealized domain intent is listed explicitly and makes the compilation PARTIAL', () => {
  const edited: SystemDefinition = structuredClone(definition());
  const api = edited.spec.components.find((component) => component.id === 'authority-api')!;
  api.implements = (api.implements ?? []).filter((item) => !item.endsWith('#triage-request'));
  const ops = edited.spec.components.find((component) => component.id === 'ops-web')!;
  ops.consumes = (ops.consumes ?? []).map((edge) => ({ ...edge, operations: (edge.operations ?? []).filter((item) => !item.endsWith('#triage-request')) }));
  const ir = buildSystemIR(edited, [domain()]);
  assert.ok(ir.unsupported.some((item) => item.item === `${PREFIX}triage-request` && item.code === 'IR_OPERATION_UNIMPLEMENTED'));
  const result = createKernelFacade().plan(loadAsteria());
  assert.equal(result.status, 'PARTIAL');
  assert.deepEqual(result.plan?.unsupportedIntent.map((item) => item.code), ['IR_FACET_NOT_INTERPRETED', 'IR_FACET_NOT_INTERPRETED', 'IR_FACET_NOT_INTERPRETED']);
  assert.ok(result.diagnostics.filter((item) => item.code === 'IR_FACET_NOT_INTERPRETED').every((item) => item.severity === 'warning'));
});

test('only the Domain Contracts pinned by the definition enter the IR', () => {
  const other: DomainContract = structuredClone(domain());
  other.metadata = { ...other.metadata, id: 'another-context' };
  assert.deepEqual(buildSystemIR(definition(), [domain(), other]).domains.map((item) => item.contract.ref), ['DomainContract/asteria-service-requests@1']);
});

test('the Domain IR names no framework (TA-04)', () => {
  assert.doesNotMatch(readFileSync(`${SOURCES}domain-ir.ts`, 'utf8'), /nestjs|spring|fastapi|nextjs|angular|react-native|flutter|postgres|prisma/i);
});
