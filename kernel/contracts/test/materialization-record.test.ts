import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CURRENT_API_VERSION,
  fileDigest,
  isSafeArtifactPath,
  pinnedRef,
  validateContract,
  validateContractSet,
  type MaterializationRecord,
  type SystemDefinition,
} from '../src/index.ts';
import { codes, golden, loadGolden } from './fixtures.ts';

const check = (document: unknown) => codes(validateContract(document).diagnostics);
const DIGEST = `sha256:${'a'.repeat(64)}` as const;

function record(revision = 1): MaterializationRecord {
  const definition = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  const compiler = { type: 'COMPILER' as const, id: 'foundation-engine-materializer' };
  return {
    apiVersion: CURRENT_API_VERSION,
    kind: 'MaterializationRecord',
    metadata: {
      id: 'asteria-authority-api-materialization',
      revision,
      title: 'authority-api — materialization',
      status: 'VALID',
      provenance: { origin: 'COMPILER', actor: compiler, tool: { name: '@enistere/foundation-engine-materializer', version: '0.1.0' } },
    },
    spec: {
      system: 'asteria',
      subject: { contract: pinnedRef(definition), component: 'authority-api' },
      closure: DIGEST,
      plan: DIGEST,
      adapter: { id: 'nestjs', version: '0.1.0' },
      producedBy: compiler,
      outcome: 'APPLIED',
      executedAt: '2026-09-26T12:00:00Z',
      files: [
        { path: 'package.json', ownership: 'COMPILER_OWNED', digest: fileDigest('{}'), decision: 'CREATE' },
        { path: 'src/extension/extension.module.ts', ownership: 'OWNER_SEEDED', digest: fileDigest('seed'), decision: 'CREATE' },
      ],
    },
  };
}

test('a well-formed A8 record is valid and joins a closed contract set', () => {
  assert.deepEqual(check(record()), []);
  const validation = validateContractSet([...loadGolden(), record()]);
  assert.deepEqual(validation.diagnostics, []);
});

test('only the compiler exercises COMPILE_APPLY', () => {
  const ai = record();
  ai.spec.producedBy = { type: 'AI_AGENT', id: 'assistant' };
  assert.deepEqual(check(ai), ['AUTHORITY_AI_CANNOT_APPLY']);
  const human = record();
  human.metadata.provenance = { origin: 'HUMAN', actor: { type: 'HUMAN', id: 'someone@example.org' } };
  assert.deepEqual(check(human), ['AUTHORITY_ACTOR_CANNOT_APPLY']);
});

test('decisions agree with the outcome, paths stay inside the component', () => {
  const conflict = record();
  conflict.spec.outcome = 'CONFLICT';
  assert.deepEqual(check(conflict), ['MATERIALIZATION_OUTCOME_INCONSISTENT'], 'a conflict records a conflict and no write');
  const applied = record();
  applied.spec.files[0]!.decision = 'CONFLICT';
  assert.deepEqual(check(applied), ['MATERIALIZATION_OUTCOME_INCONSISTENT']);
  const seeded = record();
  seeded.spec.files[1]!.decision = 'UPDATE';
  assert.deepEqual(check(seeded), ['MATERIALIZATION_OUTCOME_INCONSISTENT'], 'a seeded file is never updated');
  const unsafe = record();
  unsafe.spec.files[0]!.path = '../outside';
  assert.deepEqual(check(unsafe), ['MATERIALIZATION_UNSAFE_PATH']);
  const duplicate = record();
  duplicate.spec.files[1]!.path = 'package.json';
  assert.ok(check(duplicate).includes('MATERIALIZATION_DUPLICATE_PATH'));
  for (const path of ['.foundation/materialization.json', '/etc/passwd', 'a/../../b']) assert.equal(isSafeArtifactPath(path), false, path);
});

test('the subject must be a component of the pinned System Definition', () => {
  const unknown = record();
  unknown.spec.subject.component = 'no-such-component';
  assert.ok(validateContractSet([...loadGolden(), unknown]).diagnostics.some((item) => item.code === 'REF_ITEM_UNRESOLVED'));
});

test('a new revision supersedes the previous one; the older stays in history', () => {
  const first = record(1);
  first.metadata.status = 'SUPERSEDED';
  const second = record(2);
  second.metadata.supersedes = pinnedRef(first);
  second.spec.files[0]!.decision = 'UNCHANGED';
  second.spec.files[1]!.decision = 'KEEP_OWNER';
  assert.deepEqual(validateContractSet([...loadGolden(), first, second]).diagnostics, []);
});
