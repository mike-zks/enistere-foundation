/**
 * A7 — EvidenceRecord: semantic rules and staleness.
 *
 * Evidence is relative to exact inputs: a record pins the digests of what it
 * checked. When one of those contracts gets a newer revision, the record no
 * longer describes the current state and is reported stale (FR-EVI-04).
 */

import { timestamp } from '../primitives/checks.ts';
import { diagnostic, type Diagnostic } from '../primitives/diagnostics.ts';
import type { ContractRef } from '../primitives/refs.ts';
import type { EvidenceRecord } from '../types.ts';

/** Credentials in userinfo, or secret-looking query parameters. */
const SECRET_IN_URI = /^[a-z][a-z0-9+.-]*:\/\/[^/?#@\s]*:[^/?#@\s]*@|[?&](?:token|access_token|password|passwd|secret|api[_-]?key|signature|x-amz-signature)=/i;

export function evidenceRecordItems(document: EvidenceRecord): Set<string> {
  return new Set([document.spec.obligation.id]);
}

export function validateEvidenceRecord(document: EvidenceRecord, ref: string): Diagnostic[] {
  const { spec, metadata } = document;
  const found: Diagnostic[] = [...timestamp(spec.observedAt, '/spec/observedAt', ref), ...timestamp(spec.expiresAt, '/spec/expiresAt', ref)];
  if (spec.expiresAt !== undefined && found.length === 0 && Date.parse(spec.expiresAt) <= Date.parse(spec.observedAt)) {
    found.push(diagnostic('EVIDENCE_EXPIRY_BEFORE_OBSERVATION', 'expiresAt is not later than observedAt', { ref, path: '/spec/expiresAt' }));
  }
  if (metadata.status === 'INVALIDATED' && !spec.invalidation) {
    found.push(diagnostic('EVIDENCE_INVALIDATION_MISSING', 'INVALIDATED record without invalidation', { ref, path: '/spec/invalidation' }));
  }
  spec.artifacts.forEach((artifact, index) => {
    if (SECRET_IN_URI.test(artifact.uri)) {
      found.push(diagnostic('EVIDENCE_SECRET_IN_URI', 'artifact URI carries credentials', { ref, path: `/spec/artifacts/${index}/uri` }));
    }
  });
  if (spec.waiver && !['FAIL', 'INCONCLUSIVE'].includes(spec.result)) {
    found.push(diagnostic('EVIDENCE_WAIVER_WITHOUT_FAILURE', `waiver attached to a ${spec.result} result`, { ref, path: '/spec/waiver' }));
  }
  return found;
}

export interface Staleness {
  stale: boolean;
  outdated: { pinned: ContractRef; currentRevision: number }[];
}

/**
 * Compares what a record checked with what is in force now. For each contract
 * (kind + id), the newest revision among the subject and the inputs is the one
 * the record speaks about; older revisions in the inputs are only history (a
 * check of revision 2 legitimately reads the revision 1 it supersedes). The
 * record is stale when a newer revision than the one it checked is in force.
 * `inForceRevision` returns the highest in-force revision of a contract.
 */
export function evidenceStaleness(record: EvidenceRecord, inForceRevision: (kind: string, id: string) => number | undefined): Staleness {
  const newest = new Map<string, ContractRef>();
  for (const input of [record.spec.subject.contract, ...record.spec.inputs]) {
    const key = `${input.kind}/${input.id}`;
    const known = newest.get(key);
    if (!known || input.revision > known.revision) newest.set(key, input);
  }
  const outdated: Staleness['outdated'] = [];
  for (const key of [...newest.keys()].sort()) {
    const pinned = newest.get(key) as ContractRef;
    const current = inForceRevision(pinned.kind, pinned.id);
    if (current !== undefined && current > pinned.revision) outdated.push({ pinned, currentRevision: current });
  }
  return { stale: outdated.length > 0, outdated };
}
