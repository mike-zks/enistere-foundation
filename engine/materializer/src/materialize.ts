/**
 * MATERIALIZE — applies the MATERIALIZE steps of an execution plan with the
 * adapters of the host, under the ownership rule of the kernel
 * (`decideWrite`).
 *
 * Every component is written into `<workspace>/<component>/`, with an
 * inventory (`.foundation/inventory.json`) of what the compiler wrote. A
 * component with any conflict is not written at all: nothing is overwritten
 * silently, nothing is half-applied. No network access happens here.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

import type { IRComponent, PlanResult } from '@enistere/foundation-kernel-compiler';
import { diagnostic, digestOf, fileDigest, sortDiagnostics, type Diagnostic, type Digest } from '@enistere/foundation-kernel-contracts';
import { ADAPTER_PROTOCOL, decideWrite, planArtifacts, WRITES, type ArtifactPlan, type WriteDecision } from '@enistere/foundation-kernel-extensions';

import type { ExtensionHost } from './host.ts';

export const INVENTORY_PATH = '.foundation/inventory.json';
const LAYER = { layer: 'engine.materializer' } as const;

export interface Inventory {
  protocol: typeof ADAPTER_PROTOCOL;
  system: string;
  definition: { ref: string; digest: Digest };
  plan: Digest;
  component: string;
  adapter: { id: string; version: string };
  artifactPlan: Digest;
  files: { path: string; ownership: string; digest: Digest }[];
}

export interface MaterializationRecord {
  system: string;
  component: string;
  adapter: { id: string; version: string };
  plan: Digest;
  artifactPlan: Digest;
  status: 'APPLIED' | 'CONFLICT';
  files: { path: string; ownership: string; digest: Digest; decision: WriteDecision }[];
  digest: Digest;
}

export interface PlannedComponent {
  component: IRComponent;
  plan: ArtifactPlan;
  contents: Map<string, string>;
}

/**
 * PLAN of the adapters, without I/O: the artifacts every MATERIALIZE step of
 * the execution plan would produce.
 */
export function planMaterialization(result: PlanResult, host: ExtensionHost): { components: PlannedComponent[]; diagnostics: Diagnostic[] } {
  const found: Diagnostic[] = [];
  const components: PlannedComponent[] = [];
  if (!result.plan || !result.ir || !result.definition) return { components, diagnostics: [] };
  const context = { system: result.ir.system, definition: result.definition.ref, domains: result.ir.domains };
  for (const step of result.plan.steps) {
    if (step.action !== 'MATERIALIZE') continue;
    const ref = result.definition.ref;
    const loaded = host.get(step.adapter.id);
    if (!loaded || loaded.manifest.version !== step.adapter.version) {
      found.push(diagnostic('MATERIALIZE_ADAPTER_MISSING', `adapter '${step.adapter.id}@${step.adapter.version}' is not loaded`, { ...LAYER, ref, details: { component: step.component } }));
      continue;
    }
    const component = result.ir.components.find((candidate) => candidate.id === step.component);
    if (!component) continue;
    const reasons = loaded.adapter.validateIntent(component, context);
    if (reasons.length > 0) {
      for (const reason of reasons) {
        found.push(diagnostic('ADAPTER_INTENT_REJECTED', `adapter '${loaded.manifest.id}' rejects '${component.id}': ${reason}`, { ...LAYER, ref, details: { component: component.id } }));
      }
      continue;
    }
    try {
      const { plan, contents } = planArtifacts(loaded.adapter.describe(), component, loaded.adapter.plan(component, context));
      components.push({ component, plan, contents });
    } catch (error) {
      found.push(
        diagnostic('ADAPTER_CONTRACT_VIOLATION', `adapter '${loaded.manifest.id}' produced an invalid plan for '${component.id}': ${error instanceof Error ? error.message : String(error)}`, {
          ...LAYER,
          ref,
          details: { component: component.id },
        }),
      );
    }
  }
  return { components, diagnostics: sortDiagnostics(found) };
}

function readInventory(directory: string): Inventory | null {
  const path = join(directory, INVENTORY_PATH);
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Inventory) : null;
}

/** Applies the plan in `workspace`. */
export function materialize(result: PlanResult, host: ExtensionHost, workspace: string): { records: MaterializationRecord[]; diagnostics: Diagnostic[] } {
  const { components, diagnostics } = planMaterialization(result, host);
  const found = [...diagnostics];
  const records: MaterializationRecord[] = [];
  const root = resolve(workspace);
  for (const { component, plan, contents } of components) {
    const directory = join(root, component.id);
    const previous = readInventory(directory);
    const lastWritten = new Map((previous?.files ?? []).map((file) => [file.path, file.digest]));
    const files = plan.artifacts.map((artifact) => {
      const target = resolve(directory, artifact.path);
      if (!target.startsWith(`${directory}${sep}`)) throw new Error(`artifact path escapes the component directory: ${artifact.path}`);
      const existing = existsSync(target) ? fileDigest(readFileSync(target)) : null;
      return { ...artifact, target, decision: decideWrite(artifact, existing, lastWritten.get(artifact.path) ?? null) };
    });
    const conflicts = files.filter((file) => file.decision === 'CONFLICT');
    for (const conflict of conflicts) {
      found.push(
        diagnostic('MATERIALIZE_CONFLICT', `compiler-owned file '${component.id}/${conflict.path}' was changed outside the compiler`, {
          ...LAYER,
          ref: result.definition?.ref,
          details: { component: component.id, path: conflict.path },
        }),
      );
    }
    if (conflicts.length === 0) {
      for (const file of files) {
        if (!WRITES.has(file.decision)) continue;
        mkdirSync(dirname(file.target), { recursive: true });
        writeFileSync(file.target, contents.get(file.path) as string);
      }
      const inventory: Inventory = {
        protocol: ADAPTER_PROTOCOL,
        system: result.ir?.system as string,
        definition: result.definition as { ref: string; digest: Digest },
        plan: result.plan?.digest as Digest,
        component: component.id,
        adapter: plan.adapter,
        artifactPlan: plan.digest,
        files: plan.artifacts.map(({ path, ownership, digest }) => ({ path, ownership, digest })),
      };
      mkdirSync(join(directory, '.foundation'), { recursive: true });
      writeFileSync(join(directory, INVENTORY_PATH), `${JSON.stringify(inventory, null, 2)}\n`);
    }
    const content = {
      system: result.ir?.system as string,
      component: component.id,
      adapter: plan.adapter,
      plan: result.plan?.digest as Digest,
      artifactPlan: plan.digest,
      status: conflicts.length === 0 ? ('APPLIED' as const) : ('CONFLICT' as const),
      files: files.map(({ path, ownership, digest, decision }) => ({ path, ownership, digest, decision })),
    };
    records.push({ ...content, digest: digestOf(content) });
  }
  return { records, diagnostics: sortDiagnostics(found) };
}
