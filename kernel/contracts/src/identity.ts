/**
 * Identity of a contract revision: stable reference + content digest.
 *
 * The content digest covers the whole document except `metadata.status`. The
 * status is lifecycle state, not content: an accepted revision that is later
 * SUPERSEDED (or an Evidence record that EXPIRES) keeps the identity every
 * reference pinned. Everything else — spec, provenance, acceptance, owner,
 * supersession — is content: changing it requires a new revision.
 */

import { digestOf, type Digest } from './primitives/digest.ts';
import { formatRef, refKey, type ContractRef } from './primitives/refs.ts';
import type { ContractDocument } from './types.ts';

export function contentOf(document: ContractDocument): Record<string, unknown> {
  const { status: _status, ...metadata } = document.metadata;
  return { apiVersion: document.apiVersion, kind: document.kind, metadata, spec: document.spec };
}

/** sha256 (JCS) of the document content, lifecycle status excluded. */
export function contractDigest(document: ContractDocument): Digest {
  return digestOf(contentOf(document));
}

/** The pinned reference of a document, optionally narrowed to an item. */
export function pinnedRef(document: ContractDocument, item?: string): ContractRef {
  const ref: ContractRef = { kind: document.kind, id: document.metadata.id, revision: document.metadata.revision, digest: contractDigest(document) };
  if (item !== undefined) ref.item = item;
  return ref;
}

export function documentKey(document: ContractDocument): string {
  return refKey({ kind: document.kind, id: document.metadata.id, revision: document.metadata.revision });
}

export function documentRef(document: ContractDocument): string {
  return formatRef({ kind: document.kind, id: document.metadata.id, revision: document.metadata.revision });
}
