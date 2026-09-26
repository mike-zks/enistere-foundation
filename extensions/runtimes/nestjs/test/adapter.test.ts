import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createKernelFacade, type IRComponent } from '@enistere/foundation-kernel-compiler';
import { digestOf } from '@enistere/foundation-kernel-contracts';
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

const GOLDEN = fileURLToPath(new URL('../../../../goldens/asteria/', import.meta.url));
function asteria(): { component: IRComponent; context: Parameters<typeof adapter.plan>[1] } {
  const documents = ['contracts/', 'evidence/'].flatMap((directory) => readdirSync(`${GOLDEN}${directory}`).map((file) => JSON.parse(readFileSync(`${GOLDEN}${directory}${file}`, 'utf8')) as unknown));
  const result = createKernelFacade().plan(documents, { catalog: JSON.parse(readFileSync(`${GOLDEN}sources/catalog.json`, 'utf8')) });
  const component = result.ir!.components.find((candidate) => candidate.id === 'authority-api')!;
  return { component, context: { system: 'asteria', definition: result.definition!.ref, domains: result.ir!.domains, apiContracts: result.apiContracts } };
}

test('the shared API contract is embedded as projected by the kernel, never re-described', () => {
  const { component, context } = asteria();
  const contract = context.apiContracts![0]!;
  const { contents } = planArtifacts(adapter.describe(), component, adapter.plan(component, context));
  const embedded = JSON.parse(contents.get('contract/service-requests.openapi.json') as string) as unknown;
  assert.deepEqual(embedded, contract.document);
  assert.equal(digestOf(embedded as never), contract.digest, 'the embedded document has the digest cited by the plan');
});

test('the contract gives typed routes validated against the contract, and owner-seeded handlers answering 501', () => {
  const { component, context } = asteria();
  const { plan, contents } = planArtifacts(adapter.describe(), component, adapter.plan(component, context));
  assert.deepEqual(
    plan.artifacts.filter((artifact) => artifact.ownership === 'OWNER_SEEDED').map((artifact) => artifact.path),
    ['src/extension/extension.module.ts', 'src/extension/service-requests.handlers.ts'],
  );
  const controller = contents.get('src/domain/service-requests/service-requests.controller.ts') as string;
  assert.match(controller, /@Post\('submit-request'\)/);
  assert.match(controller, /@Get\('list-requests'\)/);
  assert.equal((controller.match(/validateInput</g) ?? []).length, 7, 'every operation with an input validates it against the contract');
  const handlers = contents.get('src/extension/service-requests.handlers.ts') as string;
  assert.equal((handlers.match(/throw new NotImplementedException/g) ?? []).length, 10);
  assert.match(contents.get('src/domain/service-requests/types.ts') as string, /export type RequestStatus = "SUBMITTED" \| "TRIAGED"/);
  assert.match(contents.get('src/domain/service-requests/types.ts') as string, /export interface ServiceRequest \{[^}]*priority\?: Priority;/s);
  assert.match(contents.get('Dockerfile') as string, /^COPY --chown=node:node contract \.\/contract$/m);
  assert.match(contents.get('README.md') as string, /`submitRequest` \| `POST \/service-requests\/submit-request` \| requester \| INV-001, INV-002/);
});

test('authorization and files stay capabilities: nothing in the project simulates them', () => {
  const { component, context } = asteria();
  const { contents } = planArtifacts(adapter.describe(), component, adapter.plan(component, context));
  for (const [path, content] of contents) {
    if (path.endsWith('.json') || path.endsWith('.md')) continue;
    assert.doesNotMatch(content, /UseGuards|CanActivate|passport|jwt|multer|FileInterceptor/i, path);
  }
});

test('a component that provides no contract keeps the E2 project shape', () => {
  const { contents } = planArtifacts(adapter.describe(), component(), adapter.plan(component(), context));
  assert.ok(![...contents.keys()].some((path) => path.startsWith('contract/') || path.startsWith('src/domain/')));
  assert.doesNotMatch(contents.get('Dockerfile') as string, /contract/);
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
