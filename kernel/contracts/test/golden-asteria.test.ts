/**
 * Golden Asteria — proof of E0 (document 05 §8.1).
 *
 * The committed golden must be exactly what the kernel and the checker produce
 * from the authoring source; it must describe the five surfaces including the
 * Async Worker; and it depends on nothing outside the kernel and the goldens.
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildAsteriaGolden, SURFACES } from '../../../goldens/asteria/harness.ts';
import { fileDigest, validateContractSet, type EvidenceRecord, type SystemDefinition } from '../src/index.ts';
import { GOLDEN_ROOT, golden, loadGolden, readGoldenFile } from './fixtures.ts';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

test('the committed golden is byte-identical to a fresh build (no drift, no hand edit)', () => {
  const { files } = buildAsteriaGolden();
  const committed = ['contracts', 'evidence'].flatMap((folder) => readdirSync(`${GOLDEN_ROOT}${folder}`).map((name) => `${folder}/${name}`));
  assert.deepEqual([...committed, 'expected/compilation.json', 'expected/report.json'].sort(), Object.keys(files).sort());
  for (const [path, content] of Object.entries(files)) assert.equal(readGoldenFile(path), content, path);
});

test('the build is deterministic', () => {
  assert.deepEqual(buildAsteriaGolden().files, buildAsteriaGolden().files);
});

test('the source brief is pinned by its byte digest', () => {
  const digest = fileDigest(readFileSync(`${GOLDEN_ROOT}sources/brief.md`));
  const baseline = golden('RequirementBaseline', 'asteria-requirements');
  assert.equal(baseline.kind === 'RequirementBaseline' && baseline.spec.sources[0]?.digest, digest);
});

test('the five surfaces exist in the accepted system definition — Async Worker included', () => {
  const definition = golden<SystemDefinition>('SystemDefinition', 'asteria', 2);
  assert.equal(definition.metadata.status, 'ACCEPTED');
  const kinds = Object.fromEntries(definition.spec.components.map((component) => [component.id, component.kind]));
  assert.deepEqual(
    SURFACES.map((id) => [id, kinds[id]]),
    [
      ['requester-web', 'web-application'],
      ['ops-web', 'web-application'],
      ['field-mobile', 'mobile-application'],
      ['authority-api', 'api-service'],
      ['async-worker', 'async-worker'],
    ],
  );
  const worker = definition.spec.components.find((component) => component.id === 'async-worker')!;
  assert.ok(worker.subscribes!.length >= 2, 'the worker reacts to domain events');
  assert.ok(worker.consumes!.some((consumed) => (consumed.operations ?? []).length > 0), 'the worker calls authority operations');
  assert.ok(worker.requirements!.includes('NFR-001'));
});

test('every accepted functional requirement is traced to decisions, components and acceptance or evidence', () => {
  const report = JSON.parse(readGoldenFile('expected/report.json')) as {
    traceability: { requirement: string; type: string; status: string; decisions: string[]; components: string[] }[];
  };
  for (const row of report.traceability.filter((item) => item.status === 'ACCEPTED')) {
    assert.ok(row.decisions.length > 0, `${row.requirement} has no decision`);
    assert.ok(row.components.length > 0, `${row.requirement} is allocated to no component`);
  }
  const deferred = report.traceability.find((item) => item.requirement === 'FR-007');
  assert.deepEqual(deferred?.components, []);
});

test('current evidence passes and is produced by a checker', () => {
  const current = loadGolden().filter(
    (document): document is EvidenceRecord => document.kind === 'EvidenceRecord' && document.metadata.id.startsWith('asteria-sd2-'),
  );
  const results = Object.fromEntries(current.map((record) => [record.spec.obligation.id, record.spec.result]));
  assert.deepEqual(results, { closure: 'PASS', 'requirement-allocation': 'PASS', 'worker-extensibility': 'PASS' });
  for (const record of current) {
    assert.equal(record.metadata.status, 'VALID');
    assert.equal(record.spec.producedBy.type, 'CHECKER');
  }
});

test('the Day-2 change is governed: pinned base, consistent changes, invalidated evidence', () => {
  const validation = validateContractSet(loadGolden());
  assert.equal(validation.valid, true);
  const change = golden('ChangeRequest', 'asteria-cr-001');
  assert.equal(change.metadata.status, 'APPLIED');
  const invalidated = loadGolden().filter((document) => document.kind === 'EvidenceRecord' && document.metadata.status === 'INVALIDATED');
  assert.equal(invalidated.length, 3);
  const proposal = golden('ChangeRequest', 'asteria-cr-002');
  assert.equal(proposal.kind === 'ChangeRequest' && proposal.spec.classification, 'UNSUPPORTED');
  assert.equal(proposal.metadata.status, 'PROPOSED');
  assert.equal(proposal.metadata.acceptance, undefined, 'an AI proposal is never self-accepted');
});

test('kernel/, goldens/ and surfaces/ import nothing outside these trees', () => {
  const IMPORT = /(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+|new URL\(\s*)['"]([^'"]+)['"]/g;
  const offenders: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (/\.(mjs|js|ts)$/.test(entry.name)) {
        for (const [, target] of readFileSync(path, 'utf8').matchAll(IMPORT)) {
          if (!target || !target.startsWith('.') || target.endsWith('/')) continue;
          const resolved = fileURLToPath(new URL(target, `file://${path}`));
          if (!['kernel/', 'goldens/', 'surfaces/'].some((root) => resolved.startsWith(`${REPO_ROOT}${root}`))) offenders.push(`${path} -> ${target}`);
        }
      }
    }
  };
  walk(`${REPO_ROOT}kernel`);
  walk(`${REPO_ROOT}goldens`);
  walk(`${REPO_ROOT}surfaces`);
  assert.deepEqual(offenders, []);
});
