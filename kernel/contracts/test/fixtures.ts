/**
 * Test fixtures: the committed Asteria golden, read from disk.
 * Negative tests mutate deep copies of these valid documents.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AnyContract, Diagnostic } from '../src/index.ts';

export const GOLDEN_ROOT = fileURLToPath(new URL('../../../goldens/asteria/', import.meta.url));

export function readGoldenFile(relative: string): string {
  return readFileSync(`${GOLDEN_ROOT}${relative}`, 'utf8');
}

export function loadGolden(): AnyContract[] {
  const documents: AnyContract[] = [];
  for (const folder of ['contracts', 'evidence']) {
    for (const name of readdirSync(`${GOLDEN_ROOT}${folder}`).sort()) {
      documents.push(JSON.parse(readGoldenFile(`${folder}/${name}`)) as AnyContract);
    }
  }
  return documents;
}

/** A deep, mutable copy of one golden document. */
export function golden<T extends AnyContract = AnyContract>(kind: AnyContract['kind'], id: string, revision = 1): T {
  const found = loadGolden().find((document) => document.kind === kind && document.metadata.id === id && document.metadata.revision === revision);
  if (!found) throw new Error(`golden ${kind}/${id}@${revision} not found`);
  return structuredClone(found) as T;
}

export function codes(diagnostics: readonly Diagnostic[]): string[] {
  return [...new Set(diagnostics.map((item) => item.code))].sort();
}

/** Replaces one document of the golden set by a mutated copy. */
export function withReplaced(replacement: AnyContract): AnyContract[] {
  return loadGolden().map((document) =>
    document.kind === replacement.kind && document.metadata.id === replacement.metadata.id && document.metadata.revision === replacement.metadata.revision
      ? replacement
      : document,
  );
}
