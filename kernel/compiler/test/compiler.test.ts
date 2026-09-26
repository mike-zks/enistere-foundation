import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { indexContracts, type AnyContract, type SystemDefinition } from '@enistere/foundation-kernel-contracts';

import {
  buildClosure,
  buildSystemIR,
  createKernelFacade,
  EMPTY_CATALOG,
  planSystem,
  resolveSystem,
  validateCatalog,
  type ExtensionCatalog,
} from '../src/index.ts';

const GOLDEN = fileURLToPath(new URL('../../../goldens/asteria/', import.meta.url));
const SOURCES = fileURLToPath(new URL('../src/', import.meta.url));

/** The closed Asteria set: contracts and the evidence they reference. */
function loadAsteria(): AnyContract[] {
  return ['contracts/', 'evidence/'].flatMap((directory) =>
    readdirSync(`${GOLDEN}${directory}`)
      .sort()
      .map((file) => JSON.parse(readFileSync(`${GOLDEN}${directory}${file}`, 'utf8')) as AnyContract),
  );
}
const catalog = (): ExtensionCatalog => JSON.parse(readFileSync(`${GOLDEN}sources/catalog.json`, 'utf8')) as ExtensionCatalog;
const definition = (documents: readonly AnyContract[], revision = 2): SystemDefinition =>
  documents.find((document) => document.kind === 'SystemDefinition' && document.metadata.revision === revision) as SystemDefinition;
const codes = (items: readonly { code: string }[]): string[] => items.map((item) => item.code);

// ── Closure ───────────────────────────────────────────────────────────────
test('the closure holds exactly the normative inputs reachable from the definition', () => {
  const documents = loadAsteria();
  const { closure } = buildClosure(definition(documents), indexContracts(documents), validateCatalog(EMPTY_CATALOG).digest!);
  assert.equal(closure.definition.ref, 'SystemDefinition/asteria@2');
  assert.deepEqual(
    closure.entries.map((entry) => entry.ref),
    ['DecisionSet/asteria-decisions@1', 'DomainContract/asteria-service-requests@1', 'EffectiveOrganizationContext/asteria-context@1', 'RequirementBaseline/asteria-requirements@1'],
    'no superseded revision, Change Request or EvidenceRecord',
  );
  assert.match(closure.digest, /^sha256:[0-9a-f]{64}$/);
});

test('the closure digest changes with any input: definition, catalog or compiler inputs', () => {
  const documents = loadAsteria();
  const index = indexContracts(documents);
  const empty = validateCatalog(EMPTY_CATALOG).digest!;
  const base = buildClosure(definition(documents), index, empty).closure.digest;
  assert.equal(buildClosure(definition(documents), index, empty).closure.digest, base);
  assert.notEqual(buildClosure(definition(documents), index, validateCatalog(catalog()).digest!).closure.digest, base);
  assert.notEqual(buildClosure(definition(documents, 1), index, empty).closure.digest, base);
});

// ── IR ────────────────────────────────────────────────────────────────────
test('the IR is normalized: sorted, explicit defaults, domain items pinned to their revision', () => {
  const ir = buildSystemIR(definition(loadAsteria()));
  assert.deepEqual(ir.components.map((component) => component.id), [...ir.components.map((component) => component.id)].sort());
  const worker = ir.components.find((component) => component.id === 'async-worker')!;
  assert.ok(worker.subscribes.every((item) => item.startsWith('DomainContract/asteria-service-requests@1#')), worker.subscribes.join());
  assert.deepEqual(worker.environments, ['local', 'ci', 'staging', 'production']);
  assert.deepEqual(worker.runtime.preferences, ['nestjs'], 'preferences keep their declared order');
});

test('the IR does not depend on authoring order', () => {
  const current = definition(loadAsteria());
  const reordered: SystemDefinition = structuredClone(current);
  reordered.spec.components.reverse();
  reordered.spec.integrations.reverse();
  assert.equal(buildSystemIR(reordered).digest, buildSystemIR(current).digest);
});

// ── Catalog ───────────────────────────────────────────────────────────────
test('invalid catalogs are refused, never partially used', () => {
  assert.deepEqual(codes(validateCatalog(null).diagnostics), ['CATALOG_INVALID']);
  const bad = { runtimeAdapters: [{ id: 'x', version: 'one', componentKinds: [], runtime: 'r' }], capabilityProviders: [] };
  const badResult = validateCatalog(bad);
  assert.equal(badResult.catalog, null);
  assert.ok(codes(badResult.diagnostics).every((code) => code === 'CATALOG_INVALID'));
  const duplicate = { runtimeAdapters: [{ id: 'a', version: '1.0.0', componentKinds: ['api-service'], runtime: 'r' }, { id: 'a', version: '1.0.0', componentKinds: ['worker'], runtime: 's' }], capabilityProviders: [] };
  assert.deepEqual(codes(validateCatalog(duplicate).diagnostics), ['CATALOG_DUPLICATE_ID']);
  const overlap = { runtimeAdapters: [{ id: 'a', version: '1.0.0', componentKinds: ['api-service'], runtime: 'r' }, { id: 'b', version: '1.0.0', componentKinds: ['api-service'], runtime: 'r' }], capabilityProviders: [] };
  assert.deepEqual(codes(validateCatalog(overlap).diagnostics), ['CATALOG_OVERLAPPING_COVERAGE']);
});

// ── Resolution ────────────────────────────────────────────────────────────
test('with the empty catalog every component is UNSUPPORTED, explicitly', () => {
  const ir = buildSystemIR(definition(loadAsteria()));
  const empty = validateCatalog(EMPTY_CATALOG);
  const { resolved, diagnostics } = resolveSystem(ir, empty.catalog!, empty.digest!);
  assert.equal(resolved.unsupported.length, ir.components.length);
  assert.ok(resolved.components.every((component) => component.status === 'UNSUPPORTED'));
  assert.deepEqual(new Set(codes(diagnostics)), new Set(['RESOLVE_NO_ADAPTER']));
});

test('a skipped preference is traced, and a capability without provider stays UNSUPPORTED', () => {
  const current = definition(loadAsteria());
  const edited: SystemDefinition = structuredClone(current);
  const api = edited.spec.components.find((component) => component.id === 'authority-api')!;
  api.runtime = { preferences: ['unknown-runtime', 'nestjs'] };
  const valid = validateCatalog(catalog());
  const { resolved, diagnostics } = resolveSystem(buildSystemIR(edited), valid.catalog!, valid.digest!);
  const fallback = diagnostics.find((item) => item.code === 'RESOLVE_PREFERENCE_FALLBACK');
  assert.deepEqual(fallback?.details, { component: 'authority-api', skipped: ['unknown-runtime'], selected: 'nestjs' });
  assert.equal(resolved.components.find((component) => component.id === 'authority-api')?.runtime, 'nestjs');
  assert.deepEqual(resolved.unsupported, [
    { component: 'asteria-objects', capability: null, code: 'RESOLVE_NO_ADAPTER' },
    { component: 'async-worker', capability: 'notifications', code: 'RESOLVE_NO_CAPABILITY_PROVIDER' },
  ]);
});

// ── Plan ──────────────────────────────────────────────────────────────────
test('the plan materializes resolved components, connects external ones and keeps unsupported items', () => {
  const documents = loadAsteria();
  const valid = validateCatalog(catalog());
  const ir = buildSystemIR(definition(documents));
  const { closure } = buildClosure(definition(documents), indexContracts(documents), valid.digest!);
  const { resolved } = resolveSystem(ir, valid.catalog!, valid.digest!);
  const plan = planSystem(closure, ir, resolved);
  const step = (component: string) => plan.steps.find((item) => item.component === component && item.action !== 'BIND_CAPABILITY');
  assert.equal(step('authority-api')?.action, 'MATERIALIZE');
  assert.equal(step('asteria-db')?.action, 'CONNECT_EXTERNAL');
  assert.equal(step('asteria-objects'), undefined, 'an unsupported component is never planned');
  assert.equal(step('async-worker')?.action, 'MATERIALIZE', 'the Async Worker is a first-class planned component');
  assert.deepEqual(plan.unsupported, resolved.unsupported);
  assert.ok(plan.ownerWork.some((item) => item.work === 'COMPONENT' && item.component === 'async-worker' && item.ownership === 'OWNER_MANAGED'));
  assert.ok(plan.proofObligations.length > 0);
  assert.deepEqual(plan.inputs, { closure: closure.digest, ir: ir.digest, resolved: resolved.digest });
});

// ── Façade ────────────────────────────────────────────────────────────────
test('the façade compiles Asteria end to end: PARTIAL, with its unsupported items listed', () => {
  const result = createKernelFacade().plan(loadAsteria(), { catalog: catalog() });
  assert.equal(result.status, 'PARTIAL');
  assert.equal(result.definition?.ref, 'SystemDefinition/asteria@2');
  assert.equal(result.plan?.unsupported.length, 2);
  assert.ok(result.diagnostics.every((item) => item.severity === 'warning'));
});

test('an invalid contract set or catalog is never resolved', () => {
  const documents = loadAsteria().map((document) =>
    document.kind === 'SystemDefinition' && document.metadata.revision === 2 ? { ...document, spec: { ...document.spec, purpose: 'tampered after pinning' } } : document,
  );
  const tampered = createKernelFacade().plan(documents, { catalog: catalog() });
  assert.equal(tampered.status, 'INVALID');
  assert.equal(tampered.closure, null);
  assert.equal(tampered.plan, null);
  const badCatalog = createKernelFacade().resolve(loadAsteria(), { catalog: { runtimeAdapters: 'no' } });
  assert.equal(badCatalog.status, 'INVALID');
  assert.equal(badCatalog.resolved, null);
  assert.ok(codes(badCatalog.diagnostics).includes('CATALOG_INVALID'));
});

test('the façade selects the System Definition in force, and refuses ambiguity', () => {
  const documents = loadAsteria();
  const twin: SystemDefinition = structuredClone(definition(documents));
  twin.metadata = { ...twin.metadata, id: 'asteria-twin', revision: 1 };
  delete twin.metadata.supersedes;
  const ambiguous = createKernelFacade().resolve([...documents, twin]);
  assert.equal(ambiguous.status, 'INVALID');
  assert.ok(codes(ambiguous.diagnostics).includes('FACADE_AMBIGUOUS_SYSTEM_DEFINITION'));
  const named = createKernelFacade().resolve([...documents, twin], { definition: 'asteria-twin' });
  assert.equal(named.definition?.ref, 'SystemDefinition/asteria-twin@1');
  const none = createKernelFacade().resolve(documents.filter((document) => !['SystemDefinition', 'ChangeRequest', 'EvidenceRecord'].includes(document.kind)));
  assert.ok(codes(none.diagnostics).includes('FACADE_NO_SYSTEM_DEFINITION'));
});

test('same inputs give the same bytes, whatever the order of the documents', () => {
  const first = createKernelFacade().plan(loadAsteria(), { catalog: catalog() });
  const second = createKernelFacade().plan([...loadAsteria()].reverse(), { catalog: catalog() });
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.deepEqual(JSON.parse(JSON.stringify(first)), first, 'results are plain JSON');
});

test('the compiler names no framework, runtime or cloud (TA-04)', () => {
  const forbidden = /nestjs|spring|fastapi|nextjs|angular|react-native|flutter|postgres|kubernetes|\baws\b|azure|gcp/i;
  for (const file of readdirSync(SOURCES)) assert.doesNotMatch(readFileSync(`${SOURCES}${file}`, 'utf8'), forbidden, file);
});
