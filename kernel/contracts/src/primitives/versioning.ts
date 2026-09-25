/**
 * Version and migration seam.
 *
 * Every contract document declares its schema generation in `apiVersion`. The
 * kernel reads exactly one current generation; an older document is only read
 * after an explicit, registered migration has produced a current one. There is
 * no best-effort reading of an unknown version: it is reported UNSUPPORTED.
 *
 * E0 ships the seam with an empty migration chain (v1alpha1 is the first
 * generation). The mechanism is exercised by tests with a synthetic predecessor
 * so that the first real migration is data, not new kernel code.
 */

import { diagnostic, type Diagnostic } from './diagnostics.ts';
import type { ContractKind } from './refs.ts';

export const CURRENT_API_VERSION = 'foundation.enistere.com/v1alpha1' as const;

export interface ContractMigration {
  kind: ContractKind;
  from: string;
  to: string;
  /** Pure function: returns a new document, never mutates its input. */
  migrate(document: Record<string, unknown>): Record<string, unknown>;
}

export interface MigrationRegistry {
  readonly current: string;
  readonly migrations: readonly ContractMigration[];
}

export function createMigrationRegistry(migrations: readonly ContractMigration[] = [], current = CURRENT_API_VERSION): MigrationRegistry {
  const seen = new Set<string>();
  for (const migration of migrations) {
    const key = `${migration.kind}\u0000${migration.from}`;
    if (seen.has(key)) throw new Error(`Ambiguous migration for ${migration.kind} from ${migration.from}`);
    if (migration.from === migration.to) throw new Error(`Migration for ${migration.kind} does not change the version`);
    seen.add(key);
  }
  return Object.freeze({ current, migrations: Object.freeze([...migrations]) });
}

/** The kernel's registry: no migration exists before the first generation. */
export const DEFAULT_MIGRATIONS = createMigrationRegistry();

export interface MigrationOutcome {
  document: Record<string, unknown> | null;
  applied: { from: string; to: string }[];
  diagnostics: Diagnostic[];
}

/** Brings a document to the current generation through the registered chain, or fails loudly. */
export function migrateToCurrent(
  kind: ContractKind,
  document: Record<string, unknown>,
  registry: MigrationRegistry = DEFAULT_MIGRATIONS,
  ref?: string,
): MigrationOutcome {
  let current = document;
  const applied: { from: string; to: string }[] = [];
  const visited = new Set<string>();
  while (current.apiVersion !== registry.current) {
    const version = typeof current.apiVersion === 'string' ? current.apiVersion : String(current.apiVersion);
    if (visited.has(version)) {
      return {
        document: null,
        applied,
        diagnostics: [diagnostic('CONTRACT_MIGRATION_FAILED', `migration cycle detected at ${version}`, { ref, path: '/apiVersion' })],
      };
    }
    visited.add(version);
    const step = registry.migrations.find((migration) => migration.kind === kind && migration.from === version);
    if (!step) {
      return {
        document: null,
        applied,
        diagnostics: [
          diagnostic('CONTRACT_UNSUPPORTED_API_VERSION', `apiVersion '${version}' is not readable by this kernel (current: ${registry.current})`, {
            ref,
            path: '/apiVersion',
            details: { apiVersion: version, current: registry.current },
          }),
        ],
      };
    }
    const next = step.migrate(structuredClone(current));
    if (next.apiVersion !== step.to) {
      return {
        document: null,
        applied,
        diagnostics: [diagnostic('CONTRACT_MIGRATION_FAILED', `migration ${step.from} → ${step.to} produced ${String(next.apiVersion)}`, { ref, path: '/apiVersion' })],
      };
    }
    applied.push({ from: step.from, to: step.to });
    current = next;
  }
  return { document: current, applied, diagnostics: [] };
}
