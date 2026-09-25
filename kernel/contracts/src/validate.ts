/**
 * Validation of one contract document.
 *
 * Order: JSON object → canonical JSON → known kind → version seam (migration or
 * UNSUPPORTED) → published schema → timestamps and supersession → authority →
 * kind semantics. Semantic rules only run on structurally valid documents, so
 * they can rely on the schema instead of re-checking shapes.
 */

import { authorityDiagnostics } from './authority.ts';
import { contractDigest, documentRef } from './identity.ts';
import { CanonicalJsonError, canonicalize, deepFreeze } from './primitives/canonical-json.ts';
import { timestamp } from './primitives/checks.ts';
import { diagnostic, hasErrors, sortDiagnostics, type Diagnostic } from './primitives/diagnostics.ts';
import type { Digest } from './primitives/digest.ts';
import { formatRef, isContractKind } from './primitives/refs.ts';
import { DEFAULT_MIGRATIONS, migrateToCurrent, type MigrationRegistry } from './primitives/versioning.ts';
import { CONTRACT_REGISTRY } from './registry.ts';
import { schemaDiagnostics } from './schema-validation.ts';
import type { AnyContract } from './types.ts';

export interface ValidateOptions {
  migrations?: MigrationRegistry;
}

export interface ContractValidation {
  /** The validated (and, if needed, migrated) document, deeply frozen; null when unusable. */
  document: AnyContract | null;
  ref: string | null;
  digest: Digest | null;
  migrated: { from: string; to: string }[];
  diagnostics: Diagnostic[];
  valid: boolean;
}

function provisionalRef(input: Record<string, unknown>): string | undefined {
  const metadata = input.metadata as Record<string, unknown> | undefined;
  const kind = input.kind;
  if (!isContractKind(kind) || !metadata) return undefined;
  const { id, revision } = metadata;
  if (typeof id !== 'string' || typeof revision !== 'number') return undefined;
  return formatRef({ kind, id, revision });
}

function result(diagnostics: Diagnostic[], extra: Partial<ContractValidation> = {}): ContractValidation {
  const sorted = sortDiagnostics(diagnostics);
  return {
    document: null,
    ref: null,
    digest: null,
    migrated: [],
    ...extra,
    diagnostics: sorted,
    valid: !hasErrors(sorted),
  };
}

export function validateContract(input: unknown, options: ValidateOptions = {}): ContractValidation {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return result([diagnostic('CONTRACT_NOT_AN_OBJECT', 'a contract document is a JSON object')]);
  }
  const raw = input as Record<string, unknown>;
  const ref = provisionalRef(raw);
  try {
    canonicalize(raw);
  } catch (error) {
    if (!(error instanceof CanonicalJsonError)) throw error;
    return result([diagnostic('CONTRACT_NOT_CANONICAL_JSON', error.message, { ref, path: error.path || '/' })]);
  }
  if (!isContractKind(raw.kind)) {
    return result([diagnostic('CONTRACT_UNKNOWN_KIND', `unknown contract kind '${String(raw.kind)}'`, { ref, path: '/kind' })]);
  }
  const kind = raw.kind;
  const migration = migrateToCurrent(kind, raw, options.migrations ?? DEFAULT_MIGRATIONS, ref);
  if (!migration.document) return result(migration.diagnostics, { migrated: migration.applied });

  const structural = schemaDiagnostics(kind, migration.document, ref);
  if (structural.length > 0) return result(structural, { migrated: migration.applied });

  const document = deepFreeze(structuredClone(migration.document)) as unknown as AnyContract;
  const stableRef = documentRef(document);
  const found: Diagnostic[] = [...timestamp(document.metadata.acceptance?.at, '/metadata/acceptance/at', stableRef)];
  const { supersedes } = document.metadata;
  if (supersedes && (supersedes.kind !== document.kind || supersedes.id !== document.metadata.id || supersedes.revision >= document.metadata.revision)) {
    found.push(
      diagnostic('CONTRACT_INVALID_SUPERSESSION', `${stableRef} cannot supersede ${formatRef(supersedes)}`, {
        ref: stableRef,
        path: '/metadata/supersedes',
      }),
    );
  }
  const definition = CONTRACT_REGISTRY[kind];
  found.push(...authorityDiagnostics(definition.stateClass, document, stableRef));
  found.push(...definition.validate(document, stableRef));
  return result(found, { document, ref: stableRef, digest: contractDigest(document), migrated: migration.applied });
}
