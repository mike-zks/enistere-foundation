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
import { buildAsteriaGolden, SURFACES } from '../asteria/harness.ts';
import { verifyProofChain } from '../../kernel/compiler/src/index.ts';
import { fileDigest, validateContractSet, type EvidenceRecord, type SystemDefinition } from '../../kernel/contracts/src/index.ts';
import { GOLDEN_ROOT, golden, loadGolden, readGoldenFile } from '../../kernel/contracts/test/fixtures.ts';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));

test('the committed golden is byte-identical to a fresh build (no drift, no hand edit)', () => {
  const { files } = buildAsteriaGolden();
  const committed = ['contracts', 'evidence'].flatMap((folder) => readdirSync(`${GOLDEN_ROOT}${folder}`).map((name) => `${folder}/${name}`));
  assert.deepEqual([...committed, 'expected/compilation.json', 'expected/materialization.json', 'expected/proof-chain.json', 'expected/report.json'].sort(), Object.keys(files).sort());
  for (const [path, content] of Object.entries(files)) assert.equal(readGoldenFile(path), content, path);
});

test('the committed proof chain verifies outside the repository: digest, closed set, replay (E4)', () => {
  const bundle = JSON.parse(readGoldenFile('expected/proof-chain.json')) as { compilation: { plan: string }; materializations: { spec: { subject: { component: string } } }[] };
  assert.deepEqual(verifyProofChain(bundle), { valid: true, diagnostics: [] });
  assert.deepEqual(bundle.materializations.map((record) => record.spec.subject.component), ['authority-api']);
  const tampered = structuredClone(bundle);
  tampered.compilation.plan = `sha256:${'0'.repeat(64)}`;
  assert.equal(verifyProofChain(tampered).valid, false);
});

test('the domain is projected once, as one API contract shared by its provider and its consumers (E5)', () => {
  const compilation = JSON.parse(readGoldenFile('expected/compilation.json')) as {
    apiContracts: { id: string; digest: string; provider: string; consumers: string[] }[];
    plan: { sharedContracts: { id: string; digest: string }[] };
  };
  const materialization = JSON.parse(readGoldenFile('expected/materialization.json')) as { plan: { sharedContracts: { id: string; digest: string }[] } };
  const [contract] = compilation.apiContracts;
  assert.equal(compilation.apiContracts.length, 1);
  assert.equal(contract?.provider, 'authority-api');
  assert.deepEqual(contract?.consumers, ['async-worker', 'field-mobile', 'ops-web', 'requester-web']);
  assert.deepEqual(compilation.plan.sharedContracts.map((item) => [item.id, item.digest]), [[contract?.id, contract?.digest]]);
  assert.deepEqual(materialization.plan.sharedContracts, compilation.plan.sharedContracts, 'the contract does not depend on the extensions available');
});

test('organization policies apply to the compilation: W-001 waives staging, nothing is silently ignored (E6)', () => {
  const compilation = JSON.parse(readGoldenFile('expected/compilation.json')) as {
    policy: { evaluations: { rule: string; subject: string | null; outcome: string; waiver: { id: string } | null }[] };
    ir: { designBindings: { component: string; context: string; designSystem: { ref: string } }[] };
  };
  const outcomes = new Set(compilation.policy.evaluations.map((item) => item.outcome));
  assert.ok(!outcomes.has('VIOLATED'));
  assert.deepEqual(compilation.policy.evaluations.filter((item) => item.outcome === 'WAIVED').map((item) => [item.rule, item.subject, item.waiver?.id]), [['data.residency', 'staging', 'W-001']]);
  assert.deepEqual(compilation.policy.evaluations.filter((item) => item.outcome === 'NOT_EVALUATED').map((item) => item.rule), ['ai.decide.allowed', 'deployment.image.reference', 'evidence.retention.days']);
  assert.deepEqual(
    compilation.ir.designBindings.map((binding) => [binding.component, binding.context, binding.designSystem.ref]),
    [
      ['field-mobile', 'field', 'DesignSystem/operator-design-system@1'],
      ['ops-web', 'back-office', 'DesignSystem/operator-design-system@1'],
      ['requester-web', 'public-portal', 'DesignSystem/operator-design-system@1'],
    ],
  );
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

/**
 * Dependency direction between zones (document 03 §6.19): the Kernel depends
 * on nothing else; the Engine on the Kernel; extensions on the Kernel only
 * (the Engine reaches them through their manifests, never by import); surfaces
 * and goldens compose the rest.
 */
const ALLOWED: Readonly<Record<string, readonly string[]>> = Object.freeze({
  kernel: ['kernel'],
  engine: ['kernel', 'engine'],
  extensions: ['kernel', 'extensions'],
  surfaces: ['kernel', 'engine', 'surfaces'],
  goldens: ['kernel', 'engine', 'goldens'],
});
const PACKAGE_ZONE: Readonly<Record<string, string>> = Object.freeze({
  '@enistere/foundation-kernel-': 'kernel',
  '@enistere/foundation-engine-': 'engine',
  '@enistere/foundation-adapter-': 'extensions',
  '@enistere/foundation-cli': 'surfaces',
});
const zoneOfPackage = (name: string): string | undefined => Object.entries(PACKAGE_ZONE).find(([prefix]) => name.startsWith(prefix))?.[1];

test('each zone imports only the zones it may depend on (relative paths and packages)', () => {
  const IMPORT = /(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+|new URL\(\s*)['"]([^'"]+)['"]/g;
  const offenders: string[] = [];
  const walk = (zone: string, dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(zone, path);
      else if (entry.name === 'package.json') {
        const manifest = JSON.parse(readFileSync(path, 'utf8')) as { dependencies?: Record<string, string> };
        for (const name of Object.keys(manifest.dependencies ?? {})) {
          const target = zoneOfPackage(name);
          if (target !== undefined && !ALLOWED[zone]!.includes(target)) offenders.push(`${path} depends on ${name}`);
        }
      } else if (/\.(mjs|js|ts)$/.test(entry.name)) {
        for (const [, target] of readFileSync(path, 'utf8').matchAll(IMPORT)) {
          if (!target) continue;
          if (target.startsWith('@enistere/')) {
            const packageZone = zoneOfPackage(target);
            if (packageZone !== undefined && !ALLOWED[zone]!.includes(packageZone)) offenders.push(`${path} -> ${target}`);
            continue;
          }
          if (!target.startsWith('.') || target.endsWith('/')) continue;
          const resolved = fileURLToPath(new URL(target, `file://${path}`));
          if (!ALLOWED[zone]!.some((root) => resolved.startsWith(`${REPO_ROOT}${root}/`))) offenders.push(`${path} -> ${target}`);
        }
      }
    }
  };
  for (const zone of Object.keys(ALLOWED)) walk(zone, `${REPO_ROOT}${zone}`);
  assert.deepEqual(offenders, []);
});
