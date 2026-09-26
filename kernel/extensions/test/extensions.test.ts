import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { IRComponent } from '@enistere/foundation-kernel-compiler';
import { fileDigest } from '@enistere/foundation-kernel-contracts';

import { catalogFromManifests, decideWrite, isSafeArtifactPath, planArtifacts, validateManifest, type AdapterManifest, type PlannedArtifact } from '../src/index.ts';

const SOURCES = fileURLToPath(new URL('../src/', import.meta.url));

const manifest = (): AdapterManifest => ({
  protocol: 'foundation.enistere.com/adapter-protocol/v0',
  id: 'sample',
  extensionType: 'RUNTIME_ADAPTER',
  version: '1.0.0',
  maintainer: 'tests',
  supports: { componentKinds: ['api-service'], runtime: 'sample-runtime' },
  capabilities: [],
  execution: { mode: 'TRUSTED_IN_PROCESS' },
  permissions: { filesystem: 'WORKSPACE_WRITE', network: 'NONE', secrets: 'NONE' },
  tools: [],
  determinism: 'DETERMINISTIC',
  verification: [{ id: 'structure', level: 'STRUCTURAL', statement: 'Files match the latest MaterializationRecord.' }],
  entry: './src/adapter.ts',
});

const component = (ownership = 'SHARED_CONTROLLED'): IRComponent => ({
  id: 'api',
  name: 'API',
  kind: 'api-service',
  audience: 'SYSTEM',
  runtime: { preferences: ['sample-runtime'], constraints: [] },
  platformCapabilities: [],
  interactions: [],
  publishes: [],
  subscribes: [],
  implements: [],
  data: [],
  integrations: [],
  environments: ['local'],
  ownership: { class: ownership, team: 'team' },
  requirements: [],
  decisions: [],
});

test('a well-formed manifest is accepted; the schema refuses everything else', () => {
  assert.deepEqual(validateManifest(manifest()).diagnostics, []);
  const secrets = { ...manifest(), permissions: { filesystem: 'WORKSPACE_WRITE', network: 'NONE', secrets: 'READ' } };
  assert.deepEqual([...new Set(validateManifest(secrets).diagnostics.map((item) => item.code))], ['MANIFEST_INVALID'], 'v0 adapters never receive secrets');
  const protocol = { ...manifest(), protocol: 'other/v9' };
  assert.equal(validateManifest(protocol).manifest, null);
  const noStructural = { ...manifest(), verification: [{ id: 'build', level: 'TOOLCHAIN', statement: 'Builds.' }] };
  assert.equal(validateManifest(noStructural).manifest, null, 'a STRUCTURAL check is mandatory');
  const escaping = { ...manifest(), entry: '../outside.ts' };
  assert.equal(validateManifest(escaping).manifest, null);
});

test('manifests become E1 catalog descriptors, validated by the single catalog validator', () => {
  const withCapability = { ...manifest(), capabilities: ['authentication'] };
  const { catalog, diagnostics } = catalogFromManifests([withCapability]);
  assert.deepEqual(diagnostics, []);
  assert.deepEqual(catalog, {
    runtimeAdapters: [{ id: 'sample', version: '1.0.0', componentKinds: ['api-service'], runtime: 'sample-runtime' }],
    capabilityProviders: [{ id: 'sample.authentication', version: '1.0.0', capability: 'authentication', runtimes: ['sample-runtime'] }],
  });
  assert.deepEqual(catalogFromManifests([manifest(), manifest()]).diagnostics.map((item) => item.code), ['MANIFEST_DUPLICATE_ID']);
  const overlap = { ...manifest(), id: 'other' };
  assert.deepEqual(catalogFromManifests([manifest(), overlap]).diagnostics.map((item) => item.code), ['CATALOG_OVERLAPPING_COVERAGE']);
});

test('artifact paths stay inside the component directory', () => {
  for (const path of ['package.json', 'src/main.ts', '.gitignore', 'a/b/c.ts']) assert.ok(isSafeArtifactPath(path), path);
  for (const path of ['/etc/passwd', '../x', 'a/../../x', 'a//b', 'dir/', '.foundation/records/x.json', '']) assert.ok(!isSafeArtifactPath(path), path);
  assert.throws(() => planArtifacts({ id: 'a', version: '1.0.0' }, component(), [{ path: '../x', content: '', ownership: 'COMPILER_OWNED' }]), /unsafe/);
  assert.throws(
    () => planArtifacts({ id: 'a', version: '1.0.0' }, component(), [
      { path: 'x', content: '1', ownership: 'COMPILER_OWNED' },
      { path: 'x', content: '2', ownership: 'COMPILER_OWNED' },
    ]),
    /duplicate/,
  );
});

test('an artifact plan is sorted, digested and bounded by the component ownership class', () => {
  const artifacts = [
    { path: 'src/b.ts', content: 'b', ownership: 'COMPILER_OWNED' as const },
    { path: 'a.txt', content: 'a', ownership: 'OWNER_SEEDED' as const },
  ];
  const { plan } = planArtifacts({ id: 'a', version: '1.0.0' }, component(), artifacts);
  assert.deepEqual(plan.artifacts.map((artifact) => artifact.path), ['a.txt', 'src/b.ts']);
  assert.equal(plan.artifacts[1]?.digest, fileDigest('b'));
  assert.equal(planArtifacts({ id: 'a', version: '1.0.0' }, component(), [...artifacts].reverse()).plan.digest, plan.digest);
  const owned = planArtifacts({ id: 'a', version: '1.0.0' }, component('OWNER_MANAGED'), artifacts).plan;
  assert.ok(owned.artifacts.every((artifact) => artifact.ownership === 'OWNER_SEEDED'), 'an owner-managed component is only seeded');
});

test('the ownership rule never overwrites silently (FR-OWN-02)', () => {
  const compiler: PlannedArtifact = { path: 'x', ownership: 'COMPILER_OWNED', digest: fileDigest('new') };
  const seeded: PlannedArtifact = { path: 'y', ownership: 'OWNER_SEEDED', digest: fileDigest('seed') };
  assert.equal(decideWrite(compiler, null, null), 'CREATE');
  assert.equal(decideWrite(compiler, fileDigest('new'), fileDigest('old')), 'UNCHANGED');
  assert.equal(decideWrite(compiler, fileDigest('old'), fileDigest('old')), 'UPDATE', 'the compiler updates what it wrote');
  assert.equal(decideWrite(compiler, fileDigest('edited'), fileDigest('old')), 'CONFLICT', 'a local edit of a compiler-owned file is a conflict');
  assert.equal(decideWrite(compiler, fileDigest('unknown'), null), 'CONFLICT', 'a file the compiler never wrote is not taken over');
  assert.equal(decideWrite(seeded, null, null), 'CREATE');
  assert.equal(decideWrite(seeded, fileDigest('edited by owner'), fileDigest('seed')), 'KEEP_OWNER');
});

test('the protocol names no framework (TA-04)', () => {
  const forbidden = /nestjs|spring|fastapi|nextjs|angular|react-native|flutter|postgres|kubernetes/i;
  for (const file of readdirSync(SOURCES)) assert.doesNotMatch(readFileSync(`${SOURCES}${file}`, 'utf8'), forbidden, file);
});
