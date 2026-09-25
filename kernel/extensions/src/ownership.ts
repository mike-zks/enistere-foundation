/**
 * Ownership rule of materialization (document 02 FR-OWN-02: no silent
 * overwrite of owner-managed code). Pure: the Engine supplies the digests of
 * what exists and of what it last wrote; the rule decides.
 *
 * | Artifact        | File absent | Unchanged since last write | Changed by someone else |
 * |-----------------|-------------|----------------------------|-------------------------|
 * | COMPILER_OWNED  | CREATE      | UPDATE (or UNCHANGED)      | CONFLICT — never written |
 * | OWNER_SEEDED    | CREATE      | KEEP — owner's from now on | KEEP                     |
 *
 * A file present without any inventory entry was not written by the
 * compiler: a compiler-owned artifact at that path is a conflict.
 */

import type { Digest } from '@enistere/foundation-kernel-contracts';

import type { PlannedArtifact } from './adapter.ts';

export type WriteDecision = 'CREATE' | 'UPDATE' | 'UNCHANGED' | 'KEEP_OWNER' | 'CONFLICT';

export function decideWrite(artifact: PlannedArtifact, existing: Digest | null, lastWritten: Digest | null): WriteDecision {
  if (existing === null) return 'CREATE';
  if (artifact.ownership === 'OWNER_SEEDED') return 'KEEP_OWNER';
  if (existing === artifact.digest) return 'UNCHANGED';
  if (lastWritten !== null && existing === lastWritten) return 'UPDATE';
  return 'CONFLICT';
}

/** Decisions that change the workspace. */
export const WRITES: ReadonlySet<WriteDecision> = new Set(['CREATE', 'UPDATE']);
