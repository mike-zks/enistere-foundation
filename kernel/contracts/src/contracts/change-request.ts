/**
 * A6 — Change Request: semantic rules.
 *
 * A change always starts from one exact base revision pinned by digest. The
 * classification bounds what may happen next: UNSUPPORTED never proceeds,
 * MIGRATION_REQUIRED carries its migration, MANUAL_ONLY carries its owner work.
 */

import { idSet, knownIds, uniqueIds } from '../primitives/checks.ts';
import { diagnostic, type Diagnostic } from '../primitives/diagnostics.ts';
import { contractDigest } from '../identity.ts';
import { digestOf } from '../primitives/digest.ts';
import { formatRef } from '../primitives/refs.ts';
import type { AnyContract, ChangeRequest, SystemDefinition } from '../types.ts';

const PROCEEDING = new Set(['ACCEPTED', 'APPLIED']);

export function changeRequestItems(document: ChangeRequest): Set<string> {
  return idSet(document.spec.impact.ownerWork);
}

export function validateChangeRequest(document: ChangeRequest, ref: string): Diagnostic[] {
  const { spec, metadata } = document;
  const found: Diagnostic[] = [...uniqueIds(spec.impact.ownerWork, '/spec/impact/ownerWork', ref)];
  if (spec.proposed) {
    if (spec.proposed.kind !== spec.base.kind || spec.proposed.id !== spec.base.id || spec.proposed.revision <= spec.base.revision) {
      found.push(
        diagnostic('CHANGE_TARGET_MISMATCH', `proposed ${formatRef(spec.proposed)} is not a newer revision of ${formatRef(spec.base)}`, {
          ref,
          path: '/spec/proposed',
        }),
      );
    }
  } else if (metadata.status === 'APPLIED') {
    found.push(diagnostic('CHANGE_TARGET_MISMATCH', 'an APPLIED change names the revision it produced', { ref, path: '/spec/proposed' }));
  }
  if (spec.classification === 'UNSUPPORTED' && PROCEEDING.has(metadata.status)) {
    found.push(diagnostic('CHANGE_UNSUPPORTED_CANNOT_PROCEED', `an UNSUPPORTED change cannot be ${metadata.status}`, { ref, path: '/metadata/status' }));
  }
  if (spec.classification === 'MIGRATION_REQUIRED' && !spec.impact.migration) {
    found.push(diagnostic('CHANGE_MIGRATION_MISSING', 'MIGRATION_REQUIRED without migration strategy', { ref, path: '/spec/impact/migration' }));
  }
  if (spec.classification === 'MANUAL_ONLY' && spec.impact.ownerWork.length === 0) {
    found.push(diagnostic('CHANGE_OWNER_WORK_MISSING', 'MANUAL_ONLY without owner work', { ref, path: '/spec/impact/ownerWork' }));
  }
  return found;
}

/** Impacted components exist in the base System Definition. */
export function crossValidateChangeRequest(document: ChangeRequest, ref: string, base: AnyContract): Diagnostic[] {
  if (base.kind !== 'SystemDefinition') return [];
  const components = idSet((base as SystemDefinition).spec.components);
  const found = knownIds(document.spec.impact.components, components, '/spec/impact/components', ref, 'CHANGE_UNKNOWN_COMPONENT', 'component');
  document.spec.impact.ownerWork.forEach((work, index) => {
    if (work.component !== undefined && !components.has(work.component)) {
      found.push(diagnostic('CHANGE_UNKNOWN_COMPONENT', `unknown component '${work.component}'`, { ref, path: `/spec/impact/ownerWork/${index}/component` }));
    }
  });
  return found;
}

function decodePointer(path: string): string[] {
  return path
    .split('/')
    .slice(1)
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'));
}

/**
 * Applies the declared changes (RFC 6901 pointers under `/spec`) to a copy of a
 * document, in order. Pure: the input is never mutated. Returns the error of
 * the first change that cannot apply (missing target, existing key on ADD...).
 */
export function applyChanges(
  document: AnyContract,
  changes: ChangeRequest['spec']['changes'],
): { document: AnyContract | null; error: { index: number; reason: string } | null } {
  const copy = structuredClone(document) as unknown as Record<string, unknown>;
  for (const [index, change] of changes.entries()) {
    const segments = decodePointer(change.path);
    const last = segments.pop() as string;
    let parent: unknown = copy;
    for (const segment of segments) {
      parent = Array.isArray(parent) ? parent[Number(segment)] : (parent as Record<string, unknown> | undefined)?.[segment];
      if (parent === null || typeof parent !== 'object') return { document: null, error: { index, reason: `no container at ${change.path}` } };
    }
    if (Array.isArray(parent)) {
      const position = last === '-' ? parent.length : /^(0|[1-9][0-9]*)$/.test(last) ? Number(last) : Number.NaN;
      const bound = change.op === 'ADD' ? parent.length : parent.length - 1;
      if (Number.isNaN(position) || position > bound || (last === '-' && change.op !== 'ADD')) {
        return { document: null, error: { index, reason: `invalid array index '${last}' at ${change.path}` } };
      }
      if (change.op === 'ADD') parent.splice(position, 0, structuredClone(change.value));
      else if (change.op === 'REPLACE') parent[position] = structuredClone(change.value);
      else parent.splice(position, 1);
      continue;
    }
    const record = parent as Record<string, unknown>;
    const exists = Object.hasOwn(record, last);
    if (change.op === 'ADD' && exists) return { document: null, error: { index, reason: `ADD on existing member ${change.path}` } };
    if (change.op !== 'ADD' && !exists) return { document: null, error: { index, reason: `${change.op} on missing member ${change.path}` } };
    if (change.op === 'REMOVE') delete record[last];
    else record[last] = structuredClone(change.value);
  }
  return { document: copy as unknown as AnyContract, error: null };
}

/** The declared changes turn the base spec into exactly the proposed spec. */
export function verifyChangeConsistency(change: ChangeRequest, base: AnyContract, proposed: AnyContract): Diagnostic[] {
  const ref = formatRef({ kind: change.kind, id: change.metadata.id, revision: change.metadata.revision });
  const applied = applyChanges(base, change.spec.changes);
  if (applied.error) {
    return [diagnostic('CHANGE_INCONSISTENT', applied.error.reason, { ref, path: `/spec/changes/${applied.error.index}` })];
  }
  if (digestOf(applied.document?.spec) !== digestOf(proposed.spec)) {
    return [diagnostic('CHANGE_INCONSISTENT', `applying the changes to ${formatRef(change.spec.base)} does not produce the spec of ${formatRef(change.spec.proposed ?? change.spec.base)}`, { ref, path: '/spec/changes' })];
  }
  return [];
}

/**
 * Checks that a Change Request still applies to the current revision of its
 * target. A base that moved on (new revision or different digest) is stale:
 * the change must be rebased, never applied on top of an unknown state.
 */
export function verifyChangeBase(change: ChangeRequest, current: AnyContract): Diagnostic[] {
  const ref = formatRef({ kind: change.kind, id: change.metadata.id, revision: change.metadata.revision });
  const { base } = change.spec;
  if (current.kind !== base.kind || current.metadata.id !== base.id) {
    return [diagnostic('CHANGE_TARGET_MISMATCH', `current document is not ${base.kind}/${base.id}`, { ref, path: '/spec/base' })];
  }
  const digest = contractDigest(current);
  if (current.metadata.revision !== base.revision || digest !== base.digest) {
    return [
      diagnostic('CHANGE_BASE_STALE', `base ${formatRef(base)} is not the current revision (${current.metadata.revision})`, {
        ref,
        path: '/spec/base',
        details: { expected: base.digest, actual: digest, currentRevision: current.metadata.revision },
      }),
    ];
  }
  return [];
}
