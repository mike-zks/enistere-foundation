/**
 * Proof chain — a self-contained JSON bundle of what was decided, compiled,
 * materialized and verified, checkable outside the repository (mission E4,
 * ADR-098).
 *
 * The bundle carries the contracts (the definition, its closure and every
 * revision they reference), the extension catalog, the compilation digests,
 * the MaterializationRecords (A8) and the EvidenceRecords (A7). Verification
 * reuses the kernel: the contracts form a closed, valid set
 * (`validateContractSet`) and the compilation is **replayed** by the façade,
 * which must give the same closure, IR, resolution and plan digests. Every
 * A8 must cite that closure, that plan and that definition; every A7 about a
 * component must cite an A8 of the bundle.
 *
 * Signature and in-toto/SLSA envelopes can wrap the bundle later without
 * changing its content.
 */

import {
  collectRefs,
  diagnostic,
  digestOf,
  documentKey,
  formatRef,
  hasErrors,
  indexContracts,
  parseRef,
  sortDiagnostics,
  validateContractSet,
  type AnyContract,
  type Diagnostic,
  type Digest,
  type EvidenceRecord,
  type MaterializationRecord,
} from '@enistere/foundation-kernel-contracts';

import type { ExtensionCatalog } from './catalog.ts';
import { createKernelFacade } from './facade.ts';

export const PROOF_CHAIN_FORMAT = 'foundation.enistere.com/proof-chain/v1';

export interface ProofChain {
  format: typeof PROOF_CHAIN_FORMAT;
  system: string;
  definition: { ref: string; digest: Digest };
  catalog: ExtensionCatalog;
  compilation: { closure: Digest; ir: Digest; resolved: Digest; plan: Digest };
  contracts: AnyContract[];
  materializations: MaterializationRecord[];
  evidence: EvidenceRecord[];
  digest: Digest;
}

export interface ProofChainInput {
  /** Every contract available (a superset of what the bundle needs). */
  documents: readonly AnyContract[];
  catalog: ExtensionCatalog;
  /** Id of the System Definition to compile when several are in force. */
  definition?: string;
  materializations: readonly MaterializationRecord[];
  evidence: readonly EvidenceRecord[];
}

const LAYER = { layer: 'kernel.compiler' } as const;
const byKey = (a: AnyContract, b: AnyContract): number => (documentKey(a) < documentKey(b) ? -1 : documentKey(a) > documentKey(b) ? 1 : 0);

/** The given roots plus every revision they reference, transitively (metadata included). */
function referenceClosure(roots: readonly AnyContract[], available: readonly AnyContract[]): AnyContract[] {
  const index = indexContracts(available);
  const reached = new Map<string, AnyContract>();
  const pending = [...roots];
  while (pending.length > 0) {
    const current = pending.pop() as AnyContract;
    const key = documentKey(current);
    if (reached.has(key)) continue;
    reached.set(key, current);
    for (const { ref } of collectRefs(current)) {
      const target = index.get(ref);
      if (target && !reached.has(documentKey(target))) pending.push(target);
    }
  }
  return [...reached.values()];
}

/** Builds the bundle; returns diagnostics instead when the compilation is not valid. */
export function exportProofChain(input: ProofChainInput): { bundle: ProofChain | null; diagnostics: Diagnostic[] } {
  const compilation = createKernelFacade().plan(input.documents, { catalog: input.catalog, definition: input.definition });
  if (compilation.status === 'INVALID' || !compilation.plan || !compilation.closure || !compilation.ir || !compilation.resolved || !compilation.definition) {
    return { bundle: null, diagnostics: compilation.diagnostics };
  }
  const definition = input.documents.find((document) => document.kind === 'SystemDefinition' && formatRef({ kind: document.kind, id: document.metadata.id, revision: document.metadata.revision }) === compilation.definition?.ref);
  const records = [...input.materializations, ...input.evidence] as AnyContract[];
  const everything = [...input.documents, ...records];
  const contracts = referenceClosure([definition as AnyContract, ...records], everything)
    .filter((document) => document.kind !== 'MaterializationRecord' && document.kind !== 'EvidenceRecord')
    .sort(byKey);
  const content = {
    format: PROOF_CHAIN_FORMAT,
    system: compilation.ir.system,
    definition: compilation.definition,
    catalog: input.catalog,
    compilation: { closure: compilation.closure.digest, ir: compilation.ir.digest, resolved: compilation.resolved.digest, plan: compilation.plan.digest },
    contracts,
    materializations: [...input.materializations].sort(byKey),
    evidence: [...input.evidence].sort(byKey),
  };
  return { bundle: { ...content, digest: digestOf(content) } as ProofChain, diagnostics: [] };
}

/** Verifies a bundle read from anywhere. */
export function verifyProofChain(value: unknown): { valid: boolean; diagnostics: Diagnostic[] } {
  const found: Diagnostic[] = [];
  const bundle = value as Partial<ProofChain> | null;
  if (!bundle || typeof bundle !== 'object' || bundle.format !== PROOF_CHAIN_FORMAT || !Array.isArray(bundle.contracts) || !Array.isArray(bundle.materializations) || !Array.isArray(bundle.evidence)) {
    return { valid: false, diagnostics: [diagnostic('PROOF_MALFORMED', `not a ${PROOF_CHAIN_FORMAT} bundle`, LAYER)] };
  }
  const { digest, ...content } = bundle as ProofChain;
  if (digestOf(content) !== digest) found.push(diagnostic('PROOF_DIGEST_MISMATCH', 'the bundle content does not match its digest', LAYER));

  const set = validateContractSet([...bundle.contracts, ...bundle.materializations, ...bundle.evidence]);
  for (const item of set.diagnostics.filter((entry) => entry.severity === 'error')) found.push(item);

  const replay = createKernelFacade().plan(bundle.contracts, { catalog: bundle.catalog, definition: parseRef(bundle.definition?.ref ?? '')?.id });
  const expected = bundle.compilation;
  const replayed = { closure: replay.closure?.digest, ir: replay.ir?.digest, resolved: replay.resolved?.digest, plan: replay.plan?.digest };
  for (const key of ['closure', 'ir', 'resolved', 'plan'] as const) {
    if (!expected || replayed[key] !== expected[key]) {
      found.push(diagnostic('PROOF_REPLAY_MISMATCH', `replaying the compilation gives another ${key} digest`, { ...LAYER, details: { stage: key, recorded: expected?.[key] ?? null, replayed: replayed[key] ?? null } }));
    }
  }
  if (replay.definition?.digest !== bundle.definition?.digest) found.push(diagnostic('PROOF_REPLAY_MISMATCH', 'the replayed definition differs from the recorded one', { ...LAYER, details: { stage: 'definition' } }));

  const materializationKeys = new Set(bundle.materializations.map((record) => documentKey(record)));
  for (const record of bundle.materializations) {
    const ref = formatRef({ kind: record.kind, id: record.metadata.id, revision: record.metadata.revision });
    if (record.spec.plan !== expected?.plan || record.spec.closure !== expected?.closure || record.spec.subject.contract.digest !== bundle.definition?.digest) {
      // A superseded record may legitimately describe an earlier compilation.
      if (record.metadata.status === 'VALID') found.push(diagnostic('PROOF_RECORD_MISMATCH', `${ref} does not describe this compilation`, { ...LAYER, ref }));
    }
  }
  for (const record of bundle.evidence) {
    if (record.spec.subject.component === undefined) continue;
    const cites = record.spec.inputs.some((input) => input.kind === 'MaterializationRecord' && materializationKeys.has(`${input.kind}/${input.id}@${input.revision}`));
    if (!cites) {
      const ref = formatRef({ kind: record.kind, id: record.metadata.id, revision: record.metadata.revision });
      found.push(diagnostic('PROOF_EVIDENCE_UNLINKED', `${ref} verifies a component but cites no materialization of the bundle`, { ...LAYER, ref }));
    }
  }
  const diagnostics = sortDiagnostics(found);
  return { valid: !hasErrors(diagnostics), diagnostics };
}
