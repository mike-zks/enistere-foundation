import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { test } from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  COMMON_SCHEMA_FILE,
  CONTRACT_KINDS,
  CONTRACT_REGISTRY,
  CURRENT_API_VERSION,
  SCHEMA_DIRECTORY,
  SCHEMA_FILES,
  createMigrationRegistry,
  readSchema,
  validateContract,
  type AnyContract,
} from '../src/index.ts';
import { codes, golden, loadGolden } from './fixtures.ts';

test('one schema per contract kind, each with a stable $id, and nothing else in the folder', () => {
  const files = readdirSync(SCHEMA_DIRECTORY).sort();
  assert.deepEqual(files, [COMMON_SCHEMA_FILE, ...Object.values(SCHEMA_FILES)].sort());
  assert.deepEqual(Object.keys(SCHEMA_FILES).sort(), [...CONTRACT_KINDS].sort());
  for (const file of files) {
    const schema = readSchema(file);
    assert.equal(schema.$id, `https://schemas.foundation.enistere.com/v1alpha1/${file}`);
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  }
});

test('the registry covers A1–A9 exactly once with Desired / Derived / Evidence planes', () => {
  const entries = Object.values(CONTRACT_REGISTRY);
  assert.deepEqual(entries.map((entry) => entry.code).sort(), ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9']);
  assert.equal(CONTRACT_REGISTRY.EffectiveOrganizationContext.stateClass, 'DERIVED');
  assert.equal(CONTRACT_REGISTRY.EvidenceRecord.stateClass, 'RECORD');
  assert.equal(CONTRACT_REGISTRY.MaterializationRecord.stateClass, 'RECORD');
  for (const kind of ['RequirementBaseline', 'DecisionSet', 'SystemDefinition', 'DomainContract', 'ChangeRequest', 'DesignSystem'] as const) {
    assert.equal(CONTRACT_REGISTRY[kind].stateClass, 'AUTHORITATIVE', kind);
  }
});

test('every committed golden document validates on its own', () => {
  for (const document of loadGolden()) {
    const validation = validateContract(document);
    assert.deepEqual(validation.diagnostics, [], `${document.kind}/${document.metadata.id}@${document.metadata.revision}`);
    assert.ok(Object.isFrozen(validation.document));
  }
});

test('the kernel schemas agree with an independent strict Ajv instance on every golden document', () => {
  const ajv = new Ajv2020.default({ allErrors: true, strict: true, strictTypes: false });
  ajv.addSchema(readSchema(COMMON_SCHEMA_FILE));
  const compiled = new Map(Object.entries(SCHEMA_FILES).map(([kind, file]) => [kind, ajv.compile(readSchema(file))]));
  for (const document of loadGolden()) assert.equal(compiled.get(document.kind)?.(document), true, document.metadata.id);
});

test('structure is strict: unknown properties, wrong enums and missing fields are rejected', () => {
  const unknown = golden('SystemDefinition', 'asteria', 2) as AnyContract & { spec: Record<string, unknown> };
  unknown.spec.generatorHint = 'nestjs-starter';
  assert.deepEqual(codes(validateContract(unknown).diagnostics), ['CONTRACT_SCHEMA_VIOLATION']);

  const status = golden('EvidenceRecord', 'asteria-sd2-closure');
  (status.metadata as { status: string }).status = 'ACCEPTED';
  assert.deepEqual(codes(validateContract(status).diagnostics), ['CONTRACT_SCHEMA_VIOLATION']);

  const latest = golden('SystemDefinition', 'asteria', 2);
  (latest.spec as unknown as { inputs: { decisionSet: Record<string, unknown> } }).inputs.decisionSet.revision = 'latest';
  assert.deepEqual(codes(validateContract(latest).diagnostics), ['CONTRACT_SCHEMA_VIOLATION']);

  const unpinned = golden('SystemDefinition', 'asteria', 2);
  delete (unpinned.spec as unknown as { inputs: { decisionSet: { digest?: string } } }).inputs.decisionSet.digest;
  assert.deepEqual(codes(validateContract(unpinned).diagnostics), ['CONTRACT_SCHEMA_VIOLATION']);

  assert.deepEqual(codes(validateContract([]).diagnostics), ['CONTRACT_NOT_AN_OBJECT']);
  assert.deepEqual(codes(validateContract({ apiVersion: CURRENT_API_VERSION, kind: 'Blueprint' }).diagnostics), ['CONTRACT_UNKNOWN_KIND']);
  assert.deepEqual(codes(validateContract({ ...golden('DecisionSet', 'asteria-decisions'), extra: Number.NaN }).diagnostics), ['CONTRACT_NOT_CANONICAL_JSON']);
});

test('timestamps must be real instants, not only well-formed strings', () => {
  const document = golden('DecisionSet', 'asteria-decisions');
  document.metadata.acceptance!.at = '2026-02-30T10:00:00Z';
  assert.deepEqual(codes(validateContract(document).diagnostics), ['CONTRACT_INVALID_TIMESTAMP']);
});

test('an unknown apiVersion is UNSUPPORTED — never read by fallback', () => {
  const document = { ...golden('DecisionSet', 'asteria-decisions'), apiVersion: 'foundation.enistere.com/v2' };
  const validation = validateContract(document);
  assert.equal(validation.valid, false);
  assert.equal(validation.document, null);
  assert.deepEqual(codes(validation.diagnostics), ['CONTRACT_UNSUPPORTED_API_VERSION']);
  assert.equal(validation.diagnostics[0]?.class, 'UNSUPPORTED');
});

test('the migration seam applies a registered chain and records it', () => {
  const current = golden('DecisionSet', 'asteria-decisions');
  const legacyShape = structuredClone(current) as unknown as Record<string, unknown>;
  legacyShape.apiVersion = 'foundation.enistere.com/v1alpha0';
  const spec = legacyShape.spec as Record<string, unknown>;
  spec.baseline = spec.requirementBaseline;
  delete spec.requirementBaseline;
  const migrations = createMigrationRegistry([
    {
      kind: 'DecisionSet',
      from: 'foundation.enistere.com/v1alpha0',
      to: CURRENT_API_VERSION,
      migrate: (document) => {
        const { baseline, ...rest } = document.spec as Record<string, unknown>;
        return { ...document, apiVersion: CURRENT_API_VERSION, spec: { ...rest, requirementBaseline: baseline } };
      },
    },
  ]);
  const validation = validateContract(legacyShape, { migrations });
  assert.deepEqual(validation.diagnostics, []);
  assert.deepEqual(validation.migrated, [{ from: 'foundation.enistere.com/v1alpha0', to: CURRENT_API_VERSION }]);
  assert.deepEqual(validation.document, current);
  // The input was not mutated.
  assert.equal((legacyShape.spec as Record<string, unknown>).requirementBaseline, undefined);
});

test('the migration seam fails loudly on broken or cyclic chains', () => {
  const document = { ...golden('DecisionSet', 'asteria-decisions'), apiVersion: 'x/v0' };
  const wrong = createMigrationRegistry([{ kind: 'DecisionSet', from: 'x/v0', to: CURRENT_API_VERSION, migrate: (d) => ({ ...d, apiVersion: 'x/v9' }) }]);
  assert.deepEqual(codes(validateContract(document, { migrations: wrong }).diagnostics), ['CONTRACT_MIGRATION_FAILED']);
  const cycle = createMigrationRegistry([
    { kind: 'DecisionSet', from: 'x/v0', to: 'x/v1', migrate: (d) => ({ ...d, apiVersion: 'x/v1' }) },
    { kind: 'DecisionSet', from: 'x/v1', to: 'x/v0', migrate: (d) => ({ ...d, apiVersion: 'x/v0' }) },
  ]);
  assert.deepEqual(codes(validateContract(document, { migrations: cycle }).diagnostics), ['CONTRACT_MIGRATION_FAILED']);
  assert.throws(() =>
    createMigrationRegistry([
      { kind: 'DecisionSet', from: 'a', to: 'b', migrate: (d) => d },
      { kind: 'DecisionSet', from: 'a', to: 'c', migrate: (d) => d },
    ]),
  );
});
