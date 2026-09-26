import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import type { IRComponent } from '@enistere/foundation-kernel-compiler';
import { planArtifacts, validateManifest } from '@enistere/foundation-kernel-extensions';

import adapter, { ADAPTER, DEPENDENCIES, DEV_DEPENDENCIES } from '../src/adapter.ts';

const manifest: unknown = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
const context = { system: 'asteria', definition: 'SystemDefinition/asteria@2' };
const component = (kind = 'api-service', ownership = 'SHARED_CONTROLLED'): IRComponent => ({
  id: 'authority-api',
  name: 'Authority API',
  kind,
  audience: 'SYSTEM',
  runtime: { preferences: ['nestjs'], constraints: [] },
  platformCapabilities: [],
  interactions: [],
  publishes: [],
  subscribes: [],
  implements: [],
  data: [],
  integrations: [],
  environments: ['local'],
  ownership: { class: ownership, team: 'asteria-backend' },
  requirements: [],
  decisions: [],
});

test('the manifest is valid and matches the adapter identity', () => {
  const { manifest: valid, diagnostics } = validateManifest(manifest);
  assert.deepEqual(diagnostics, []);
  assert.deepEqual({ id: valid?.id, version: valid?.version }, adapter.describe());
  assert.deepEqual(adapter.describe(), { ...ADAPTER });
  assert.equal(valid?.permissions.secrets, 'NONE');
});

test('every TOOLCHAIN check of the manifest has steps, and nothing else does', () => {
  const declared = validateManifest(manifest).manifest!.verification.filter((check) => check.level === 'TOOLCHAIN').map((check) => check.id).sort();
  assert.deepEqual(adapter.toolchainChecks().map((check) => check.check).sort(), declared);
});

test('only api-service components are accepted', () => {
  assert.deepEqual(adapter.validateIntent(component(), context), []);
  assert.equal(adapter.validateIntent(component('async-worker'), context).length, 1);
});

test('the plan is deterministic and keeps a single owner-managed extension point', () => {
  const first = planArtifacts(adapter.describe(), component(), adapter.plan(component(), context));
  const second = planArtifacts(adapter.describe(), component(), adapter.plan(component(), context));
  assert.equal(first.plan.digest, second.plan.digest);
  assert.deepEqual(
    first.plan.artifacts.filter((artifact) => artifact.ownership === 'OWNER_SEEDED').map((artifact) => artifact.path),
    ['src/extension/extension.module.ts'],
  );
  for (const path of ['package.json', 'tsconfig.json', 'src/main.ts', 'src/app.module.ts', 'src/health/health.controller.ts', 'Dockerfile', 'README.md']) {
    assert.ok(first.contents.has(path), path);
  }
});

test('dependencies are pinned to exact versions; the image does not run as root; no secret is generated', () => {
  for (const version of Object.values({ ...DEPENDENCIES, ...DEV_DEPENDENCIES })) assert.match(version, /^\d+\.\d+\.\d+$/);
  const { contents } = planArtifacts(adapter.describe(), component(), adapter.plan(component(), context));
  const packageJson = JSON.parse(contents.get('package.json') as string) as { type: string; dependencies: Record<string, string> };
  assert.equal(packageJson.type, 'module');
  assert.deepEqual(packageJson.dependencies, { ...DEPENDENCIES });
  assert.match(contents.get('Dockerfile') as string, /^USER node$/m);
  for (const [path, content] of contents) assert.doesNotMatch(content, /password\s*[:=]|secret\s*[:=]|api[_-]?key\s*[:=]|BEGIN [A-Z ]*PRIVATE KEY/i, path);
});
