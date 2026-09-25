/**
 * Small, shared semantic checks used by every contract kind.
 */

import { diagnostic, type Diagnostic } from './diagnostics.ts';

/** Reports every identifier that appears more than once in a collection. */
export function uniqueIds(items: readonly { id: string }[] | undefined, path: string, ref: string): Diagnostic[] {
  const found: Diagnostic[] = [];
  const seen = new Map<string, number>();
  (items ?? []).forEach((item, index) => {
    const first = seen.get(item.id);
    if (first === undefined) seen.set(item.id, index);
    else found.push(diagnostic('CONTRACT_DUPLICATE_ITEM_ID', `'${item.id}' is declared twice (indexes ${first} and ${index})`, { ref, path: `${path}/${index}/id` }));
  });
  return found;
}

/** True when the text is an RFC 3339 timestamp that denotes a real instant. */
export function isRealTimestamp(value: string): boolean {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second] = match.map(Number) as number[];
  if (Number.isNaN(Date.parse(value))) return false;
  const probe = new Date(Date.UTC(year as number, (month as number) - 1, day as number));
  return (
    probe.getUTCMonth() === (month as number) - 1 &&
    probe.getUTCDate() === day &&
    (hour as number) < 24 &&
    (minute as number) < 60 &&
    (second as number) < 60
  );
}

export function timestamp(value: string | undefined, path: string, ref: string): Diagnostic[] {
  if (value === undefined || isRealTimestamp(value)) return [];
  return [diagnostic('CONTRACT_INVALID_TIMESTAMP', `'${value}' is not a real RFC 3339 instant`, { ref, path })];
}

/** Reports references to identifiers that are not in the known set. */
export function knownIds(
  values: readonly string[] | undefined,
  known: ReadonlySet<string>,
  path: string,
  ref: string,
  code: Parameters<typeof diagnostic>[0],
  label: string,
): Diagnostic[] {
  const found: Diagnostic[] = [];
  (values ?? []).forEach((value, index) => {
    if (!known.has(value)) found.push(diagnostic(code, `unknown ${label} '${value}'`, { ref, path: `${path}/${index}` }));
  });
  return found;
}

export function idSet(items: readonly { id: string }[] | undefined): Set<string> {
  return new Set((items ?? []).map((item) => item.id));
}
