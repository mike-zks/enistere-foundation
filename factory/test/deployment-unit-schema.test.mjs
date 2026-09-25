import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  assertDeploymentUnit,
  deploymentUnitSchema,
  validateDeploymentUnit,
} from '../engine/deployment-unit-schema.mjs';

function apiUnit() {
  return {
    schemaVersion: '1',
    id: 'core-api',
    application: 'core-api',
    runtime: 'fastapi',
    family: 'api',
    owner: 'platform-team',
    artifacts: [{
      id: 'api-image',
      kind: 'oci-image',
      status: 'ready',
      build: {
        context: 'apps/core-api',
        definition: 'apps/core-api/Dockerfile',
        command: ['docker', 'build', '--file', 'apps/core-api/Dockerfile', 'apps/core-api'],
        outputs: ['oci:core-api'],
      },
      distribution: { channel: 'oci-registry', immutable: true },
      evidence: ['golden image build'],
      blockers: [],
    }],
    configuration: {
      nonSecret: ['LOG_LEVEL'],
      secrets: [{
        name: 'DATABASE_URL',
        reference: { kind: 'secret-store', key: 'core-api/database-url' },
      }],
    },
    health: { kind: 'http', path: '/health/ready' },
    migrations: {
      kind: 'command',
      command: ['python', '-m', 'alembic', 'upgrade', 'head'],
      reversible: false,
    },
    dependencies: { units: [], primitives: ['core-database'] },
    rollout: {
      order: 0,
      rollbackOrder: 0,
      rollbackStrategy: 'restore-and-redeploy',
    },
  };
}

describe('deployment unit schema v1', () => {
  it('accepts a resolved API image with secrets by reference', () => {
    assert.deepEqual(validateDeploymentUnit(apiUnit()), []);
    assert.equal(assertDeploymentUnit(apiUnit()).id, 'core-api');
  });

  it('keeps the internal evaluator aligned with Ajv', () => {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const reference = ajv.compile(deploymentUnitSchema);
    const samples = [
      apiUnit(),
      { ...apiUnit(), family: 'mobile', health: { kind: 'none', path: null } },
      { ...apiUnit(), artifacts: [{ ...apiUnit().artifacts[0], status: 'blocked', evidence: [], blockers: [] }] },
    ];
    for (const sample of samples) {
      assert.equal(validateDeploymentUnit(sample).length === 0, reference(sample), JSON.stringify(sample));
    }
  });

  it('rejects a literal secret and an unsafe build context', () => {
    const unit = apiUnit();
    unit.configuration.secrets[0].value = 'do-not-accept-literals';
    unit.artifacts[0].build.context = '../foundation';
    const issues = validateDeploymentUnit(unit);
    assert.ok(issues.some((issue) => issue.keyword === 'additionalProperties'));
    assert.ok(issues.some((issue) => issue.path.includes('/build/context')));
  });

  it('requires evidence for ready artifacts and blockers for blocked artifacts', () => {
    const ready = apiUnit();
    ready.artifacts[0].evidence = [];
    assert.ok(validateDeploymentUnit(ready).some((issue) => issue.path.includes('/evidence')));

    const blocked = apiUnit();
    blocked.artifacts[0].status = 'blocked';
    blocked.artifacts[0].evidence = [];
    blocked.artifacts[0].blockers = [];
    assert.ok(validateDeploymentUnit(blocked).some((issue) => issue.path.includes('/blockers')));
  });

  it('forbids an OCI image from masquerading as a mobile release artifact', () => {
    const unit = apiUnit();
    unit.family = 'mobile';
    unit.runtime = 'flutter';
    unit.health = { kind: 'none', path: null };
    assert.ok(validateDeploymentUnit(unit).some((issue) => issue.path.includes('/artifacts/0/kind')));
  });
});
