/**
 * Adapter manifests — the declaration an extension makes before it runs
 * (document 03 §6.10): what it realizes, how it executes, what it may touch
 * and how its output is verified.
 *
 * A manifest is validated against the published schema by the kernel's schema
 * interpreter, then converted into catalog descriptors: the E1 extension
 * catalog stays the single input of resolution (`validateCatalog`).
 */

import { readFileSync } from 'node:fs';

import { validateCatalog, type CatalogValidation, type ExtensionCatalog } from '@enistere/foundation-kernel-compiler';
import { diagnostic, jsonSchemaDiagnostics, sortDiagnostics, type Diagnostic } from '@enistere/foundation-kernel-contracts';

export const ADAPTER_PROTOCOL = 'foundation.enistere.com/adapter-protocol/v0';

export const MANIFEST_SCHEMA: Record<string, unknown> = JSON.parse(
  readFileSync(new URL('../schemas/adapter-manifest.v0.schema.json', import.meta.url), 'utf8'),
) as Record<string, unknown>;

export type ExecutionMode = 'TRUSTED_IN_PROCESS' | 'ISOLATED_PROCESS' | 'CONTAINER' | 'REMOTE_WORKER' | 'EXTERNAL_SERVICE';
export type VerificationLevel = 'STRUCTURAL' | 'TOOLCHAIN';

export interface VerificationCheck {
  id: string;
  level: VerificationLevel;
  statement: string;
}

export interface AdapterManifest {
  protocol: typeof ADAPTER_PROTOCOL;
  id: string;
  extensionType: 'RUNTIME_ADAPTER';
  version: string;
  maintainer: string;
  supports: { componentKinds: string[]; runtime: string };
  capabilities: string[];
  execution: { mode: ExecutionMode };
  permissions: { filesystem: 'WORKSPACE_WRITE'; network: 'NONE' | 'TOOLCHAIN_ONLY'; secrets: 'NONE' };
  tools: { name: string; version: string }[];
  determinism: 'DETERMINISTIC';
  verification: VerificationCheck[];
  entry: string;
}

const LAYER = { layer: 'kernel.extensions' } as const;

export function validateManifest(value: unknown, ref?: string): { manifest: AdapterManifest | null; diagnostics: Diagnostic[] } {
  const found = jsonSchemaDiagnostics(MANIFEST_SCHEMA, value, { code: 'MANIFEST_INVALID', ref, ...LAYER });
  if (found.length > 0) return { manifest: null, diagnostics: sortDiagnostics(found) };
  const manifest = value as AdapterManifest;
  const ids = manifest.verification.map((check) => check.id);
  if (new Set(ids).size !== ids.length) {
    return { manifest: null, diagnostics: [diagnostic('MANIFEST_INVALID', 'verification check ids must be unique', { ...LAYER, ref, path: '/verification' })] };
  }
  if (!manifest.verification.some((check) => check.level === 'STRUCTURAL')) {
    return { manifest: null, diagnostics: [diagnostic('MANIFEST_INVALID', 'at least one STRUCTURAL check is required', { ...LAYER, ref, path: '/verification' })] };
  }
  return { manifest, diagnostics: [] };
}

/**
 * Descriptors of the given manifests, validated by the E1 catalog rules
 * (unique ids, no overlapping coverage). Manifest `capabilities` become
 * capability providers for the manifest's runtime.
 */
export function catalogFromManifests(manifests: readonly AdapterManifest[]): CatalogValidation {
  const ids = new Map<string, number>();
  const duplicates: Diagnostic[] = [];
  manifests.forEach((manifest, index) => {
    if (ids.has(manifest.id)) duplicates.push(diagnostic('MANIFEST_DUPLICATE_ID', `extension '${manifest.id}' is declared twice`, { ...LAYER, details: { id: manifest.id } }));
    ids.set(manifest.id, index);
  });
  if (duplicates.length > 0) return { catalog: null, digest: null, diagnostics: duplicates };
  const sorted = [...manifests].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const catalog: ExtensionCatalog = {
    runtimeAdapters: sorted.map((manifest) => ({
      id: manifest.id,
      version: manifest.version,
      componentKinds: [...manifest.supports.componentKinds],
      runtime: manifest.supports.runtime,
    })),
    capabilityProviders: sorted.flatMap((manifest) =>
      manifest.capabilities.map((capability) => ({
        id: `${manifest.id}.${capability}`,
        version: manifest.version,
        capability,
        runtimes: [manifest.supports.runtime],
      })),
    ),
  };
  return validateCatalog(catalog);
}
