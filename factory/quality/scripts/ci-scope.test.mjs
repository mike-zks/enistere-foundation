import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { decideScopes, goldenMatrix, loadGoldenMatrix, loadScopes } from './ci-scope.mjs';
import { COMPOSITIONS } from './golden-runtime.mjs';

const config = loadScopes();
const matrix = loadGoldenMatrix();
const RUNTIMES = ['nestjs', 'spring', 'fastapi', 'nextjs', 'angular', 'react-native', 'flutter'];

function runtimesOf(value) {
  if (typeof value === 'string') return RUNTIMES.includes(value) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(runtimesOf);
  if (value && typeof value === 'object') return Object.values(value).flatMap(runtimesOf);
  return [];
}

describe('CI scopes (ADR-094)', () => {
  it('runs every scope outside pull requests', () => {
    for (const event of ['push', 'schedule', 'workflow_dispatch']) {
      assert.ok(Object.values(decideScopes(config, [], event)).every(Boolean), event);
    }
  });

  it('never reads an unknown diff as "nothing changed"', () => {
    assert.ok(Object.values(decideScopes(config, null, 'pull_request')).every(Boolean));
    assert.ok(Object.values(decideScopes(config, [], 'pull_request')).every(Boolean));
  });

  it('a change to the CI itself activates every scope', () => {
    assert.ok(Object.values(decideScopes(config, ['.github/workflows/ci.yml'], 'pull_request')).every(Boolean));
    assert.ok(Object.values(decideScopes(config, ['package-lock.json'], 'pull_request')).every(Boolean));
  });

  it('a docs-only change runs no runtime scope', () => {
    assert.ok(Object.values(decideScopes(config, ['docs/README.md', 'CURRENT_STATE.md'], 'pull_request')).every((value) => !value));
  });

  it('routes a change to the scopes that test it', () => {
    assert.deepEqual(decideScopes(config, ['kernel/contracts/src/index.ts'], 'pull_request'), {
      apiRuntime: false, goldenRuntime: false, kernel: true, packagesWeb: false, registry: false, webE2e: false,
    });
    const nest = decideScopes(config, ['starters/nestjs/src/main.ts'], 'pull_request');
    assert.ok(nest.apiRuntime && nest.webE2e && nest.registry && nest.goldenRuntime && !nest.kernel && !nest.packagesWeb);
    const capability = decideScopes(config, ['capabilities/files/manifest.json'], 'pull_request');
    assert.ok(capability.goldenRuntime && !capability.apiRuntime);
  });

  it('every workflow reads its scope from this script, not from a hand-written filter', () => {
    for (const workflow of ['ci.yml', 'api-runtime-ci.yml', 'web-e2e-ci.yml', 'registry-ci.yml', 'factory-golden-runtime.yml']) {
      const source = readFileSync(new URL(`../../../.github/workflows/${workflow}`, import.meta.url), 'utf8');
      assert.match(source, /factory\/quality\/scripts\/ci-scope\.mjs/, workflow);
    }
  });
});

describe('golden runtime matrix (ADR-094)', () => {
  it('lists every composition once, and only known ones', () => {
    assert.equal(new Set(matrix.full).size, matrix.full.length);
    assert.deepEqual([...matrix.full].sort(), Object.keys(COMPOSITIONS).sort());
  });

  it('keeps the pull-request subset inside the full matrix', () => {
    for (const composition of matrix.pullRequest) assert.ok(matrix.full.includes(composition), composition);
    assert.ok(matrix.pullRequest.length < matrix.full.length);
  });

  it('the pull-request subset still covers the 7 runtimes, the 3 capabilities and regeneration per family', () => {
    const runtimes = new Set(matrix.pullRequest.flatMap((composition) => runtimesOf(COMPOSITIONS[composition])));
    assert.deepEqual([...runtimes].sort(), [...RUNTIMES].sort());
    const capabilities = new Set(matrix.pullRequest.flatMap((composition) => COMPOSITIONS[composition].capabilities ?? []));
    for (const capability of ['auth', 'rbac', 'files']) assert.ok(capabilities.has(capability), capability);
    const workflow = readFileSync(new URL('../../../.github/workflows/factory-golden-runtime.yml', import.meta.url), 'utf8');
    for (const [, composition] of workflow.matchAll(/matrix\.composition == '([a-z0-9-]+)'/g)) {
      assert.ok(matrix.pullRequest.includes(composition), `regeneration step ${composition} must run on pull requests`);
    }
  });

  it('selects the subset on pull requests and everything elsewhere', () => {
    assert.deepEqual(goldenMatrix(matrix, 'pull_request'), matrix.pullRequest);
    assert.deepEqual(goldenMatrix(matrix, 'push'), matrix.full);
    assert.deepEqual(goldenMatrix(matrix, 'schedule'), matrix.full);
  });
});
