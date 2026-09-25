import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createDefaultBlueprint } from '../engine/blueprint.mjs';
import { loadCapabilityManifests } from '../engine/capabilities.mjs';
import { generateProject } from '../engine/generator.mjs';
import { buildGenerationPlan } from '../engine/plan.mjs';
import { loadStarterManifests, modularStarterIds } from '../engine/starters.mjs';
import { validateDeploymentUnit } from '../engine/deployment-unit-schema.mjs';

const FOUNDATION_ROOT = resolve(import.meta.dirname, '../..');
let starters;

before(async () => {
  starters = await loadStarterManifests(FOUNDATION_ROOT);
});

function blueprint(slug, stack, capabilities = []) {
  const value = createDefaultBlueprint(slug);
  value.stack = stack;
  value.capabilities = capabilities;
  value.deployment = { environments: ['local'] };
  return value;
}

async function planFor(value) {
  return buildGenerationPlan(value, {
    starters,
    modularStarters: modularStarterIds(starters),
    capabilityManifests: await loadCapabilityManifests(FOUNDATION_ROOT, value.capabilities),
  });
}

describe('operational delivery units', () => {
  it('emits the measured artifact status of all seven runtime adapters', async () => {
    const cases = [
      ['nestjs', { api: 'nestjs', web: null, mobile: null }, [['server-image', 'oci-image', 'blocked']]],
      ['spring', { api: 'spring', web: null, mobile: null }, [['application-jar', 'jvm-jar', 'ready']]],
      ['fastapi', { api: 'fastapi', web: null, mobile: null }, [['server-image', 'oci-image', 'ready']]],
      ['nextjs', { api: 'nestjs', web: 'nextjs', mobile: null }, [['server-image', 'oci-image', 'blocked']]],
      ['angular', { api: 'nestjs', web: 'angular', mobile: null }, [['static-bundle', 'web-static-bundle', 'ready']]],
      ['react-native', { api: 'nestjs', web: null, mobile: 'react-native' }, [
        ['update-bundle', 'mobile-update-bundle', 'ready'],
        ['android-release', 'android-package', 'blocked'],
        ['ios-release', 'ios-package', 'blocked'],
      ]],
      ['flutter', { api: 'nestjs', web: null, mobile: 'flutter' }, [
        ['android-release', 'android-package', 'blocked'],
        ['ios-release', 'ios-package', 'blocked'],
      ]],
    ];

    for (const [runtime, stack, expected] of cases) {
      const plan = await planFor(blueprint(`delivery-${runtime}`, stack));
      const unit = plan.deploymentUnits.find((candidate) => candidate.runtime === runtime);
      assert.ok(unit, runtime);
      assert.deepEqual(validateDeploymentUnit(unit), [], runtime);
      assert.deepEqual(unit.artifacts.map(({ id, kind, status }) => [id, kind, status]), expected, runtime);
    }
  });

  it('derives paths, unit dependencies and rollout orders from canonical applications', async () => {
    const value = blueprint('custom-paths', { api: 'nestjs', web: 'nextjs', mobile: null });
    delete value.stack;
    value.applications = [
      { id: 'gateway-api', kind: 'api', runtime: 'nestjs' },
      { id: 'customer-web', kind: 'web', runtime: 'nextjs', consumes: ['gateway-api'] },
    ];
    const plan = await planFor(value);
    const web = plan.deploymentUnits.find((unit) => unit.id === 'customer-web');
    assert.equal(web.artifacts[0].build.context, '.');
    assert.equal(web.artifacts[0].build.definition, 'apps/customer-web/Dockerfile');
    assert.ok(web.artifacts[0].build.command.includes('apps/customer-web/Dockerfile'));
    assert.deepEqual(web.dependencies.units, ['gateway-api']);
    assert.deepEqual(web.rollout, {
      order: 1,
      rollbackOrder: 0,
      rollbackStrategy: 'redeploy-previous-artifact',
    });
  });

  it('derives primitive dependencies from resolved capability targets', async () => {
    const plan = await planFor(blueprint(
      'primitive-dependencies',
      { api: 'fastapi', web: 'angular', mobile: 'flutter' },
      ['files'],
    ));
    const api = plan.deploymentUnits.find((unit) => unit.id === 'api');
    assert.deepEqual(api.dependencies.primitives, [
      'auth-store',
      'authorization-store',
      'files-metadata-store',
      'files-object-store',
    ]);
    assert.ok(api.configuration.secrets.some((secret) => secret.name === 'JWT_ACCESS_SECRET'));
    assert.ok(api.configuration.secrets.some((secret) => secret.name === 'S3_SECRET_ACCESS_KEY'));
    assert.ok(api.configuration.secrets.some((secret) => secret.name === 'FILE_MAX_SIZE_BYTES'));
    assert.ok(!JSON.stringify(api.configuration).includes('change_me'));
  });

  it('represents secrets only by name and an external reference', async () => {
    const plan = await planFor(blueprint('secret-references', { api: 'spring', web: null, mobile: null }));
    const serialized = JSON.stringify(plan.deploymentUnits);
    assert.ok(!serialized.includes('change-me'));
    for (const secret of plan.deploymentUnits[0].configuration.secrets) {
      assert.deepEqual(secret.reference, { kind: 'environment', key: secret.name });
      assert.deepEqual(Object.keys(secret).sort(), ['name', 'reference']);
    }
  });

  it('materializes a deterministic contract and carries the same units in the lock', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-deployment-units-'));
    const value = blueprint('delivery-contract', { api: 'fastapi', web: 'angular', mobile: 'flutter' });
    const first = join(root, 'first');
    const second = join(root, 'second');
    await generateProject(value, first, { materialize: false });
    await generateProject(value, second, { materialize: false });

    const firstSource = await readFile(join(first, 'packages/contracts/deployment-units.json'), 'utf8');
    const secondSource = await readFile(join(second, 'packages/contracts/deployment-units.json'), 'utf8');
    assert.equal(firstSource, secondSource);
    const contract = JSON.parse(firstSource);
    const lock = JSON.parse(await readFile(join(first, 'enistere.lock'), 'utf8'));
    assert.deepEqual(contract, { schemaVersion: '1', units: lock.plan.deploymentUnits });
  });
});
