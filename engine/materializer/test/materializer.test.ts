import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createKernelFacade, type PlanResult } from '@enistere/foundation-kernel-compiler';
import { validateContract, type AnyContract } from '@enistere/foundation-kernel-contracts';

import { latestRecord, loadExtensions, materialize, planMaterialization, readRecords, RECORDS_DIRECTORY, verifyWorkspace, type ExtensionHost } from '../src/index.ts';

const FIXTURES = fileURLToPath(new URL('./fixtures/', import.meta.url));
const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const SOURCES = fileURLToPath(new URL('../src/', import.meta.url));
const OBSERVED = { observedAt: '2026-09-25T12:00:00Z', environment: { id: 'unit', kind: 'LOCAL' as const } };
const AT = { executedAt: '2026-09-25T11:00:00Z' };

const temporary: string[] = [];
after(() => temporary.forEach((directory) => rmSync(directory, { recursive: true, force: true })));
const workspace = (): string => {
  const directory = mkdtempSync(join(tmpdir(), 'foundation-ws-'));
  temporary.push(directory);
  return directory;
};

function asteria(): AnyContract[] {
  return ['contracts', 'evidence'].flatMap((folder) =>
    readdirSync(`${REPO}goldens/asteria/${folder}`)
      .sort()
      .map((file) => JSON.parse(readFileSync(`${REPO}goldens/asteria/${folder}/${file}`, 'utf8')) as AnyContract),
  );
}
const planWith = (host: ExtensionHost): PlanResult => createKernelFacade().plan(asteria(), { catalog: host.catalog });

test('the host loads trusted adapters and derives the catalog from their manifests', async () => {
  const host = await loadExtensions(`${FIXTURES}ok`);
  assert.deepEqual(host.diagnostics, []);
  assert.deepEqual(host.extensions.map((extension) => extension.manifest.id), ['fixture-api']);
  assert.deepEqual(host.catalog?.runtimeAdapters, [{ id: 'fixture-api', version: '1.0.0', componentKinds: ['api-service'], runtime: 'nestjs' }]);
});

test('adapters that cannot run here are left out of the catalog, with a reason', async () => {
  const host = await loadExtensions(`${FIXTURES}mixed`);
  assert.deepEqual(host.extensions.map((extension) => extension.manifest.id), ['fixture-api']);
  assert.deepEqual(host.diagnostics.map((item) => [item.code, item.severity]), [
    ['ADAPTER_UNSUPPORTED_EXECUTION_MODE', 'warning'],
    ['ADAPTER_CONTRACT_VIOLATION', 'error'],
  ]);
  const plan = planWith(host);
  assert.ok(plan.plan?.unsupported.some((item) => item.component === 'ops-web'), 'the container adapter is not used by fallback');
});

test('PLAN of the adapters is pure: same inputs, same artifact plans', async () => {
  const host = await loadExtensions(`${FIXTURES}ok`);
  const first = planMaterialization(planWith(host), host);
  const second = planMaterialization(planWith(host), host);
  assert.deepEqual(first.components.map((component) => component.plan), second.components.map((component) => component.plan));
  assert.deepEqual(first.components.map((component) => component.component.id), ['authority-api']);
});

test('MATERIALIZE writes the component with its A8 record, then is idempotent', async () => {
  const host = await loadExtensions(`${FIXTURES}ok`);
  const root = workspace();
  const first = materialize(planWith(host), host, root, AT);
  assert.deepEqual(first.diagnostics, []);
  assert.deepEqual(first.records[0]?.spec.files.map((file) => file.decision), ['CREATE', 'CREATE', 'CREATE']);
  assert.ok(existsSync(join(root, 'authority-api', RECORDS_DIRECTORY)));
  assert.deepEqual(validateContract(first.records[0]).diagnostics, [], 'the A8 record is a valid contract');
  const second = materialize(planWith(host), host, root, AT);
  assert.deepEqual(second.records[0]?.spec.files.map((file) => file.decision), ['UNCHANGED', 'UNCHANGED', 'KEEP_OWNER']);
  assert.equal(second.records[0]?.spec.outcome, 'APPLIED');
  assert.equal(second.records[0]?.metadata.revision, 2);
  assert.deepEqual(readRecords(join(root, 'authority-api')).map((record) => [record.metadata.revision, record.metadata.status]), [[1, 'SUPERSEDED'], [2, 'VALID']]);
});

test('owner-seeded files are never overwritten; a local edit of a compiler-owned file is a conflict', async () => {
  const host = await loadExtensions(`${FIXTURES}ok`);
  const root = workspace();
  materialize(planWith(host), host, root, AT);
  const owner = join(root, 'authority-api/src/owner.mjs');
  writeFileSync(owner, '// written by the owner\n');
  const kept = materialize(planWith(host), host, root, AT);
  assert.equal(readFileSync(owner, 'utf8'), '// written by the owner\n');
  assert.equal(kept.records[0]?.spec.outcome, 'APPLIED');

  const readme = join(root, 'authority-api/README.md');
  writeFileSync(readme, 'edited by hand\n');
  rmSync(join(root, 'authority-api/server.mjs'));
  const conflict = materialize(planWith(host), host, root, AT);
  assert.equal(conflict.records[0]?.spec.outcome, 'CONFLICT');
  assert.equal(latestRecord(join(root, 'authority-api'))?.metadata.revision, 2, 'a conflicted materialization stores no record');
  assert.deepEqual(conflict.diagnostics.map((item) => item.code), ['MATERIALIZE_CONFLICT']);
  assert.equal(readFileSync(readme, 'utf8'), 'edited by hand\n', 'nothing is overwritten');
  assert.ok(!existsSync(join(root, 'authority-api/server.mjs')), 'a component with a conflict is not half-applied');
});

test('VERIFY records each declared check as a valid EvidenceRecord', async () => {
  const host = await loadExtensions(`${FIXTURES}ok`);
  const root = workspace();
  materialize(planWith(host), host, root, AT);
  const structural = await verifyWorkspace(root, host, { toolchain: false, ...OBSERVED });
  assert.deepEqual(structural.evidence.map((record) => [record.spec.obligation.id, record.spec.result]), [['structure', 'PASS']]);
  const full = await verifyWorkspace(root, host, { toolchain: true, ...OBSERVED });
  assert.deepEqual(full.evidence.map((record) => [record.spec.obligation.id, record.spec.result]), [['structure', 'PASS'], ['run', 'PASS'], ['probe', 'PASS']]);
  const materialization = latestRecord(join(root, 'authority-api'))!;
  for (const record of full.evidence) {
    assert.deepEqual(validateContract(record).diagnostics.filter((item) => item.severity === 'error'), []);
    assert.ok(record.spec.inputs.some((input) => input.kind === 'MaterializationRecord' && input.revision === materialization.metadata.revision), 'evidence cites the verified materialization');
    assert.equal(record.spec.producedBy.type, 'CHECKER');
    assert.equal(record.spec.subject.contract.id, 'asteria');
    assert.equal(record.spec.subject.component, 'authority-api');
  }
});

test('VERIFY reports drift and failures; a check after a failure is INCONCLUSIVE', async () => {
  const host = await loadExtensions(`${FIXTURES}failing`);
  const root = workspace();
  materialize(planWith(host), host, root, AT);
  writeFileSync(join(root, 'authority-api/README.md'), 'drift\n');
  const result = await verifyWorkspace(root, host, { toolchain: true, ...OBSERVED });
  assert.deepEqual(result.evidence.map((record) => [record.spec.obligation.id, record.spec.result]), [['structure', 'FAIL'], ['run', 'FAIL'], ['probe', 'INCONCLUSIVE']]);
  assert.deepEqual(result.diagnostics.map((item) => item.code), ['VERIFY_INVENTORY_MISMATCH']);
});

test('an owner change survives a new adapter version (E4 gate)', async () => {
  const root = workspace();
  const v1 = await loadExtensions(`${FIXTURES}upgrade-v1`);
  materialize(planWith(v1), v1, root, AT);
  const owner = join(root, 'authority-api/src/owner.mjs');
  writeFileSync(owner, '// the team implemented its business rules here\n');

  const v2 = await loadExtensions(`${FIXTURES}upgrade-v2`);
  const upgraded = materialize(planWith(v2), v2, root, { executedAt: '2026-09-26T09:00:00Z' });
  const decisions = Object.fromEntries(upgraded.records[0]!.spec.files.map((file) => [file.path, file.decision]));
  assert.deepEqual(decisions, { 'README.md': 'UPDATE', 'server.mjs': 'UNCHANGED', 'src/owner.mjs': 'KEEP_OWNER' });
  assert.equal(readFileSync(owner, 'utf8'), '// the team implemented its business rules here\n', 'the owner change survives');
  assert.match(readFileSync(join(root, 'authority-api/README.md'), 'utf8'), /Generated by version 2/);
  const history = readRecords(join(root, 'authority-api'));
  assert.deepEqual(history.map((record) => [record.metadata.revision, record.spec.adapter.version, record.metadata.status]), [
    [1, '1.0.0', 'SUPERSEDED'],
    [2, '2.0.0', 'VALID'],
  ]);
  assert.equal(history[1]?.metadata.supersedes?.revision, 1);
});

test('handlers written by the team survive a re-materialization of the shared contract (E5)', async () => {
  const host = await loadExtensions(`${REPO}extensions`);
  const root = workspace();
  const first = materialize(planWith(host), host, root, AT);
  assert.deepEqual(first.diagnostics, []);
  const handlers = join(root, 'authority-api/src/extension/service-requests.handlers.ts');
  assert.match(readFileSync(handlers, 'utf8'), /NotImplementedException/);
  writeFileSync(handlers, '// the team implemented the service requests here\n');
  const again = materialize(planWith(host), host, root, { executedAt: '2026-09-26T09:00:00Z' });
  const decision = again.records[0]!.spec.files.find((file) => file.path === 'src/extension/service-requests.handlers.ts')?.decision;
  assert.equal(decision, 'KEEP_OWNER');
  assert.equal(again.records[0]!.spec.outcome, 'APPLIED');
  assert.equal(readFileSync(handlers, 'utf8'), '// the team implemented the service requests here\n');
  assert.ok(existsSync(join(root, 'authority-api/contract/service-requests.openapi.json')));
});

test('the Engine names no framework, runtime or cloud (TA-04)', () => {
  const forbidden = /nestjs|spring|fastapi|nextjs|angular|react-native|flutter|postgres|kubernetes/i;
  for (const file of readdirSync(SOURCES)) assert.doesNotMatch(readFileSync(`${SOURCES}${file}`, 'utf8'), forbidden, file);
});
