import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { parseArguments } from '../src/cli.ts';

const CLI = fileURLToPath(new URL('../src/cli.ts', import.meta.url));
const GOLDEN = fileURLToPath(new URL('../../../goldens/asteria/', import.meta.url));
const SET = [`${GOLDEN}contracts`, `${GOLDEN}evidence`];
const CATALOG = `${GOLDEN}sources/catalog.json`;

function cli(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

test('validate reports the closed golden set as valid (exit 0)', () => {
  const run = cli('validate', ...SET);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.parse(run.stdout).status, 'VALID');
});

test('plan against the synthetic catalog is PARTIAL (exit 2) and matches the committed golden', () => {
  const run = cli('plan', ...SET, '--catalog', CATALOG);
  assert.equal(run.status, 2, run.stderr);
  assert.equal(`${run.stdout}`, readFileSync(`${GOLDEN}expected/compilation.json`, 'utf8'), 'the CLI adds no logic of its own');
});

test('plan without catalog lists every component as UNSUPPORTED (exit 2)', () => {
  const run = cli('plan', ...SET);
  assert.equal(run.status, 2);
  const result = JSON.parse(run.stdout);
  assert.equal(result.plan.steps.length, 0);
  assert.equal(result.plan.unsupported.length, result.ir.components.length);
});

test('an altered contract makes the set INVALID (exit 1)', () => {
  const directory = mkdtempSync(join(tmpdir(), 'enistere-cli-'));
  try {
    cpSync(`${GOLDEN}contracts`, `${directory}/contracts`, { recursive: true });
    cpSync(`${GOLDEN}evidence`, `${directory}/evidence`, { recursive: true });
    const path = `${directory}/contracts/system-definition--asteria--r2.json`;
    const document = JSON.parse(readFileSync(path, 'utf8'));
    document.spec.purpose = 'tampered after pinning';
    writeFileSync(path, JSON.stringify(document));
    const run = cli('resolve', directory, '--catalog', CATALOG);
    assert.equal(run.status, 1);
    assert.equal(JSON.parse(run.stdout).status, 'INVALID');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('usage errors exit 64 without running the façade', () => {
  assert.equal(cli('deploy', ...SET).status, 64);
  assert.equal(cli('plan').status, 64);
  assert.equal(cli('plan', ...SET, '--catalog').status, 64);
  assert.equal(cli('plan', `${GOLDEN}does-not-exist`).status, 64);
  assert.deepEqual(parseArguments(['plan', 'a', '--definition', 'x', 'b']), { command: 'plan', paths: ['a', 'b'], definition: 'x', toolchain: false });
});

const EXTENSIONS = fileURLToPath(new URL('../../../extensions/', import.meta.url));

test('materialize then verify: PARTIAL (2), idempotent, structural PASS (0), conflicts exit 3', () => {
  const directory = mkdtempSync(join(tmpdir(), 'enistere-cli-ws-'));
  try {
    const first = cli('materialize', ...SET, '--extensions', EXTENSIONS, '--out', directory);
    assert.equal(first.status, 2, first.stderr);
    const result = JSON.parse(first.stdout);
    assert.equal(result.status, 'PARTIAL');
    assert.deepEqual(result.records.map((record: { component: string; status: string }) => [record.component, record.status]), [['authority-api', 'APPLIED']]);
    assert.ok(result.unsupported.some((item: { capability: string | null }) => item.capability === 'authentication'), 'capabilities are listed, never dropped');

    const again = JSON.parse(cli('materialize', ...SET, '--extensions', EXTENSIONS, '--out', directory).stdout);
    assert.ok(again.records[0].files.every((file: { decision: string }) => ['UNCHANGED', 'KEEP_OWNER'].includes(file.decision)));

    const verified = cli('verify', directory, '--extensions', EXTENSIONS);
    assert.equal(verified.status, 0, verified.stdout);
    assert.deepEqual(JSON.parse(verified.stdout).evidence.map((item: { obligation: string; result: string }) => [item.obligation, item.result]), [['structure', 'PASS']]);

    writeFileSync(join(directory, 'authority-api/src/main.ts'), '// edited by hand\n');
    assert.equal(cli('materialize', ...SET, '--extensions', EXTENSIONS, '--out', directory).status, 3);
    assert.equal(cli('verify', directory, '--extensions', EXTENSIONS).status, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('materialize and verify refuse incomplete invocations (exit 64)', () => {
  assert.equal(cli('materialize', ...SET, '--extensions', EXTENSIONS).status, 64);
  assert.equal(cli('materialize', ...SET, '--out', '/tmp/x').status, 64);
  assert.equal(cli('verify', '/tmp/a', '/tmp/b', '--extensions', EXTENSIONS).status, 64);
  assert.equal(cli('plan', ...SET, '--catalog', CATALOG, '--extensions', EXTENSIONS).status, 64);
});
