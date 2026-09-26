import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { CURRENT_API_VERSION, digestOf, pinnedRef, type AnyContract, type EvidenceRecord, type MaterializationRecord } from '@enistere/foundation-kernel-contracts';

import { createKernelFacade, exportProofChain, PROOF_CHAIN_FORMAT, verifyProofChain, type ExtensionCatalog, type ProofChain } from '../src/index.ts';

const GOLDEN = fileURLToPath(new URL('../../../goldens/asteria/', import.meta.url));

function loadAsteria(): AnyContract[] {
  return ['contracts/', 'evidence/'].flatMap((directory) =>
    readdirSync(`${GOLDEN}${directory}`)
      .sort()
      .map((file) => JSON.parse(readFileSync(`${GOLDEN}${directory}${file}`, 'utf8')) as AnyContract),
  );
}
const catalog = (): ExtensionCatalog => JSON.parse(readFileSync(`${GOLDEN}sources/catalog.json`, 'utf8')) as ExtensionCatalog;
const codes = (items: readonly { code: string }[]): string[] => [...new Set(items.map((item) => item.code))];
const DIGEST = `sha256:${'a'.repeat(64)}` as const;

/** A first APPLIED materialization of `authority-api`, as the Engine would record it. */
function materialization(documents: readonly AnyContract[]): MaterializationRecord {
  const compilation = createKernelFacade().plan(documents, { catalog: catalog() });
  const step = compilation.plan!.steps.find((candidate) => candidate.action === 'MATERIALIZE' && candidate.component === 'authority-api');
  assert.ok(step && step.action === 'MATERIALIZE');
  const definition = documents.find((document) => document.kind === 'SystemDefinition' && document.metadata.revision === 2)!;
  const actor = { type: 'COMPILER' as const, id: 'unit-materializer' };
  return {
    apiVersion: CURRENT_API_VERSION,
    kind: 'MaterializationRecord',
    metadata: { id: 'asteria-authority-api-materialization', revision: 1, title: 'authority-api — materialization', status: 'VALID', provenance: { origin: 'COMPILER', actor } },
    spec: {
      system: 'asteria',
      subject: { contract: pinnedRef(definition), component: 'authority-api' },
      closure: compilation.closure!.digest,
      plan: compilation.plan!.digest,
      adapter: { id: step.adapter.id, version: step.adapter.version },
      producedBy: actor,
      outcome: 'APPLIED',
      executedAt: '2026-09-26T10:00:00Z',
      files: [{ path: 'README.md', ownership: 'COMPILER_OWNED', digest: DIGEST, decision: 'CREATE' }],
    },
  };
}

/** A VERIFY record of the component that cites the materialization. */
function verification(documents: readonly AnyContract[], record: MaterializationRecord): EvidenceRecord {
  const base = documents.find((document) => document.kind === 'EvidenceRecord' && document.metadata.id === 'asteria-sd2-worker-extensibility') as EvidenceRecord;
  const evidence = structuredClone(base);
  evidence.metadata.id = 'asteria-authority-api-structure';
  evidence.spec.subject = { contract: evidence.spec.subject.contract, component: 'authority-api' };
  evidence.spec.inputs = [pinnedRef(record)];
  return evidence;
}

function bundle(): { documents: AnyContract[]; chain: ProofChain } {
  const documents = loadAsteria();
  const record = materialization(documents);
  const { bundle: chain, diagnostics } = exportProofChain({ documents, catalog: catalog(), materializations: [record], evidence: [verification(documents, record)] });
  assert.deepEqual(diagnostics, []);
  return { documents, chain: chain! };
}

test('an exported proof chain verifies: digest, closed set, replay, A8 and A7 links', () => {
  const { chain } = bundle();
  assert.equal(chain.format, PROOF_CHAIN_FORMAT);
  assert.equal(chain.definition.ref, 'SystemDefinition/asteria@2');
  assert.ok(!chain.contracts.some((document) => document.kind === 'EvidenceRecord' || document.kind === 'MaterializationRecord'), 'records are carried apart');
  assert.deepEqual(verifyProofChain(JSON.parse(JSON.stringify(chain))), { valid: true, diagnostics: [] });
});

test('the export is deterministic whatever the order of the documents', () => {
  const documents = loadAsteria();
  const record = materialization(documents);
  const input = { catalog: catalog(), materializations: [record], evidence: [verification(documents, record)] };
  assert.deepEqual(exportProofChain({ ...input, documents }).bundle, exportProofChain({ ...input, documents: [...documents].reverse() }).bundle);
});

test('any change to the content breaks the bundle digest', () => {
  const { chain } = bundle();
  const tampered = structuredClone(chain);
  tampered.evidence[0]!.spec.summary = 'rewritten after the fact';
  assert.deepEqual(codes(verifyProofChain(tampered).diagnostics), ['PROOF_DIGEST_MISMATCH']);
  const edited = structuredClone(chain);
  edited.contracts[0]!.metadata.title = 'changed';
  assert.ok(codes(verifyProofChain(edited).diagnostics).includes('PROOF_DIGEST_MISMATCH'), 'a contract edit is caught too (with its broken pinned references)');
});

test('a resealed bundle whose compilation does not replay is refused', () => {
  const { chain } = bundle();
  const { digest: _digest, ...content } = structuredClone(chain);
  content.compilation.plan = DIGEST;
  const resealed = { ...content, digest: digestOf(content) };
  const result = verifyProofChain(resealed);
  assert.equal(result.valid, false);
  assert.ok(codes(result.diagnostics).includes('PROOF_REPLAY_MISMATCH'));
  assert.ok(codes(result.diagnostics).includes('PROOF_RECORD_MISMATCH'), 'the A8 no longer describes the recorded plan');
});

test('component evidence that cites no bundled materialization is unlinked', () => {
  const documents = loadAsteria();
  const record = materialization(documents);
  const unlinked = verification(documents, record);
  unlinked.spec.inputs = [unlinked.spec.subject.contract];
  const { bundle: chain } = exportProofChain({ documents, catalog: catalog(), materializations: [record], evidence: [unlinked] });
  assert.deepEqual(codes(verifyProofChain(chain).diagnostics), ['PROOF_EVIDENCE_UNLINKED']);
});

test('a malformed bundle and an invalid compilation are reported, never exported', () => {
  assert.deepEqual(codes(verifyProofChain({ format: 'other' }).diagnostics), ['PROOF_MALFORMED']);
  assert.deepEqual(codes(verifyProofChain(null).diagnostics), ['PROOF_MALFORMED']);
  const { bundle: none, diagnostics } = exportProofChain({ documents: [], catalog: catalog(), materializations: [], evidence: [] });
  assert.equal(none, null);
  assert.ok(diagnostics.length > 0);
});
