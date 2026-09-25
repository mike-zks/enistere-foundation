/**
 * Resolution — selects, for every component of the IR, the runtime adapter
 * and the capability providers of the catalog that realize it (document 03:
 * ResolvedSystem).
 *
 * Diagnostics name the System Definition and carry the component in their
 * details: the IR is sorted, so its positions are not authoring positions.
 *
 * Rules, all deterministic:
 * - runtime preferences are tried in their declared order; the first one with
 *   an adapter for the component kind is selected; skipping a preference is
 *   reported (RESOLVE_PREFERENCE_FALLBACK), never silent;
 * - a component without adapter is UNSUPPORTED and listed; it is never
 *   planned by fallback;
 * - each platform capability of a resolved component is bound to the provider
 *   covering the selected runtime, or listed as UNSUPPORTED.
 */

import { diagnostic, digestOf, sortDiagnostics, type Diagnostic, type Digest } from '@enistere/foundation-kernel-contracts';

import type { ExtensionCatalog } from './catalog.ts';
import type { SystemIR } from './ir.ts';

export interface ExtensionRef {
  id: string;
  version: string;
}

export interface ResolvedCapability {
  id: string;
  status: 'BOUND' | 'UNSUPPORTED';
  provider: ExtensionRef | null;
}

export interface ResolvedComponent {
  id: string;
  kind: string;
  status: 'RESOLVED' | 'UNSUPPORTED';
  runtime: string | null;
  adapter: ExtensionRef | null;
  capabilities: ResolvedCapability[];
}

export interface UnsupportedItem {
  component: string;
  capability: string | null;
  code: 'RESOLVE_NO_RUNTIME_PREFERENCE' | 'RESOLVE_NO_ADAPTER' | 'RESOLVE_NO_CAPABILITY_PROVIDER';
}

export interface ResolvedSystem {
  system: string;
  ir: Digest;
  catalog: Digest;
  components: ResolvedComponent[];
  unsupported: UnsupportedItem[];
  digest: Digest;
}

const LAYER = { layer: 'kernel.compiler' } as const;

export function resolveSystem(ir: SystemIR, catalog: ExtensionCatalog, catalogDigest: Digest): { resolved: ResolvedSystem; diagnostics: Diagnostic[] } {
  const found: Diagnostic[] = [];
  const unsupported: UnsupportedItem[] = [];
  const ref = ir.definition;

  const components = ir.components.map((component): ResolvedComponent => {
    const preferences = component.runtime.preferences;
    const unresolved = (): ResolvedComponent => ({ id: component.id, kind: component.kind, status: 'UNSUPPORTED', runtime: null, adapter: null, capabilities: [] });
    if (preferences.length === 0) {
      found.push(diagnostic('RESOLVE_NO_RUNTIME_PREFERENCE', `component '${component.id}' declares no runtime preference`, { ...LAYER, ref, details: { component: component.id } }));
      unsupported.push({ component: component.id, capability: null, code: 'RESOLVE_NO_RUNTIME_PREFERENCE' });
      return unresolved();
    }
    const skipped: string[] = [];
    for (const runtime of preferences) {
      const adapter = catalog.runtimeAdapters.find((candidate) => candidate.runtime === runtime && candidate.componentKinds.includes(component.kind));
      if (!adapter) {
        skipped.push(runtime);
        continue;
      }
      if (skipped.length > 0) {
        found.push(
          diagnostic('RESOLVE_PREFERENCE_FALLBACK', `component '${component.id}' uses runtime '${runtime}': no adapter for ${skipped.map((item) => `'${item}'`).join(', ')}`, {
            ...LAYER,
            ref,
            details: { component: component.id, skipped, selected: runtime },
          }),
        );
      }
      const capabilities = component.platformCapabilities.map((capability): ResolvedCapability => {
        const provider = catalog.capabilityProviders.find((candidate) => candidate.capability === capability.id && candidate.runtimes.includes(runtime));
        if (provider) return { id: capability.id, status: 'BOUND', provider: { id: provider.id, version: provider.version } };
        found.push(
          diagnostic('RESOLVE_NO_CAPABILITY_PROVIDER', `capability '${capability.id}' of component '${component.id}' has no provider for runtime '${runtime}'`, {
            ...LAYER,
            ref,
            details: { component: component.id, capability: capability.id, runtime },
          }),
        );
        unsupported.push({ component: component.id, capability: capability.id, code: 'RESOLVE_NO_CAPABILITY_PROVIDER' });
        return { id: capability.id, status: 'UNSUPPORTED', provider: null };
      });
      return { id: component.id, kind: component.kind, status: 'RESOLVED', runtime, adapter: { id: adapter.id, version: adapter.version }, capabilities };
    }
    found.push(
      diagnostic('RESOLVE_NO_ADAPTER', `component '${component.id}' (kind ${component.kind}) has no adapter for ${preferences.map((item) => `'${item}'`).join(', ')}`, {
        ...LAYER,
        ref,
        details: { component: component.id, kind: component.kind, preferences: [...preferences] },
      }),
    );
    unsupported.push({ component: component.id, capability: null, code: 'RESOLVE_NO_ADAPTER' });
    return unresolved();
  });

  const content = { system: ir.system, ir: ir.digest, catalog: catalogDigest, components, unsupported };
  return { resolved: { ...content, digest: digestOf(content) }, diagnostics: sortDiagnostics(found) };
}
