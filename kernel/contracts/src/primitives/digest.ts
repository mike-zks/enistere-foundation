/**
 * Content digests. A digest identifies exactly what was accepted, derived,
 * checked or compiled: sha256 over the RFC 8785 canonical serialization.
 *
 * The digest of a contract covers the whole document (apiVersion, kind,
 * metadata, spec). A document never stores its own digest; references to it pin
 * the digest instead, so a changed document can never keep a stale identity.
 */

import { createHash } from 'node:crypto';
import { canonicalize } from './canonical-json.ts';

export const DIGEST_ALGORITHM = 'sha256+jcs';
export const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;

export type Digest = `sha256:${string}`;

/** sha256 digest of the canonical serialization of a JSON value. */
export function digestOf(value: unknown): Digest {
  return `sha256:${createHash('sha256').update(canonicalize(value), 'utf8').digest('hex')}`;
}

/**
 * sha256 digest of raw bytes (a source artifact such as a brief). Unlike
 * `digestOf`, no canonicalization happens: the bytes are the identity.
 */
export function fileDigest(bytes: Uint8Array | string): Digest {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

export function isDigest(value: unknown): value is Digest {
  return typeof value === 'string' && DIGEST_PATTERN.test(value);
}
