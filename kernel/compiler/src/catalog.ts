/**
 * Extension catalog — what the compiler may resolve components against,
 * declared as data. Before the Adapter Protocol (E2) the catalog only
 * describes extensions; E2 turns adapter manifests into these descriptors.
 *
 * Runtime names live here, in data, never in kernel code (TA-04). A catalog
 * never lets resolution pick arbitrarily: two descriptors covering the same
 * component kind and runtime (or capability and runtime) are refused.
 */

import { diagnostic, digestOf, sortDiagnostics, type Diagnostic, type Digest } from '@enistere/foundation-kernel-contracts';

export interface RuntimeAdapterDescriptor {
  id: string;
  version: string;
  componentKinds: string[];
  runtime: string;
}

export interface CapabilityProviderDescriptor {
  id: string;
  version: string;
  capability: string;
  runtimes: string[];
}

export interface ExtensionCatalog {
  runtimeAdapters: RuntimeAdapterDescriptor[];
  capabilityProviders: CapabilityProviderDescriptor[];
}

export const EMPTY_CATALOG: ExtensionCatalog = Object.freeze({ runtimeAdapters: [], capabilityProviders: [] }) as ExtensionCatalog;

const ID = /^[a-z][a-z0-9]*(?:[-.][a-z0-9]+)*$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;
const LAYER = { layer: 'kernel.compiler' } as const;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNameList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && ID.test(item)) && new Set(value).size === value.length;

function checkEntry(entry: unknown, path: string, keys: readonly string[], lists: readonly string[], names: readonly string[], found: Diagnostic[]): boolean {
  if (!isRecord(entry)) {
    found.push(diagnostic('CATALOG_INVALID', 'a descriptor must be an object', { ...LAYER, path }));
    return false;
  }
  let valid = true;
  const unknown = Object.keys(entry).filter((key) => !keys.includes(key));
  if (unknown.length > 0) {
    found.push(diagnostic('CATALOG_INVALID', `unknown fields: ${unknown.sort().join(', ')}`, { ...LAYER, path }));
    valid = false;
  }
  if (typeof entry.id !== 'string' || !ID.test(entry.id)) {
    found.push(diagnostic('CATALOG_INVALID', 'id must be a lowercase identifier', { ...LAYER, path: `${path}/id` }));
    valid = false;
  }
  if (typeof entry.version !== 'string' || !SEMVER.test(entry.version)) {
    found.push(diagnostic('CATALOG_INVALID', 'version must be SemVer', { ...LAYER, path: `${path}/version` }));
    valid = false;
  }
  for (const key of names) {
    if (typeof entry[key] !== 'string' || !ID.test(entry[key] as string)) {
      found.push(diagnostic('CATALOG_INVALID', `${key} must be a lowercase identifier`, { ...LAYER, path: `${path}/${key}` }));
      valid = false;
    }
  }
  for (const key of lists) {
    if (!isNameList(entry[key])) {
      found.push(diagnostic('CATALOG_INVALID', `${key} must be a non-empty list of unique identifiers`, { ...LAYER, path: `${path}/${key}` }));
      valid = false;
    }
  }
  return valid;
}

export interface CatalogValidation {
  catalog: ExtensionCatalog | null;
  digest: Digest | null;
  diagnostics: Diagnostic[];
}

/** Validates a catalog read from data. A catalog with any error is never used. */
export function validateCatalog(input: unknown): CatalogValidation {
  const found: Diagnostic[] = [];
  if (!isRecord(input) || !Array.isArray(input.runtimeAdapters) || !Array.isArray(input.capabilityProviders)) {
    return { catalog: null, digest: null, diagnostics: [diagnostic('CATALOG_INVALID', 'expected { runtimeAdapters: [], capabilityProviders: [] }', LAYER)] };
  }
  const extra = Object.keys(input).filter((key) => !['runtimeAdapters', 'capabilityProviders', '$comment'].includes(key));
  if (extra.length > 0) found.push(diagnostic('CATALOG_INVALID', `unknown fields: ${extra.sort().join(', ')}`, LAYER));

  const adapters = input.runtimeAdapters as unknown[];
  const providers = input.capabilityProviders as unknown[];
  const adaptersValid = adapters.map((entry, index) =>
    checkEntry(entry, `/runtimeAdapters/${index}`, ['id', 'version', 'componentKinds', 'runtime'], ['componentKinds'], ['runtime'], found),
  );
  const providersValid = providers.map((entry, index) =>
    checkEntry(entry, `/capabilityProviders/${index}`, ['id', 'version', 'capability', 'runtimes'], ['runtimes'], ['capability'], found),
  );
  if (adaptersValid.includes(false) || providersValid.includes(false)) return { catalog: null, digest: null, diagnostics: sortDiagnostics(found) };

  const catalog: ExtensionCatalog = {
    runtimeAdapters: adapters as RuntimeAdapterDescriptor[],
    capabilityProviders: providers as CapabilityProviderDescriptor[],
  };
  const ids = new Map<string, string>();
  const claim = (id: string, path: string) => {
    const other = ids.get(id);
    if (other !== undefined) found.push(diagnostic('CATALOG_DUPLICATE_ID', `'${id}' is declared at ${other} and ${path}`, { ...LAYER, path }));
    else ids.set(id, path);
  };
  const coverage = new Map<string, string>();
  const cover = (key: string, label: string, path: string) => {
    const other = coverage.get(key);
    if (other !== undefined) found.push(diagnostic('CATALOG_OVERLAPPING_COVERAGE', `${label} is covered by ${other} and by the descriptor at ${path}`, { ...LAYER, path }));
    else coverage.set(key, path);
  };
  catalog.runtimeAdapters.forEach((adapter, index) => {
    const path = `/runtimeAdapters/${index}`;
    claim(adapter.id, path);
    for (const kind of adapter.componentKinds) cover(`adapter\u0000${kind}\u0000${adapter.runtime}`, `component kind '${kind}' on runtime '${adapter.runtime}'`, path);
  });
  catalog.capabilityProviders.forEach((provider, index) => {
    const path = `/capabilityProviders/${index}`;
    claim(provider.id, path);
    for (const runtime of provider.runtimes) cover(`capability\u0000${provider.capability}\u0000${runtime}`, `capability '${provider.capability}' on runtime '${runtime}'`, path);
  });
  const diagnostics = sortDiagnostics(found);
  if (diagnostics.some((item) => item.severity === 'error')) return { catalog: null, digest: null, diagnostics };
  return { catalog, digest: digestOf(catalog), diagnostics };
}
