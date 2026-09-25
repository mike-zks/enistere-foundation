/**
 * Canonical JSON serialization (RFC 8785 — JSON Canonicalization Scheme).
 *
 * Object keys are sorted by UTF-16 code units (the default JavaScript sort) and
 * numbers use the ECMAScript serialization, which is exactly what JCS mandates.
 * Anything that is not plain JSON — undefined, functions, symbols, bigint,
 * non-finite numbers, class instances (Date, Map...) — is rejected loudly rather
 * than silently dropped: a digest must never hide a lossy serialization.
 */

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export class CanonicalJsonError extends Error {
  readonly path: string;

  constructor(message: string, path: string) {
    super(`${message} at ${path || '/'}`);
    this.name = 'CanonicalJsonError';
    this.path = path;
  }
}

function escapePointer(segment: string): string {
  return segment.replaceAll('~', '~0').replaceAll('/', '~1');
}

function isPlainObject(value: object): boolean {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function serialize(value: unknown, path: string): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(value)) throw new CanonicalJsonError('non-finite number', path);
      return JSON.stringify(value);
    case 'object': {
      if (Array.isArray(value)) {
        return `[${value.map((item, index) => serialize(item, `${path}/${index}`)).join(',')}]`;
      }
      if (!isPlainObject(value)) throw new CanonicalJsonError('non-plain object', path);
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record).sort();
      const members = keys.map((key) => `${JSON.stringify(key)}:${serialize(record[key], `${path}/${escapePointer(key)}`)}`);
      return `{${members.join(',')}}`;
    }
    default:
      throw new CanonicalJsonError(`unsupported ${typeof value} value`, path);
  }
}

/** RFC 8785 canonical serialization. Throws CanonicalJsonError on non-JSON input. */
export function canonicalize(value: unknown): string {
  return serialize(value, '');
}

/** Deep structural equality through the canonical form. */
export function canonicalEquals(left: unknown, right: unknown): boolean {
  return canonicalize(left) === canonicalize(right);
}

/** Recursively freezes plain objects and arrays; returns the same reference. */
export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const key of Object.keys(value as object)) deepFreeze((value as Record<string, unknown>)[key]);
  return value;
}
