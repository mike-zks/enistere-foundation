/**
 * Extension host — discovers adapter manifests, validates them and loads the
 * adapters the v0 protocol can run (trusted, in-process). Nothing is imported
 * by name: an adapter is reached only through the `entry` of its manifest.
 *
 * An adapter that cannot run here (another execution mode, a load failure, an
 * identity that contradicts its manifest) is left out of the catalog, so that
 * resolution reports its components as UNSUPPORTED instead of planning them.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { ExtensionCatalog } from '@enistere/foundation-kernel-compiler';
import { diagnostic, sortDiagnostics, type Diagnostic, type Digest } from '@enistere/foundation-kernel-contracts';
import { catalogFromManifests, validateManifest, type AdapterManifest, type RuntimeAdapter } from '@enistere/foundation-kernel-extensions';

export interface LoadedExtension {
  manifest: AdapterManifest;
  /** Manifest path relative to the extension root. */
  source: string;
  adapter: RuntimeAdapter;
}

export interface ExtensionHost {
  root: string;
  extensions: LoadedExtension[];
  catalog: ExtensionCatalog | null;
  catalogDigest: Digest | null;
  diagnostics: Diagnostic[];
  get(id: string): LoadedExtension | undefined;
}

const LAYER = { layer: 'engine.materializer' } as const;

function manifestPaths(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.name !== 'node_modules' && !entry.name.startsWith('.'))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return manifestPaths(path);
      return entry.name === 'manifest.json' ? [path] : [];
    });
}

function isAdapter(value: unknown): value is RuntimeAdapter {
  const candidate = value as Partial<RuntimeAdapter> | null;
  return (
    candidate !== null &&
    typeof candidate === 'object' &&
    typeof candidate.describe === 'function' &&
    typeof candidate.validateIntent === 'function' &&
    typeof candidate.plan === 'function' &&
    typeof candidate.toolchainChecks === 'function'
  );
}

/** Loads every extension found under `root`. */
export async function loadExtensions(root: string): Promise<ExtensionHost> {
  const base = resolve(root);
  const found: Diagnostic[] = [];
  const extensions: LoadedExtension[] = [];
  for (const path of manifestPaths(base)) {
    const source = relative(base, path);
    let value: unknown;
    try {
      value = JSON.parse(readFileSync(path, 'utf8'));
    } catch (error) {
      found.push(diagnostic('MANIFEST_INVALID', `${source} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`, { ...LAYER, ref: source }));
      continue;
    }
    const { manifest, diagnostics } = validateManifest(value, source);
    found.push(...diagnostics);
    if (!manifest) continue;
    if (manifest.execution.mode !== 'TRUSTED_IN_PROCESS') {
      found.push(
        diagnostic('ADAPTER_UNSUPPORTED_EXECUTION_MODE', `extension '${manifest.id}' requires execution mode ${manifest.execution.mode}`, {
          ...LAYER,
          ref: source,
          details: { id: manifest.id, mode: manifest.execution.mode },
        }),
      );
      continue;
    }
    const entry = resolve(path, '..', manifest.entry);
    if (!entry.startsWith(`${resolve(path, '..')}/`)) {
      found.push(diagnostic('ADAPTER_LOAD_FAILED', `extension '${manifest.id}' has an entry outside its directory`, { ...LAYER, ref: source }));
      continue;
    }
    let adapter: unknown;
    try {
      adapter = ((await import(pathToFileURL(entry).href)) as { default?: unknown }).default;
    } catch (error) {
      found.push(diagnostic('ADAPTER_LOAD_FAILED', `extension '${manifest.id}' cannot be loaded: ${error instanceof Error ? error.message : String(error)}`, { ...LAYER, ref: source }));
      continue;
    }
    if (!isAdapter(adapter)) {
      found.push(diagnostic('ADAPTER_LOAD_FAILED', `extension '${manifest.id}' does not export a RuntimeAdapter as default`, { ...LAYER, ref: source }));
      continue;
    }
    const identity = adapter.describe();
    if (identity.id !== manifest.id || identity.version !== manifest.version) {
      found.push(
        diagnostic('ADAPTER_CONTRACT_VIOLATION', `extension '${manifest.id}@${manifest.version}' describes itself as '${identity.id}@${identity.version}'`, {
          ...LAYER,
          ref: source,
        }),
      );
      continue;
    }
    extensions.push({ manifest, source, adapter });
  }
  const catalog = catalogFromManifests(extensions.map((extension) => extension.manifest));
  const byId = new Map(extensions.map((extension) => [extension.manifest.id, extension]));
  return {
    root: base,
    extensions,
    catalog: catalog.catalog,
    catalogDigest: catalog.digest,
    diagnostics: sortDiagnostics([...found, ...catalog.diagnostics]),
    get: (id) => byId.get(id),
  };
}
