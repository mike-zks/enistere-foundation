/**
 * System Closure — the immutable snapshot of every normative version a
 * compilation needs (document 03, TA-10). Its digest identifies exactly what
 * was compiled.
 *
 * The closure starts at the System Definition in force and follows the stable
 * references of each `spec`, transitively. Lifecycle links held in `metadata`
 * (supersession, provenance) are history, not compilation inputs; Change
 * Requests and EvidenceRecords are never compiled.
 */

import {
  collectRefs,
  contractDigest,
  digestOf,
  documentRef,
  type AnyContract,
  type ContractIndex,
  type Digest,
  type SystemDefinition,
} from '@enistere/foundation-kernel-contracts';

export const COMPILER = Object.freeze({ id: 'foundation-kernel-compiler', version: '0.1.0' });

export interface ClosureEntry {
  ref: string;
  digest: Digest;
}

export interface SystemClosure {
  system: string;
  definition: ClosureEntry;
  /** Normative inputs reachable from the definition, sorted by reference. */
  entries: ClosureEntry[];
  compiler: { id: string; version: string };
  catalog: { digest: Digest };
  digest: Digest;
}

const entryOf = (document: AnyContract): ClosureEntry => ({ ref: documentRef(document), digest: contractDigest(document) });

/**
 * Builds the closure of a definition. The index must come from a valid
 * contract set: every reference resolves and every pinned digest matches.
 */
export function buildClosure(definition: SystemDefinition, index: ContractIndex, catalogDigest: Digest): { closure: SystemClosure; documents: AnyContract[] } {
  const reached = new Map<string, AnyContract>();
  const pending: AnyContract[] = [definition];
  while (pending.length > 0) {
    const current = pending.pop() as AnyContract;
    for (const { ref } of collectRefs(current.spec, '/spec')) {
      const target = index.get(ref);
      if (!target) throw new Error(`closure requires a closed contract set: ${ref.kind}/${ref.id}@${ref.revision} is missing`);
      const key = documentRef(target);
      if (target === definition || reached.has(key)) continue;
      reached.set(key, target);
      pending.push(target);
    }
  }
  const documents = [...reached.values()].sort((a, b) => (documentRef(a) < documentRef(b) ? -1 : 1));
  const content = {
    system: definition.spec.system,
    definition: entryOf(definition),
    entries: documents.map(entryOf),
    compiler: { ...COMPILER },
    catalog: { digest: catalogDigest },
  };
  return { closure: { ...content, digest: digestOf(content) }, documents };
}
