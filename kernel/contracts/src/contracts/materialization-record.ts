/**
 * A8 — MaterializationRecord: semantic rules.
 *
 * The record states what the compiler wrote for one component and under which
 * ownership. Its decisions must agree with its outcome: a conflicted
 * materialization wrote nothing; an applied one met no conflict.
 */

import { timestamp } from '../primitives/checks.ts';
import { diagnostic, type Diagnostic } from '../primitives/diagnostics.ts';
import { isSafeArtifactPath } from '../primitives/paths.ts';
import type { MaterializationRecord } from '../types.ts';

export function materializationRecordItems(document: MaterializationRecord): Set<string> {
  return new Set([document.spec.subject.component]);
}

export function validateMaterializationRecord(document: MaterializationRecord, ref: string): Diagnostic[] {
  const { spec } = document;
  const found: Diagnostic[] = [...timestamp(spec.executedAt, '/spec/executedAt', ref)];
  const seen = new Set<string>();
  spec.files.forEach((file, index) => {
    const path = `/spec/files/${index}/path`;
    if (!isSafeArtifactPath(file.path)) found.push(diagnostic('MATERIALIZATION_UNSAFE_PATH', `'${file.path}' leaves the component directory or uses a reserved path`, { ref, path }));
    if (seen.has(file.path)) found.push(diagnostic('MATERIALIZATION_DUPLICATE_PATH', `'${file.path}' is recorded twice`, { ref, path }));
    seen.add(file.path);
    if (file.ownership === 'OWNER_SEEDED' && (file.decision === 'UPDATE' || file.decision === 'CONFLICT')) {
      found.push(diagnostic('MATERIALIZATION_OUTCOME_INCONSISTENT', `owner-seeded '${file.path}' cannot be ${file.decision}`, { ref, path: `/spec/files/${index}/decision` }));
    }
  });
  const conflicts = spec.files.filter((file) => file.decision === 'CONFLICT').length;
  const writes = spec.files.filter((file) => file.decision === 'CREATE' || file.decision === 'UPDATE').length;
  if (spec.outcome === 'CONFLICT' && (conflicts === 0 || writes > 0)) {
    found.push(diagnostic('MATERIALIZATION_OUTCOME_INCONSISTENT', 'a CONFLICT outcome records at least one conflict and no write', { ref, path: '/spec/outcome' }));
  }
  if (spec.outcome === 'APPLIED' && conflicts > 0) {
    found.push(diagnostic('MATERIALIZATION_OUTCOME_INCONSISTENT', 'an APPLIED outcome records no conflict', { ref, path: '/spec/outcome' }));
  }
  return found;
}
